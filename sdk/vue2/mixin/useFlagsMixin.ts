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
    // Wait until client is ready
    if (this.$flagmintReady) await this.$flagmintReady;
    // Fetch all flags (or use client.getFlag per key)
    if (typeof this.$flagmint.getFlag === 'function') {
      try {
        this.featureFlags = this.$flagmint;
      } catch (err) {
        console.warn('[flagmint] fetchAllFlags failed', err);
      }
    }
  },

  methods: {
    getFlag(key: string, fallback?: any): any {
      return this.featureFlags.getFlag[key] ?? fallback;
    }
  }
};
