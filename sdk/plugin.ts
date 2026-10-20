import { isVue2, isVue3 } from 'vue-demi';
import { FlagClient, FlagClientOptions } from 'flagmint-js-sdk';
import { markRaw, readonly, ref, shallowRef, Ref, triggerRef } from 'vue-demi';
import { FLAGMINT_READY, FLAGMINT_CLIENT, FLAGMINT_INIT, FLAGMINT_STATE } from '@/types';

const WRAPPER_INFO = { name: 'flagmint-vuejs-feature-flags', version: '2.1.1' };

/**
 * Report an init failure to `onError` and normalize non-Error throws.
 *
 * @param options Plugin FlagClient options (may include `onError`)
 * @param err Caught value from the failed init sequence
 */
function reportInitError(
  options: FlagClientOptions,
  err: unknown,
): Error {
  const error = err instanceof Error ? err : new Error(String(err));
  options.onError?.(error);
  return error;
}

const createFeatureFlagPlugin = <
  T = unknown,
  C extends Record<string, any> = Record<string, any>
>(
  options: FlagClientOptions<C>
) => ({
  install(appOrVue: any) {
    // Scoped to this install call — no shared module-level state
    const flagClientRef: Ref<FlagClient<T, C> | null> = shallowRef(null);
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

    const init = async (): Promise<FlagClient<T, C>> => {
      // Already initialised — return existing client
      if (flagClientRef.value) return flagClientRef.value;
      // Init in flight — return the same promise instead of creating a second client
      if (initPromise) return initPromise;

      initPromise = (async () => {
        const client = new FlagClient<T, C>({
          transportMode: 'auto',
          ...options,
          wrapperInfo: options.wrapperInfo ?? WRAPPER_INFO,
        });
        try {
          await client.ready();

          // Subscribe before publishing ready so a throw here can still be retried
          client.subscribe(() => {
            flagStateRef.value++;
            if (isVue3) triggerRef(flagClientRef);
          });

          flagClientRef.value = markRaw(client);
          readyRef.value = true;

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

          return client;
        } catch (err) {
          initPromise = null;
          flagClientRef.value = null;
          readyRef.value = false;
          try {
            client.destroy();
          } catch {
            // Ignore teardown errors; the original failure is what callers care about
          }
          throw reportInitError(options, err);
        }
      })();

      return initPromise;
    };

    if (isVue3) {
      appOrVue.provide(FLAGMINT_INIT, init);
    } else if (isVue2) {
      appOrVue.prototype.$flagmintInit = init;
    }

    if (!options.deferInitialization) {
      void init().catch(() => {
        // onError already reported the failure; swallow so the void call is not unhandled
      });
    }
  },
});

export { createFeatureFlagPlugin, createFeatureFlagPlugin as createFlagmintPlugin };
