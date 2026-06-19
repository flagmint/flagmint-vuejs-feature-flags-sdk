import { isVue2, isVue3 } from "vue-demi";
import { FlagClient, FlagClientOptions } from "flagmint-js-sdk";
import { readonly, ref, Ref, triggerRef } from "vue";
import { FLAGMINT_READY, FLAGMINT_CLIENT, FLAGMINT_INIT, FLAGMINT_STATE } from "@/types";

// Reactive references
const flagClientRef: Ref<FlagClient<any, any> | null> = ref(null);
const readyRef = ref(false);
const flagStateRef = ref(0);

const createFeatureFlagPlugin = <
  T = unknown,
  C extends Record<string, any> = Record<string, any>
>(
  options: FlagClientOptions<C>
) => ({
  install(appOrVue: any) {
    // Provide early so inject() sees them before init
    if (isVue3) {
      appOrVue.provide(FLAGMINT_READY, readonly(readyRef));
      appOrVue.provide(FLAGMINT_CLIENT, flagClientRef);
      appOrVue.provide(FLAGMINT_STATE, readonly(flagStateRef));
    }

    // Init function
    const init = async (): Promise<FlagClient<T, C>> => {
      if (flagClientRef.value) return flagClientRef.value; // Avoid re-init

      const client = new FlagClient<T, C>(options);
      await client.ready();

      flagClientRef.value = client;
      readyRef.value = true;

      // Subscribe to flag updates and trigger reactivity
      client.subscribe(() => {
        flagStateRef.value++;
        // For Vue 3, also trigger the ref manually to ensure deep reactivity
        if (isVue3) {
          triggerRef(flagClientRef);
        }
      });

      if (isVue3) {
        appOrVue.config.globalProperties.$flagmint = flagClientRef;
        appOrVue.config.globalProperties.$flagmintReady = readyRef;
      } else if (isVue2) {
        // Use Vue.observable to make the state reactive in Vue 2
        const Vue = appOrVue.constructor;

        if (Vue.observable && !Vue.prototype.$flagmintState) {
          Vue.prototype.$flagmintState = Vue.observable({
            flagClientRef,
            readyRef,
            flagStateRef,
          });
        }

        if (!Object.getOwnPropertyDescriptor(Vue.prototype, "$flagmint")) {
          Object.defineProperty(Vue.prototype, "$flagmint", {
            configurable: true,
            get() {
              return Vue.prototype.$flagmintState.flagClientRef.value ?? null;
            },
          });
        }

        if (!Object.getOwnPropertyDescriptor(Vue.prototype, "$flagmintReady")) {
          Object.defineProperty(Vue.prototype, "$flagmintReady", {
            configurable: true,
            get() {
              return Vue.prototype.$flagmintState.readyRef.value?? null;
            },
          });
        }

        if (!Object.getOwnPropertyDescriptor(Vue.prototype, "$flagmintInit")) {
          Object.defineProperty(Vue.prototype, "$flagmintInit", {
            configurable: true,
            value: init,
          });
        }
      }

      return client;
    };

    // Provide init
    if (isVue3) {
      appOrVue.provide(FLAGMINT_INIT, init);
    } else if (isVue2) {
      // Use Vue.prototype for Vue 2
      appOrVue.prototype.$flagmintInit = init;
    }

    // Auto-init if not deferred
    if (!options.deferInitialization) {
      void init();
    }
  },
});

export function useFlagClient<T = unknown>() {
  return flagClientRef as Ref<FlagClient<T> | null>;
}

export function useFlagmintReady(): Ref<boolean> {
  return readyRef;
}

export { createFeatureFlagPlugin };
