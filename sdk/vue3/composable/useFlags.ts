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

  
  let stopWatch: (() => void) | null = null;

  const onReady = (ready: boolean) => {
    if (ready) {
      startSubscription();
      stopWatch?.();
    }
  };
  const startSubscription = () => {
    subscriberCount++;
    const client = clientRef.value;
    if (!client || unsubscribe) return;
    unsubscribe = client.subscribe((updatedFlags) => {
      flags.value = updatedFlags as Record<string, unknown>;
    });
  };

  // Watch isReady — handles both "already ready at mount" and "becomes ready later"
  stopWatch = watch(() => isReady.value, onReady, { immediate: true });;

  onUnmounted(() => {
    subscriberCount--;
    stopWatch?.();
    if (unsubscribe && subscriberCount === 0) {
      unsubscribe();
      unsubscribe = null;
    }
  });

  const getFlag = <V = unknown>(key: string, fallback?: V): V => {
    return (flags.value[key] ?? fallback) as V;
  };

  const updateFlagmintContext = async (context: Record<string, any>): Promise<void> => {
    const client = clientRef.value;
    if (!client) {
      console.warn('[Flagmint] updateFlagmintContext called before client was ready.');
      return;
    }
    await client.updateContext(context);
  };

  const trackError = (flagKey: string, error?: unknown, extra?: Record<string, unknown>): void => {
    clientRef.value?.trackError?.(flagKey, error, extra);
  };

  const track = (flagKey: string, eventName: string, extra?: Record<string, unknown>): void => {
    clientRef.value?.track?.(flagKey, eventName, extra);
  };

  return {
    client: clientRef,
    isReady,
    init,
    flags,
    getFlag,
    updateFlagmintContext,
    trackError,
    track,
  };
}