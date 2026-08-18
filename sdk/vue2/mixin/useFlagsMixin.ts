import type { FlagClient } from 'flagmint-js-sdk';

type FlagsMixinThis = {
  $nextTick(arg0: () => void): unknown;
  $watch(arg0: string, arg1: (val: any) => void): () => void;
  $flagmintInit: () => Promise<FlagClient<any>>;
  $flagmint: FlagClient<any> | null;
  $flagmintReady: boolean; // It's a ref<boolean>, not a Promise
  flagClient: FlagClient<any> | null;
  isFlagReady: boolean;
  flags: Record<string, unknown>;
  getFlag: (key: string, fallback?: any) => any;
  _flagmintUnsubscribe: (() => void) | null;
  _startFlagSubscription: () => void;
  updateFlagmintContext: (context: Record<string, any>) => Promise<void>;
  trackError: (flagKey: string, error?: unknown, extra?: Record<string, unknown>) => void;
  track: (flagKey: string, eventName: string, extra?: Record<string, unknown>) => void;
};

export const useFlagsMixin: {
  data: () => {
    isFlagReady: boolean;
    flagClient: FlagClient<any> | null;
    flags: Record<string, unknown>;
    _flagmintUnsubscribe: (() => void) | null;
  };
  created(this: FlagsMixinThis): void;
  beforeDestroy(this: FlagsMixinThis): void;
  methods: {
    getFlag(this: FlagsMixinThis, key: string, fallback?: any): any;
    _startFlagSubscription(this: FlagsMixinThis): void;
    updateFlagmintContext(this: FlagsMixinThis, context: Record<string, any>): Promise<void>;
    trackError(this: FlagsMixinThis, flagKey: string, error?: unknown, extra?: Record<string, unknown>): void;
    track(this: FlagsMixinThis, flagKey: string, eventName: string, extra?: Record<string, unknown>): void;
  };
} & ThisType<FlagsMixinThis> = {
  data() {
    return {
      isFlagReady: false,
      flagClient: null,
      flags: {},                    // Reactive snapshot — updated on every push
      _flagmintUnsubscribe: null,   // Holds the unsubscribe function
    };
  },

  created() {
    if (this.$flagmintReady) {
      // Already ready at creation time (e.g. deferred component)
      this.flagClient = this.$flagmint;
      this.isFlagReady = true;
      this._startFlagSubscription();
    } else if (typeof this.$flagmintInit === 'function') {
      // Not ready yet — call init and wait
      this.$flagmintInit().then((client) => {
        this.flagClient = client;
        this.isFlagReady = true;
        this._startFlagSubscription();
      });
    } else {
      // Watch for $flagmintReady to become true (plugin provided it as a reactive ref)
      this.$watch('$flagmintReady', (val: boolean) => {
        if (val) {
          this.flagClient = this.$flagmint;
          this.isFlagReady = true;
          this._startFlagSubscription();
        }
      });
    }
  },

  beforeDestroy() {
    // Clean up subscription — never call destroy() on the shared client
    if (this._flagmintUnsubscribe) {
      this._flagmintUnsubscribe();
      this._flagmintUnsubscribe = null;
    }
  },

  methods: {
    _startFlagSubscription() {
      const client = this.flagClient;
      if (!client || this._flagmintUnsubscribe) return;

      // subscribe() calls back immediately with current flags,
      // then on every SSE push — updates this.flags reactively
      this._flagmintUnsubscribe = client.subscribe((updatedFlags) => {
        this.flags = updatedFlags as Record<string, unknown>;
      });
    },

    getFlag(key, fallback) {
      // Reads from reactive this.flags — re-renders on every push
      return (this.flags[key] ?? fallback);
    },
    async updateFlagmintContext(context: Record<string, any>) {
      if (this.flagClient && typeof this.flagClient.updateContext === 'function') {
        await this.flagClient.updateContext(context);
      } else {
        console.warn('[Flagmint] updateFlagmintContext called before client was ready.');
      }
    },
    trackError(flagKey, error, extra) {
      this.flagClient?.trackError?.(flagKey, error, extra);
    },
    track(flagKey, eventName, extra) {
      this.flagClient?.track?.(flagKey, eventName, extra);
    },
  },
};
