import { inject } from 'vue';
import type { FlagClient } from '@/core/client';

export function useFlags<T = unknown>() {
  const client = inject<FlagClient<T>>('__flagmint__');

  if (!client) {
    throw new Error('[useFlags] FlagClient instance not found. Did you forget to install the plugin?');
  }

  return {
    flags: client.getReactiveFlags(),
    getFlag: client.getFlag.bind(client),
    updateContext: client.updateContext.bind(client),
  };
}
