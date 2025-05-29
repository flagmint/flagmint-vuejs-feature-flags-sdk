import { getReactiveMaker } from '@/core/helpers/reactivityHelper';
import {
  loadCachedFlags,
  saveCachedFlags,
  loadCachedContext,
  saveCachedContext,
  FeatureFlags
} from '@/core/helpers/cacheHelper';
import type { Transport } from '@/core/transports/Transport';
import { LongPollingTransport } from '@/core/transports/LongPollingTransport';
import { WebSocketTransport } from '@/core/transports/WebsocketTransport';
import { FlagValue } from '@/core/evaluation/types';
import { evaluateFlagValue } from '@/core/evaluation/evaluateFlagValue';

type TransportMode = 'auto' | 'websocket' | 'long-polling';

export interface FlagClientOptions<C extends Record<string, any> = Record<string, any>> {
  apiKey: string;
  context?: C;
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
  enableOfflineCache?: boolean;
  persistContext?: boolean;
  cacheTTL?: number; // ms, optional. Default: 24h
  transport?: Transport<C, any>;
  transportMode?: TransportMode;
  onError?: (error: Error) => void;
  previewMode?: boolean;
  rawFlags?: Record<string, FlagValue>;
}

const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000;
const REST_ENDPOINT = 'https://api.flagmint.io/evaluate';
const WS_ENDPOINT = 'wss://api.flagmint.io/flags/ws';

export class FlagClient<T = unknown, C extends Record<string, any> = Record<string, any>> {
  private apiKey: string;
  private context: C;
  private flags: FeatureFlags<T> = {};
  private reactiveFlags: FeatureFlags<T>;
  private refreshIntervalId: NodeJS.Timeout | null = null;
  private enableOfflineCache: boolean;
  private persistContext: boolean;
  private cacheTTL: number;
  private transport!: Transport<C, T>;

  private readyPromise!: Promise<void>;
  private resolveReady!: () => void;
  private rejectReady!: (reason?: any) => void;
  private onError?: (error: Error) => void;
  private previewMode: boolean;
  private rawFlags: Record<string, FlagValue> = {};
  /**
   * Creates a new FlagClient instance.
   * @param options - Configuration options for the client.
   */
  constructor(options: FlagClientOptions<C>) {
    const makeReactive = getReactiveMaker();
    this.apiKey = options.apiKey;
    this.enableOfflineCache = options.enableOfflineCache ?? true;
    this.persistContext = options.persistContext ?? false;
    this.cacheTTL = options.cacheTTL ?? DEFAULT_CACHE_TTL;
    this.onError = options.onError;
    const storedContext = this.persistContext ? loadCachedContext<C>(this.apiKey) : null;
    this.context = storedContext || (options.context || ({} as C));
    
    this.rawFlags = options.rawFlags ?? {};
    this.reactiveFlags = makeReactive(this.flags);

    const isDev =
    typeof process !== 'undefined' &&
    process.env &&
    process.env.NODE_ENV !== 'production';

    if (options.previewMode && !isDev) {
      console.warn('[Flagmint] ⚠️ Preview mode is disabled in production. Falling back to server-side evaluation.');
      this.previewMode = false;
    } else {
      this.previewMode = !!options.previewMode;
    }
    // ✅ Local-only evaluation
    if (this.previewMode) {
      const evaluated = this.evaluateLocally(this.rawFlags as Record<string, FlagValue<T>>, this.context);
      this.flags = evaluated;
      Object.assign(this.reactiveFlags, evaluated);

      this.readyPromise = Promise.resolve(); // immediately ready
      this.resolveReady = () => { }; // no-op
      this.rejectReady = () => { }; // no-op
      return;
    }

    if (this.enableOfflineCache) {
      const cached = loadCachedFlags<T>(this.apiKey, this.cacheTTL);
      if (cached) {
        this.flags = cached;
        Object.assign(this.reactiveFlags, cached);
      }
    }

    if (options.autoRefresh) {
      this.refreshIntervalId = setInterval(
        () => this.fetchFlags(),
        options.refreshIntervalMs || 10000
      );
    }

    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });

    void this.setupTransport(options);
  }

  private async setupTransport(options: FlagClientOptions<C>): Promise<void> {
    const mode = options.transportMode ?? 'auto';

    const useWebSocket = async (): Promise<Transport<C, T>> => {
      const ws = new WebSocketTransport<C, T>(WS_ENDPOINT, this.apiKey);
      await ws.init();
      return ws;
    };

    const useLongPolling = (): Transport<C, T> => {
      return new LongPollingTransport<C, T>(REST_ENDPOINT, this.apiKey);
    };

    try {
      if (mode === 'websocket') {
        this.transport = await useWebSocket();
      } else if (mode === 'long-polling') {
        this.transport = useLongPolling();
      } else {
        try {
          this.transport = await useWebSocket();
        } catch (e) {
          console.warn('[FlagClient] WebSocket connection failed, falling back to long polling');
          this.transport = useLongPolling();
        }
      }

      const data = await this.transport.fetchFlags(this.context);
      Object.assign(this.reactiveFlags, data);
      this.flags = data;

      if (typeof this.transport.onFlagsUpdated === 'function') {
        this.transport.onFlagsUpdated((updatedFlags) => {
          Object.keys(this.reactiveFlags).forEach(key => delete this.reactiveFlags[key]);
          Object.assign(this.reactiveFlags, updatedFlags);
          this.flags = updatedFlags;

          if (this.enableOfflineCache) {
            saveCachedFlags<T>(this.apiKey, updatedFlags);
          }
        });
      }
      this.resolveReady(); // ✅ resolve when setup is complete
    } catch (err) {
      this.rejectReady(err); // ❌ fail fast
      console.error('[FlagClient] Failed to initialize transport:', err);
      if (this.onError) {
        this.onError(err instanceof Error ? err : new Error(String(err)));
      }
      throw err;
    }
  }

  getReactiveFlags(): FeatureFlags<T> {
    return this.reactiveFlags;
  }

  async fetchFlags(): Promise<FeatureFlags<T>> {
    try {
      const data = await this.transport.fetchFlags(this.context);
      Object.keys(this.reactiveFlags).forEach(key => delete this.reactiveFlags[key]);
      Object.assign(this.reactiveFlags, data);
      this.flags = data;

      if (this.enableOfflineCache) {
        saveCachedFlags<T>(this.apiKey, data);
      }

      return data;
    } catch (error) {
      console.error('[FlagClient] Failed to fetch flags', error);
      return this.flags;
    }
  }

  getFlag<K extends keyof FeatureFlags<T>>(key: K, fallback?: FeatureFlags<T>[K]): FeatureFlags<T>[K] {
    return this.flags[key] ?? fallback!;
  }

  updateContext(context: C) {
    this.context = { ...this.context, ...context };
    if (this.persistContext) {
      saveCachedContext<C>(this.apiKey, this.context);
    }
  }

  destroy() {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }
    this.transport.destroy();
  }

  async ready(): Promise<void> {
    return this.readyPromise;
  }

  private evaluateLocally(flags: Record<string, FlagValue<T>>, context: C): Record<string, T> {
    const result: Record<string, T> = {};
    for (const key in flags) {
      const evaluated = evaluateFlagValue(flags[key], context);
      if (evaluated !== null) {
        result[key] = evaluated;
      }
      // Optionally, handle the case where evaluated is null (e.g., set a default value)
    }
    return result;
  }

}