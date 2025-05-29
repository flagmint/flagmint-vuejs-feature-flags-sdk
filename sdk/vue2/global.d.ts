// sdk/vue2/global.d.ts
import type { FlagClient } from '@/core/client';

declare module 'vue/types/vue' {
  interface Vue {
    $flagmint: FlagClient;
  }
}
