import { inject, Ref } from 'vue';
import { FLAGMINT_CLIENT, FLAGMINT_READY, FLAGMINT_INIT } from '@/plugin';
import type { FlagClient } from 'flagmint-js-sdk';

export function useFlagmint<T = unknown>() {
  let client: Ref<FlagClient<T> | null> | null = null;
  let ready: Ref<boolean> | null = null;
  let init: (() => Promise<FlagClient<T>>) | null = null;

  const resolve = () => {
    client = inject(FLAGMINT_CLIENT, null);
    ready = inject(FLAGMINT_READY, null);
    init = inject(FLAGMINT_INIT, null);
  };

  return {
    client,
    ready,
    init
  };
}
