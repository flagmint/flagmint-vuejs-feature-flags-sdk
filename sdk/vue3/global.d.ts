// sdk/vue3/global.d.ts
import type { FlagClient } from 'flagmint-js-sdk';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $flagmint: FlagClient;
  }
}