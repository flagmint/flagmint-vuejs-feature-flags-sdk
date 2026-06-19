<template>
  <slot v-if="enabled" />
</template>

<script lang="ts">
import { defineComponent, inject, ref, Ref, PropType, onMounted, onUnmounted, watch } from 'vue';
import type { FlagClient } from 'flagmint-js-sdk';
import { FLAGMINT_CLIENT, FLAGMINT_READY } from '@/types';

export default defineComponent({
  name: 'Feature',

  props: {
    featureKeys: {
      type: [String, Array] as PropType<string | string[]>,
      required: true,
    },
  },

  setup(props) {
    const clientRef = inject<Ref<FlagClient | null>>(FLAGMINT_CLIENT);
    const isReady = inject<Ref<boolean>>(FLAGMINT_READY);

    if (!clientRef || !isReady) {
      console.warn('[Flagmint] Plugin not installed or not provided.');
    }

    const enabled = ref(false);

    const evaluate = () => {
      const client = clientRef?.value;
      if (!client || !isReady?.value) {
        enabled.value = false;
        return;
      }

      const keys = Array.isArray(props.featureKeys)
        ? props.featureKeys
        : [props.featureKeys];

      if (keys.length === 0 || keys.some(k => typeof k !== 'string')) {
        enabled.value = false;
        return;
      }

      enabled.value = keys.every(key => client.getFlag(key, false));
    };

    // Re-evaluate when ready state changes (initial load)
    watch(() => isReady?.value, evaluate, { immediate: true });

    // Subscribe to live flag updates from the transport
    let unsubscribe: (() => void) | null = null;

    onMounted(() => {
      const client = clientRef?.value;
      if (!client) return;

      // Subscribe to flag changes — re-evaluate on every push
      unsubscribe = client.subscribe((flags) => {
        const keys = Array.isArray(props.featureKeys)
          ? props.featureKeys
          : [props.featureKeys];
        enabled.value = keys.every(key => !!flags[key]);
      });
    });

    onUnmounted(() => {
      // Only clean up this component's subscription — never destroy the shared client
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    });

    return { enabled };
  },
});
</script>