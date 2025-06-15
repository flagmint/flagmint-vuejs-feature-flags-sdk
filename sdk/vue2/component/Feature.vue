<template>
  <slot v-if="isFeatureEnabled"></slot>
</template>

<script>
import { FlagsMixin } from '@/mixins/flagsMixin';

export default {
  name: 'FlagmintFeature',
  mixins: [FlagsMixin],
  props: {
    /**
     * Accepts a single feature key or an array of keys.
     * If multiple keys are provided, all must be enabled.
     */
    featureKeys: {
      type: [String, Array],
      required: true,
    },
  },
  computed: {
    isFeatureEnabled() {
      // Wait until flags have been fetched
      const keys = Array.isArray(this.featureKeys)
        ? this.featureKeys
        : [this.featureKeys];
      // Return true only if all flags are enabled
      return keys.every(key => this.getFlag(key, false));
    }
  }
};
</script>
