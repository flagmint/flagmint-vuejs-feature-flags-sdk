import { isVue2, isVue3 } from 'vue-demi';
import { FlagClient, FlagClientOptions } from 'flagmint-js-sdk';
import { readonly, ref, Ref } from 'vue';

// Injection symbols
export const FLAGMINT_INIT = Symbol('FLAGMINT_INIT');
export const FLAGMINT_READY = Symbol('FLAGMINT_READY');
export const FLAGMINT_CLIENT = Symbol('FLAGMINT_CLIENT');

// Reactive references
const flagClientRef: Ref<FlagClient<any, any> | null> = ref(null);
const readyRef = ref(false);

const createFeatureFlagPlugin = <
  T = unknown,
  C extends Record<string, any> = Record<string, any>
>(
  options: FlagClientOptions<C>
) => ({
  install(appOrVue: any) {
    // Provide early so inject() sees them before init
    appOrVue.provide(FLAGMINT_READY, readonly(readyRef));
    appOrVue.provide(FLAGMINT_CLIENT, flagClientRef);

    // Init function
    const init = async (): Promise<FlagClient<T, C>> => {
      if (flagClientRef.value) return flagClientRef.value; // Avoid re-init


      const client = new FlagClient<T, C>(options);
      await client.ready();

      flagClientRef.value = client;
      readyRef.value = true;

      if (isVue3) {
        appOrVue.config.globalProperties.$flagmint = flagClientRef;
        appOrVue.config.globalProperties.$flagmintReady = readyRef;
      } else if (isVue2) {
        appOrVue.prototype.$flagmint = flagClientRef;
        appOrVue.prototype.$flagmintReady = readyRef;
      }

      return client;
    };

    // Provide init
    appOrVue.provide(FLAGMINT_INIT, init);

    // Auto-init if not deferred
    if (!options.deferInitialization) {
      void init();
    }
  }
});

export function useFlagClient<T = unknown>() {
  return flagClientRef as Ref<FlagClient<T> | null>;
}

export function useFlagmintReady(): Ref<boolean> {
  return readyRef;
}

export { createFeatureFlagPlugin };
