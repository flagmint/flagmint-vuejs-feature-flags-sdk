<template>
  <slot v-if="enabled"></slot>
</template>

<script lang="ts">
import Vue from 'vue';
import { FlagClient } from '@/core/client';

export default Vue.extend({
  name: 'Feature',
  props: {
    featureKey: {
      type: String,
      required: true
    }
  },
  inject: {
    flagClient: {
      from: '__flagmint__'
    }
  },
  computed: {
    enabled() {
      const client = this.flagClient | undefined;
      if (!client) return false;
     return client.getReactiveFlags()[this.featureKey] ?? false;
    }
  }
});
</script>
