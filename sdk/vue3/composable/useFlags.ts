import { inject, Ref } from 'vue';
import { FLAGMINT_READY, FLAGMINT_CLIENT, FLAGMINT_INIT } from '@/types';
import type { FlagClient } from 'flagmint-js-sdk';
/**
 * useFlagmint composable to access the FlagClient instance, its readiness state, and an initialization function.
 * This composable is designed to be used in Vue 3 applications to manage feature flags.
 * @returns An object containing the FlagClient instance, a boolean indicating if the client is ready, and an init function to initialize the client.
 */
export function useFlagmint<T = unknown>() {
  let client: Ref<FlagClient<T>> | null;
  let isReady: Ref<boolean> | null;
  let init: (() => Promise<FlagClient<T>>) | null;

  const resolve = () => {
    client = inject(FLAGMINT_CLIENT, null);
    isReady = inject(FLAGMINT_READY, null);
    init = inject(FLAGMINT_INIT, null);

  };

  return {
    get client() {
      if (!client) resolve();
      return client;
    },
    get isReady() {
      if (!isReady) resolve();
      return isReady;
    },
    get init() {
      if (!init) resolve();
      return init;
    }
  };
}
