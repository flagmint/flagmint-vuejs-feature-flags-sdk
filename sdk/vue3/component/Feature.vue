<!-- Feature.vue -->
<template>
  <slot v-if="enabled"></slot>
</template>

<script lang="ts">
import { defineComponent, inject, computed } from 'vue';
import {useFlagmint} from '@/vue3/composable/useFlags';

export default defineComponent({
  name: 'Feature',
  props: {
    featureKey: { type: String, required: true }
  },
  setup(props) {
    const { client, ready  } = useFlagmint();
    if (!client) {
      console.warn('Feature component requires a client to be injected.');
      return { enabled: computed(() => false) };
    }


    const enabled = true
    return { enabled };
  }
});
</script>
