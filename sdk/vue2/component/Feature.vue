<template>
  <slot v-if="enabled"></slot>
</template>

<script>
import { inject } from 'vue';
import Feature from '/Users/izzymac/Documents/flagmint-vuejs-feature-flags-sdk/dist/vue3-feature.mjs';

export default {
  name: 'App',
  components: { Feature },
  setup() {
    const flagClient = inject('__flagmint__');

    function toggleFeature(key) {
      if (flagClient) {
        flagClient.flags[key] = !flagClient.flags[key];
      }
    }

    return {
      flagClient,
      toggleFeature
    };
  }
};
</script>
