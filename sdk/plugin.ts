import { isVue2, isVue3 } from 'vue-demi';
import { FlagClient, FlagClientOptions } from 'flagmint-js-sdk';
import { readonly, ref, Ref, triggerRef } from 'vue-demi';
import { FLAGMINT_READY, FLAGMINT_CLIENT, FLAGMINT_INIT, FLAGMINT_STATE } from '@/types';

const createFeatureFlagPlugin = <
  T = unknown,
  C extends Record<string, any> = Record<string, any>
>(
  options: FlagClientOptions<C>
) => ({
  install(appOrVue: any) {
    // Scoped to this install call — no shared module-level state
    const flagClientRef: Ref<FlagClient<T, C> | null> = ref(null);
    const readyRef = ref(false);
    const flagStateRef = ref(0);

    // Provide early — inject() in components will see these immediately,
    // flagClientRef.value is null until init() resolves which is expected
    if (isVue3) {
      appOrVue.provide(FLAGMINT_READY, readonly(readyRef));
      appOrVue.provide(FLAGMINT_CLIENT, flagClientRef);
      appOrVue.provide(FLAGMINT_STATE, readonly(flagStateRef));
    }

    const init = async (): Promise<FlagClient<T, C>> => {
      if (flagClientRef.value) return flagClientRef.value;

      const client = new FlagClient<T, C>(options);
      await client.ready();

      flagClientRef.value = client;
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

export { createFeatureFlagPlugin };
