import type { FlagClient } from "flagmint-js-sdk";

type FlagsMixinThis = {
  featureFlags: Record<string, any>;
  getFlag: (key: string, fallback?: any) => any;
  // Add these to make TypeScript aware of injected properties
  $flagmint: FlagClient<any>;
  $flagmintReady?: Promise<void>;
};

export const useFlagsMixin: {
  data: () => { featureFlags: Record<string, any> };
  created: () => Promise<void>;
  methods: {
    getFlag(key: string, fallback?: any): any;
  };
} & ThisType<FlagsMixinThis> = {
  data() {
    return {
      featureFlags: {},
    };
  },

  async created() {
    // Safely get the plugin from Vue 2 prototype
    const client = this.$flagmint;

    // if (client && typeof client.fetchFlags === 'function') {
    //   try {
    //     this.featureFlags = await client.fetchFlags();
    //   } catch (err) {
    //     console.warn('[flagmint] Failed to fetch flags in mixin:', err);
    //   }
    // } else {
    //   console.warn('[flagmint] FlagClient not available in useFlagsMixin');
    // }
  },

  methods: {
    getFlag(key: string, fallback?: any): any {
      return this.featureFlags[key] ?? fallback;
    }
  }
};
