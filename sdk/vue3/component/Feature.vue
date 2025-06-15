<template>
  <slot v-if="enabled" />
</template>

<script lang="ts">
import { defineComponent, inject, computed, Ref } from 'vue';
import type { FlagClient } from 'flagmint-js-sdk';
import { FLAGMINT_CLIENT, FLAGMINT_READY } from '@/types';

export default defineComponent({
  name: 'Feature',  
  props: {
    /**
     * Accepts a single feature key or an array of keys.
     * If multiple keys are provided, all must be enabled.
     */
    featureKeys: {
      type: [String, Array] as unknown as () => string | string[],
      required: true,
    },
  },
  setup(props) {
    const client = inject<Ref<FlagClient | null>>(FLAGMINT_CLIENT);
    const isReady = inject<Ref<boolean>>(FLAGMINT_READY);

    if (!client || !isReady) {
      console.warn('Flagmint plugin not installed or not provided.');
    }

    const enabled = computed(() => {
      if (!isReady || !isReady.value || !client) {
        return false;
      }
      const keys = Array.isArray(props.featureKeys)
        ? props.featureKeys
        : [props.featureKeys];
      // Check if all feature flags are enabled
      if (keys.length === 0) {
        console.warn('No feature keys provided.');
        return false;
      }
      // Use the client to check if each flag is enabled
      if (keys.some(key => typeof key !== 'string')) {
        console.warn('Feature keys must be strings.');
        return false;
      }
      // Check if the client has the getFlag method
      if (typeof client.value!.getFlag !== 'function') {
        console.warn('Client does not have a getFlag method.', client);
        return false;
      }

      // Return true only if all flags are enabled
      return keys.every(key => client.value!.getFlag(key, false));
    });

    return { enabled , client};
  },
  unmounted() {
    // Cleanup if necessary
    console.info('Feature component unmounted and client destroyed.');
    if (this.client && typeof this.client.destroy === 'function') {
      this.client.destroy();
    }
  },
});
</script>