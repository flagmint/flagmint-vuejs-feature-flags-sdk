// sdk/vue2/useFlags.ts
import { flagClientInstance } from '@/plugin';
type FlagsMixinThis = {
  featureFlags: Record<string, any>;
  getFlag: (key: string, fallback?: any) => any;
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
    if (flagClientInstance) {
      this.featureFlags = await flagClientInstance.fetchFlags();
    }
  },
  methods: {
    getFlag(key: string, fallback?: any): any {
      return this.featureFlags[key] ?? fallback;
    }
  }
};
