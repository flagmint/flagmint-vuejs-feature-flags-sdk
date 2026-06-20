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
npm install flagmint-vuejs-feature-flags
````

---

## 🚀 Quick Start

### Vue 2

```ts
// main.js
import Vue from 'vue';
import { createFlagmintPlugin } from 'flagmint-vuejs-feature-flags';

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
import { createFlagmintPlugin } from 'flagmint-vuejs-feature-flags';

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
import { useFlagsMixin } from 'flagmint-vuejs-feature-flags/vue2/mixin/useFlagsMixin';

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
import { useFlagClient, useFlagmintReady } from 'flagmint-vuejs-feature-flags';

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

In Vue templates, use the `<FlagmintFeatureGate>` component:

```vue
// featureKeys is a string or array of strings representing the flags to be evaluated
<template>
  <FlagmintFeatureGate featureKeys="dark-mode|[dark-mode, new-dashboard]">
    <div>Dark mode is enabled!</div>
  </FlagmintFeatureGate>
</template>

<script>
import { FlagmintFeatureGate } from 'flagmint-vuejs-feature-flags/vue3/component/FlagmintFeatureGate.vue';
export default { components: { FlagmintFeatureGate } };
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

## � Versioning & Releases

This project follows [Semantic Versioning](https://semver.org/). Releases are automated via GitHub Actions:

- Changes to `sdk/`, `package.json`, `rollup.config.js`, or `tsconfig.json` on the `main` branch trigger the release workflow
- The workflow extracts the version from `package.json`, builds the package, and publishes to npm
- Git tags and GitHub releases are automatically created

**To release a new version:**
1. Update the version in `package.json`
2. Update [CHANGELOG.md](https://github.com/jtad009/flagmint-vuejs-feature-flags-sdk/blob/main/CHANGELOG.md) with your changes
3. Push to `main` branch
4. The workflow handles the rest

See [CHANGELOG.md](https://github.com/jtad009/flagmint-vuejs-feature-flags-sdk/blob/main/CHANGELOG.md) for version history and release notes.

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Build the project: `npm run build`
5. Create a feature branch: `git checkout -b feature/your-feature`
6. Make your changes and commit
7. Push to your fork and create a Pull Request

**Development Tips:**
- The SDK supports both Vue 2 and Vue 3 — test changes against both versions
- Keep bundle size in mind when adding dependencies
- Run tests before submitting PRs

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

## 🐛 Troubleshooting

### Flags not loading
- Ensure `apiKey` is valid and environment has network access
- Check browser console for errors
- Verify `context` is properly set with required attributes
- If using `previewMode: true`, ensure you've called `flagClient.setFlags()`

### WebSocket connection fails
- The SDK automatically falls back to long-polling
- Check network connectivity and CORS settings
- Verify the API server supports WebSocket connections
- Check browser console for connection errors

### Stale flags in offline cache
- Clear localStorage or set `enableOfflineCache: false`
- Adjust `cacheTTL` to control cache duration (in milliseconds)
- Use `previewMode: true` for testing without network

### Performance issues
- Limit the number of flags in targeting rules
- Use `getReactiveFlags()` for reactive updates instead of polling
- Consider lazy-loading flags for large applications

### TypeScript issues
- Ensure `tsconfig.json` includes `sdk/` in `include` paths
- Check that `node_modules` types are installed: `npm install`

---

## 📜 License

BSD 3-Clause License


