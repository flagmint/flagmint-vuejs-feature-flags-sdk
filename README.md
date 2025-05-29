# Flagmint Vue Feature Flags SDK

A lightweight and powerful feature flag SDK for Vue 2 and Vue 3 applications.

Supports:

✅ Client-side flag evaluation  
✅ Segment targeting and rollout strategies  
✅ WebSocket or HTTP long-polling  
✅ Offline caching and preview mode  
✅ Vue 2 and Vue 3 plugin, composables, and helpers

---

## 🔧 Installation

```bash
npm install vue-feature-flags-sdk
````

---

## 🚀 Quick Start

### Vue 2

```ts
// main.js
import Vue from 'vue';
import { createFlagmintPlugin } from 'vue-feature-flags-sdk';

Vue.use(createFlagmintPlugin({
  apiKey: 'your-api-key',
  context: { user_id: 'abc123', country: 'NG' },
  transportMode: 'auto',
  autoRefresh: true,
  previewMode: false
}));

new Vue({ render: h => h(App) }).$mount('#app');
```

---

### Vue 3

```ts
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { createFlagmintPlugin } from 'vue-feature-flags-sdk';

const app = createApp(App);

app.use(createFlagmintPlugin({
  apiKey: 'your-api-key',
  context: { user_id: 'abc123' },
  transportMode: 'auto',
  previewMode: false
}));

app.mount('#app');
```

---

## ⚙️ API Overview

### `FlagClientOptions`

```ts
interface FlagClientOptions {
  apiKey: string;
  context?: Record<string, any>;
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
  persistContext?: boolean;
  enableOfflineCache?: boolean;
  cacheTTL?: number;
  transportMode?: 'auto' | 'websocket' | 'long-polling';
  previewMode?: boolean;
  onError?: (err: Error) => void;
}
```

---

## 🎯 Using Flags

### ✅ Recommended (Reactive Flags)

```ts
const flags = this.$flagmint.getReactiveFlags();
console.log(flags['dark-mode']); // updates reactively when flag changes
```

### ⚠️ Non-reactive (useful for quick access)

```ts
const enabled = this.$flagmint.getFlag('dark-mode', false);
```

---

## ⏳ Await Initialization

You may need to wait until flags are loaded:

```ts
await this.$flagmintReady;
```

or in Vue 3:

```ts
await useFlagmintReady();
```

---

## 💡 Segment Rules + Rollout

Each flag can define:

* `targeting_rules` (direct conditions or segment references)
* `rollout` (percentage or variant-based strategies)

Example flag:

```ts
{
  key: 'new-ui',
  type: 'boolean',
  value: true,
  targeting_rules: [
    { type: 'rule', attribute: 'country', operator: 'eq', value: 'NG' },
    { type: 'segment', segment_id: 'premium-users' }
  ],
  rollout: {
    strategy: 'percentage',
    percentage: 50,
    salt: 'xyz'
  },
  segmentsById: {
    'premium-users': {
      id: 'premium-users',
      rules: [{ attribute: 'plan', operator: 'eq', value: 'pro', type: 'rule' }]
    }
  }
}
```

---

## 🔌 Vue 2 Helpers

### `$flagmint` access

```ts
export default {
  async mounted() {
    await this.$flagmintReady;
    const enabled = this.$flagmint.getFlag('dark-mode', false);
  }
}
```

### ✅ Vue 2 Mixin

```ts
import { useFlagsMixin } from 'vue-feature-flags-sdk/vue2/useFlags';

export default {
  mixins: [useFlagsMixin],
  mounted() {
    console.log(this.featureFlags['dark-mode']);
    console.log(this.getFlag('dark-mode', false));
  }
}
```

---

## 🔌 Vue 3 Helpers

### Option A: Composition API (Recommended)

```ts
import { useFlagClient, useFlagmintReady } from 'vue-feature-flags-sdk';

export default {
  async setup() {
    await useFlagmintReady();
    const flags = useFlagClient();
    const feature = flags.getFlag('chat-enabled', false);
    return { feature };
  }
}
```

### Option B: Injected

```ts
import { inject } from 'vue';

export default {
  setup() {
    const client = inject('__flagmint__');
    const feature = client?.getFlag('chat-enabled');
    return { feature };
  }
}
```

---

## 🧩 Feature Component

In Vue templates, use the `<Feature>` component:

```vue
<template>
  <Feature flag="dark-mode">
    <div>Dark mode is enabled!</div>
  </Feature>
</template>

<script>
import { Feature } from 'vue-feature-flags-sdk/vue3/components';
export default { components: { Feature } };
</script>
```

---

## 🧪 Preview Mode (No Network)

Enable `previewMode: true` in `FlagClientOptions` to evaluate flags **locally only**:

* No API key needed
* Useful for SDK testing, Storybook, or static environments

```ts
createFlagmintPlugin({
  previewMode: true,
  context: { user_id: 'test' }
});
```

You can then load flags directly:

```ts
flagClient.setFlags([flag1, flag2], segmentsById);
```

⚠️ A console warning appears in development when `previewMode` is active.

---

## 🧠 Evaluation Logic

* Operators: `eq`, `neq`, `in`, `nin`, `gt`, `lt`, `exists`, `not_exists`
* Segment references and rule groups
* Rollout strategies:

  * `percentage` — user hashes to percentile
  * `variant` — weighted multi-variant assignment

---

## 🔁 Realtime Updates

Using `transportMode: 'websocket'` or `'auto'`, flags update live when changed.

Fallback to polling if WebSocket fails.

---

## 🗂 Roadmap

* [x] Segment evaluation
* [x] Rollout strategies
* [x] Preview/local-only mode
* [x] Composables and mixins
* [x] WebSocket + fallback
* [x] Feature component
* [ ] SSR / Nuxt support
* [ ] Variant analytics
* [ ] Remote override via devtools

---

## 🪪 License

MIT

