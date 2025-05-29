// sdk/vue3/global.d.ts
import type { FlagClient } from '@/core/client';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $flagmint: FlagClient;
  }
}