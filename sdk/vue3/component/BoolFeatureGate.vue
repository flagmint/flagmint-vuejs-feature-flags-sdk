<template>
  <slot v-if="enabled" name="enabled" />
  <slot v-else name="disabled" />
</template>

<script lang="ts">
import { defineComponent, inject, ref, Ref, PropType, onMounted, onUnmounted, watch } from 'vue';
import type { FlagClient } from 'flagmint-js-sdk';
import { FLAGMINT_CLIENT, FLAGMINT_READY } from '@/types';

export default defineComponent({
  name: 'BoolFeatureGate',
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

      enabled.value = keys.every(key => {
        const value = client.getFlag(key, false);
        if (typeof value !== 'boolean') {
          console.warn(`[BoolFeatureGate] Flag "${key}" is not a boolean (got ${typeof value}). Gate requires exactly true, not just truthy values.`);
        }
        return value === true;
      });
    };

    watch(() => isReady?.value, evaluate, { immediate: true });

    let unsubscribe: (() => void) | null = null;

    onMounted(() => {
      const client = clientRef?.value;
      if (!client) return;

      unsubscribe = client.subscribe((flags) => {
        const keys = Array.isArray(props.featureKeys)
          ? props.featureKeys
          : [props.featureKeys];

        enabled.value = keys.every(key => {
          const value = flags[key];
          if (typeof value !== 'boolean') {
            console.warn(`[BoolFeatureGate] Flag "${key}" is not a boolean (got ${typeof value}). Gate requires exactly true, not just truthy values.`);
          }
          return value === true;
        });
      });
    });

    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    });

    return { enabled };
  },
});
</script>
