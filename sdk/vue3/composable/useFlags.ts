import { inject, ref, watch, onUnmounted, Ref } from 'vue';
import { FLAGMINT_READY, FLAGMINT_CLIENT, FLAGMINT_INIT } from '@/types';
import type { FlagClient } from 'flagmint-js-sdk';

const flags = ref<Record<string, unknown>>({});
let unsubscribe: (() => void) | null = null;
let subscriberCount = 0;
export function useFlagmint<T = unknown>() {
  // inject() called synchronously at top level — safe because provides
  // are registered before install() returns, before any component mounts
  const clientRef = inject<Ref<FlagClient<T> | null>>(FLAGMINT_CLIENT, ref(null));
  const isReady = inject<Ref<boolean>>(FLAGMINT_READY, ref(false));
  const init = inject<(() => Promise<FlagClient<T>>) | null>(FLAGMINT_INIT, null);

  

  const startSubscription = () => {
    subscriberCount++;
    const client = clientRef.value;
    if (!client || unsubscribe) return;
    unsubscribe = client.subscribe((updatedFlags) => {
      flags.value = updatedFlags as Record<string, unknown>;
    });
  };

  // Watch isReady — handles both "already ready at mount" and "becomes ready later"
  const stopWatch = watch(
    () => isReady.value,
    (ready) => {
      if (ready) {
        startSubscription();
        stopWatch();
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    subscriberCount--;
    stopWatch();
    if (unsubscribe && subscriberCount === 0) {
      unsubscribe();
      unsubscribe = null;
    }
  });

  const getFlag = <V = unknown>(key: string, fallback?: V): V => {
    return (flags.value[key] ?? fallback) as V;
  };

  const updateContext = async (context: Record<string, any>): Promise<void> => {
    const client = clientRef.value;
    if (!client) {
      console.warn('[Flagmint] updateContext called before client was ready.');
      return;
    }
    await client.updateContext(context);
  };

  return {
    client: clientRef,
    isReady,
    init,
    flags,
    getFlag,
    updateContext
  };
}