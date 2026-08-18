import { isVue2, isVue3 } from 'vue-demi';
import { FlagClient, FlagClientOptions } from 'flagmint-js-sdk';
import { readonly, ref, Ref, triggerRef } from 'vue-demi';
import { FLAGMINT_READY, FLAGMINT_CLIENT, FLAGMINT_INIT, FLAGMINT_STATE } from '@/types';

const WRAPPER_INFO = { name: 'flagmint-vuejs-feature-flags', version: '1.4.0' };

// Extend the core options specifically for this framework environment
export interface FrameworkFlagClientOptions<C extends Record<string, any>> extends FlagClientOptions<C> {
  deferInitialization?: boolean;
  syncCrossIframes?: boolean;
  syncNamespace?: string;
}

function buildClientOptions<C extends Record<string, any>>(
  pureOptions: FlagClientOptions<C>
): FlagClientOptions<C> {
  return {
    transportMode: 'auto',
    ...pureOptions,
    wrapperInfo: pureOptions.wrapperInfo ?? WRAPPER_INFO,
  };
}

const createFeatureFlagPlugin = <
  T = unknown,
  C extends Record<string, any> = Record<string, any>
>(
  options: FrameworkFlagClientOptions<C>
) => ({
  install(appOrVue: any) {
    // Scoped to this install call — no shared module-level state
    const flagClientRef: Ref<FlagClient<T, C> | null> = ref(null);
    const readyRef = ref(false);
    const flagStateRef = ref(0);
    //single in-flight promise shared across all concurrent init() callers
    let initPromise: Promise<FlagClient<T, C>> | null = null;
    // Provide early — inject() in components will see these immediately,
    // flagClientRef.value is null until init() resolves which is expected
    if (isVue3) {
      appOrVue.provide(FLAGMINT_READY, readonly(readyRef));
      appOrVue.provide(FLAGMINT_CLIENT, flagClientRef);
      appOrVue.provide(FLAGMINT_STATE, readonly(flagStateRef));
    }

    const {
      deferInitialization,
      syncCrossIframes,
      syncNamespace,
      ...pureOptions
    } = options;

    const setupCrossIframeSync = (
      resolveInit: (client: any) => void,
      clientOptions: FlagClientOptions<C>
    ) => {
      const ns = options.syncNamespace || 'default_global';
      const channel = new BroadcastChannel(`flagmint_sync_${ns}`);
      const instanceId = Math.random().toString(36).substring(2, 9);

      let isLeader = false;
      let heartbeatInterval: any = null;
      let checkTimeout: any = null;
      let underlyingClient: any = null;
      let mockClient: any = null;

      let cachedFlags: any = {};
      const subscribers = new Set<(flags: any) => void>();

      const promoteToLeader = async () => {
        // SECURITY GUARD: If the window went to sleep before this timer resolved, abort!
        if (document.hidden) {
          keepAsFollower();
          return;
        }

        if (isLeader) return;
        isLeader = true;
        clearTimeout(checkTimeout);

        console.log(`[Flagmint] Instance ${instanceId} elected LEADER. Spawning single SSE stream.`);

        const clientInstance = new FlagClient<T, C>(clientOptions);
        underlyingClient = clientInstance;

        await clientInstance.ready();

        // ASYNC GUARD: Check if a tie-breaker or background event occurred while waiting for the network
        if (!isLeader || !underlyingClient || document.hidden) {
          if (clientInstance) clientInstance.destroy();
          if (underlyingClient === clientInstance) underlyingClient = null;
          return;
        }

        cachedFlags = underlyingClient.getFlags() || {};

        underlyingClient.subscribe((updatedFlags: any) => {
          if (!isLeader || !underlyingClient || document.hidden) return;

          cachedFlags = updatedFlags;
          flagStateRef.value++;
          if (isVue3) triggerRef(flagClientRef);
          subscribers.forEach(cb => cb(updatedFlags));

          channel.postMessage({ type: 'FLAG_UPDATE', flags: updatedFlags });
        });

        if (!flagClientRef.value || flagClientRef.value === mockClient) {
          flagClientRef.value = underlyingClient;
          readyRef.value = true;
          resolveInit(underlyingClient);
        }

        heartbeatInterval = setInterval(() => {
          if (!document.hidden) {
            channel.postMessage({ type: 'HEARTBEAT', leaderId: instanceId });
          }
        }, 1000);
      };

      const keepAsFollower = () => {
        isLeader = false;

        if (!mockClient) {
          mockClient = {
            subscribe: (callback: (flags: any) => void) => {
              subscribers.add(callback);
              callback(cachedFlags);
              return () => subscribers.delete(callback);
            },
            getFlags: () => cachedFlags,
            getFlag: (key: string, fallback: any) => cachedFlags[key] ?? fallback,
            updateContext: async (newContext: any) => {
              channel.postMessage({ type: 'UPDATE_CONTEXT', context: newContext });
            },
            trackError: (flagKey: string, error?: unknown, extra?: Record<string, unknown>) => {
              channel.postMessage({ type: 'TRACK_ERROR', flagKey, error, extra });
            },
            track: (flagKey: string, eventName: string, extra?: Record<string, unknown>) => {
              channel.postMessage({ type: 'TRACK', flagKey, eventName, extra });
            },
          };
        }

        if (!flagClientRef.value || flagClientRef.value === underlyingClient) {
          flagClientRef.value = mockClient;
          readyRef.value = true;
          resolveInit(mockClient);
        }

        clearTimeout(checkTimeout);

        // Followers only poll for status if they are visible in the foreground
        if (!document.hidden) {
          checkTimeout = setTimeout(() => {
            promoteToLeader();
          }, 2500);
        }
      };

      const stepDownGracefully = () => {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        if (underlyingClient) {
          underlyingClient.destroy(); // Tear down the active background connection row instantly
          underlyingClient = null;
        }
        keepAsFollower();
      };

      // --- VISIBILITY CHANGE EVENT ENGINE ---
      const handleVisibilityChange = () => {
        if (document.hidden) {
          if (isLeader) {
            channel.postMessage({ type: 'HEARTBEAT_DEAD' });
            stepDownGracefully();
          } else {
            keepAsFollower();
          }
        } else {
          // Re-entering foreground: request active flag state immediately
          channel.postMessage({ type: 'REQ_INITIAL_STATE' });
          clearTimeout(checkTimeout);
          checkTimeout = setTimeout(() => {
            if (!isLeader && (!flagClientRef.value || flagClientRef.value === mockClient)) {
              promoteToLeader();
            }
          }, Math.floor(Math.random() * 150) + 50);
        }
      };

      channel.onmessage = (event) => {
        const { type, flags, leaderId, context, flagKey, error, extra, eventName } = event.data;
        // Disregard background traffic sync checks entirely if this DOM tree is hidden
        if (document.hidden) return;

        if (type === 'HEARTBEAT') {
          if (!isLeader) {
            keepAsFollower();
            return;
          }

          if (isLeader && leaderId !== instanceId && leaderId < instanceId) {
            if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; }
            if (underlyingClient) { underlyingClient.destroy(); underlyingClient = null; }
            keepAsFollower();
          }
        }
        if (type === 'FLAG_UPDATE' && !isLeader) {
          cachedFlags = flags;
          flagStateRef.value++;
          if (isVue3) triggerRef(flagClientRef);
          subscribers.forEach(cb => cb(flags));
        }
        if (type === 'REQ_INITIAL_STATE' && isLeader) {
          channel.postMessage({ type: 'FLAG_UPDATE', flags: cachedFlags });
        }
        if (type === 'UPDATE_CONTEXT' && isLeader && underlyingClient) {
          underlyingClient.updateContext(context);
        }
        if (type === 'TRACK_ERROR' && isLeader && underlyingClient) {
          underlyingClient.trackError?.(flagKey, error, extra);
        }
        if (type === 'TRACK' && isLeader && underlyingClient) {
          underlyingClient.track?.(flagKey, eventName, extra);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      window.addEventListener('beforeunload', () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        clearInterval(heartbeatInterval);
        clearTimeout(checkTimeout);
        if (underlyingClient) underlyingClient.destroy();
        if (isLeader) channel.postMessage({ type: 'HEARTBEAT_DEAD' });
        channel.close();
      });

      channel.addEventListener('message', (e) => {
        if (e.data.type === 'HEARTBEAT_DEAD' && !isLeader && !document.hidden) {
          promoteToLeader();
        }
      });

      // --- STARTUP STAGE LOGIC ---
      if (!document.hidden) {
        channel.postMessage({ type: 'REQ_INITIAL_STATE' });
        checkTimeout = setTimeout(() => {
          if (!isLeader && !flagClientRef.value) promoteToLeader();
        }, Math.floor(Math.random() * 140) + 40);
      } else {
        keepAsFollower();
      }
    };


    const init = async (): Promise<FlagClient<T, C>> => {
      // Already initialised — return existing client
      if (flagClientRef.value) return flagClientRef.value;
      // Init in flight — return the same promise instead of creating a second client
      if (initPromise) return initPromise;

      const clientOptions = buildClientOptions(pureOptions);

      initPromise = new Promise<any>((resolve) => {
        // If sync cross-iframes is enabled, divert initialization through the mesh-network coordinator
        if (options.syncCrossIframes) {
          setupCrossIframeSync(resolve, clientOptions);
        } else {
          // Standard path: Instantiate regular standalone sockets per execution container
          const client = new FlagClient<T, C>(clientOptions);
          client.ready().then(() => {
            flagClientRef.value = client;
            readyRef.value = true;

            client.subscribe(() => {
              flagStateRef.value++;
              if (isVue3) triggerRef(flagClientRef);
            });

            resolve(client);
          });
        }
      }).then((resolvedClient) => {
        // Run native Vue property injection tasks
        if (isVue3) {
          appOrVue.config.globalProperties.$flagmint = flagClientRef;
          appOrVue.config.globalProperties.$flagmintReady = readyRef;
        } else if (isVue2) {
          const Vue = appOrVue.constructor;
          if (Vue.observable && !Vue.prototype.$flagmintState) {
            Vue.prototype.$flagmintState = Vue.observable({
              flagClientRef,
              readyRef,
              flagStateRef,
            });
          }

          const define = (key: string, descriptor: PropertyDescriptor) => {
            if (!Object.getOwnPropertyDescriptor(Vue.prototype, key)) {
              Object.defineProperty(Vue.prototype, key, descriptor);
            }
          };

          define('$flagmint', {
            configurable: true,
            get() { return Vue.prototype.$flagmintState.flagClientRef.value ?? null; },
          });
          define('$flagmintReady', {
            configurable: true,
            get() { return Vue.prototype.$flagmintState.readyRef.value ?? null; },
          });
          define('$flagmintInit', {
            configurable: true,
            value: init,
          });
        }
        return resolvedClient;
      });

      return initPromise;
    };

    if (isVue3) {
      appOrVue.provide(FLAGMINT_INIT, init);
    } else if (isVue2) {
      appOrVue.prototype.$flagmintInit = init;
    }

    if (!options.deferInitialization) {
      void init();
    }
  },
});

export { createFeatureFlagPlugin, createFeatureFlagPlugin as createFlagmintPlugin };
