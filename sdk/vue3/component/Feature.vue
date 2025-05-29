<!-- Feature.vue -->
<template>
  <slot v-if="enabled"></slot>
</template>

<script lang="ts">
import { defineComponent, inject, computed } from 'vue';
import { FlagClient } from '@/core/client';

export default defineComponent({
  name: 'Feature',
  props: {
    featureKey: { type: String, required: true }
  },
  setup(props) {
    const client = inject<FlagClient>('__flagmint__');
    const enabled = computed(() =>  client ? client.getReactiveFlags()[props.featureKey] ?? false : false);
    return { enabled };
  }
});
</script>
