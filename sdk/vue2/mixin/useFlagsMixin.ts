import type { FlagClient } from "flagmint-js-sdk";

type FlagsMixinThis = {
  $nextTick(arg0: () => void): unknown;
  $watch(arg0: string, arg1: (val: any) => void): unknown;
  $flagmintInit: any;
  flagClient: FlagClient<any> | null;
  isFlagReady: boolean;
  getFlag: (key: string, fallback?: any) => any;
  // Add these to make TypeScript aware of injected properties
  $flagmint: FlagClient<any>;
  $flagmintReady?: Promise<void>;
};

export const useFlagsMixin: {
  data: () => {
    isFlagReady: boolean;
    flagClient: FlagClient<any> | null;
  },
  created: () => Promise<void>;
  mounted: () => void;
  methods: {
    getFlag(key: string, fallback?: any): any;
  };
} & ThisType<FlagsMixinThis> = {
 data() {
    return {
      isFlagReady: false,
      flagClient: null,
    };
  },

  async created() {
    if (typeof this.$flagmintReady !== 'undefined') {
      await this.$flagmintReady;
      this.flagClient = this.$flagmint;
      this.isFlagReady = true;
    }
  },

  mounted() {
    this.$nextTick(() => {
      if (typeof this.$flagmintReady !== 'undefined') {
        this.isFlagReady = true
        this.$watch('$flagmintReady', (val) => {
          this.isFlagReady = val;
        });
      } else if (typeof this.$flagmintInit === 'function') {
        this.$flagmintInit().then((client: FlagClient<any, Record<string, any>> | null) => {
          this.flagClient = client;
          this.isFlagReady = true;
        });
      }
    });
  },

  methods: {
    getFlag(key, fallback) {
      if (this.flagClient && typeof this.flagClient.getFlag === 'function') {
        return this.flagClient.getFlag(key, fallback);
      }
      return fallback;
    }
  }
};
