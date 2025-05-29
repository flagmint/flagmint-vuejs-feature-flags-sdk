
Here's an updated **README** that reflects everything we've built:

* Internalized `endpoint` and `wsEndpoint`
* Added `transportMode` (`auto`, `websocket`, `long-polling`)
* Exposed `$flagmintReady` and `useFlagmintReady()`
* Updated naming to `FlagClient`, `$flagmint`, `flagClientInstance`

---

### ✅ **Updated README**

````md
# Vue Feature Flags SDK

A lightweight feature flag SDK for Vue 2 and Vue 3 applications. This SDK lets you evaluate feature flags client-side using a centralized backend (with support for WebSocket or HTTP long-polling).

Supports:

* ✅ Vue 2 (via plugin, `$flagmint`, and optional mixin)
* ✅ Vue 3 (via plugin, `globalProperties.$flagmint`, `inject()`, and `useFlagClient()` composable)

---

## Installation

```bash
npm install vue-feature-flags-sdk
````

---

## Usage

### Vue 2

```ts
// main.js
import Vue from 'vue';
import { createFlagmintPlugin } from 'vue-feature-flags-sdk';

Vue.use(createFlagmintPlugin({
  apiKey: 'your-api-key',
  context: {
    user_id: 'abc123',
    country: 'NG',
  },
  transportMode: 'auto', // 'auto' | 'websocket' | 'long-polling'
  autoRefresh: true,
  refreshIntervalMs: 10000
}));

new Vue({
  render: h => h(App)
}).$mount('#app');
```

#### Option A: Access via `$flagmint`

```ts
export default {
  async mounted() {
    await this.$flagmintReady;
    const flag = this.$flagmint.getFlag('new-ui-enabled', false);
    console.log('Flag:', flag);
  }
}
```

#### Option B: Use mixin

```ts
import { useFlagsMixin } from 'vue-feature-flags-sdk/vue2/useFlags';

export default {
  mixins: [useFlagsMixin],
  mounted() {
    console.log('Flags:', this.featureFlags);
    console.log('New UI:', this.getFlag('new-ui-enabled'));
  }
}
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
  context: {
    user_id: 'abc123',
    plan: 'pro'
  },
  transportMode: 'auto'
}));

app.mount('#app');
```

#### Option A: Options API

```ts
export default {
  async mounted() {
    await this.$flagmintReady;
    const flag = this.$flagmint.getFlag('new-ui-enabled', false);
    console.log('Flag:', flag);
  }
}
```

#### Option B: Composition API (inject)

```ts
import { inject } from 'vue';

export default {
  setup() {
    const flags = inject('__flagmint__');
    const newUI = flags?.getFlag('new-ui-enabled', false);
    return { newUI };
  }
}
```

#### Option C: `useFlagClient()` composable

```ts
import { useFlagClient, useFlagmintReady } from 'vue-feature-flags-sdk';

export default {
  async setup() {
    await useFlagmintReady();
    const flags = useFlagClient();
    const isDarkMode = flags.getFlag('dark-mode', false);
    return { isDarkMode };
  }
}
```

---

## API

### `FlagClientOptions`

```ts
interface FlagClientOptions {
  apiKey: string;
  context?: Record<string, any>;
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
  persistContext?: boolean;
  enableOfflineCache?: boolean;
  cacheTTL?: number; // ms
  transportMode?: 'auto' | 'websocket' | 'long-polling';
}
```

### `FlagClient` Methods

* `getFlag(key: string, fallback?: any): any`
  Returns the evaluated flag value or the fallback.

* `updateContext(context: Record<string, any>): void`
  Merges new context for future evaluations.

* `fetchFlags(): Promise<Record<string, any>>`
  Manually fetches updated flags.

* `ready(): Promise<void>`
  Resolves once flags have been initialized and are ready to use.

* `destroy(): void`
  Tears down the client (intervals, sockets).

---

## Realtime Updates

When using `transportMode: 'websocket'` or `'auto'`, flags are updated in real-time from the server via WebSocket.

If WebSocket fails and `auto` mode is enabled, the SDK automatically falls back to long-polling.

---

## SSR / Nuxt Support

Coming soon.

---

## License

MIT

---

## Roadmap

* [ ] SSR / Nuxt 3 integration
* [ ] A/B testing and variants
* [ ] Analytics event hooks
* [x] Offline caching
* [x] WebSocket fallback and real-time updates
* [x] `$flagmintReady` promise for boot-time usage
* [ ] Flag variant analytics
* [ ] Segment targeting SDK helper


