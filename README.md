# Flagmint Vue Feature Flags SDK

A lightweight and powerful feature flag SDK for Vue 2 and Vue 3 applications.

Supports:

✅ Client-side flag evaluation  
✅ Segment targeting and rollout strategies  
✅ Server-Sent Events (SSE) or HTTP long-polling  
✅ Offline caching and preview mode  
✅ Vue 2 and Vue 3 plugin, composables, and helpers
✅ Cross-Iframe & Multi-Tab Socket Optimization (Leader Election)
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
  enableFlagmint: true,
  context: { user_id: 'abc123', country: 'NG' },
  transportMode: 'auto',
  autoRefresh: true,
  previewMode: false,
  // Optional Cross-Iframe Optimization Parameters:
  syncCrossIframes: true,
  syncNamespace: 'wsd_app_prod'

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
  enableFlagmint: true,
  context: { user_id: 'abc123' },
  transportMode: 'auto',
  previewMode: false,
   // Optional Cross-Iframe Optimization Parameters:
  syncCrossIframes: true,
  syncNamespace: 'wsd_app_prod'
}));

app.mount('#app');
```

---

## ⚙️ API Overview

### `FlagClientOptions`

```ts
interface FlagClientOptions {
  apiKey: string;
  enableFlagmint: boolean; // true to connect; false skips the network and evaluation cost
  context?: Record<string, any>;
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
  persistContext?: boolean;
  env?: string; // production | staging
  enableOfflineCache?: boolean;
  cacheTTL?: number;
  transportMode?: 'auto' | 'sse' | 'long-polling';
  previewMode?: boolean;
  onError?: (err: Error) => void;

  // Framework Extension Parameters
  deferInitialization?: boolean;
  syncCrossIframes?: boolean; // Collapses multiple nested iframes/tabs down to 1 open socket
  syncNamespace?: string;     // Unique isolation scope descriptor to prevent account data bleed
}
```

---

## 🎯 Using Flags

### Cross-Iframe & Multi-Tab Connection Sharing

When embedding your Vue application multiple times on a single webpage using nested `iframe` configurations (or when a user leaves your app open across multiple simultaneous browser windows), initializing separate WebSockets or SSE streams per view causes significant connection overhead.

Setting syncCrossIframes: true leverages a reactive browser mesh network strategy via the BroadcastChannel API and Page Visibility API to solve this issue seamlessly.

```
🔒 Security Notice: Always match your syncNamespace parameter configuration with your underlying profile or customer session parameters (e.g. syncNamespace: currentSiteId). This isolates the messaging context and prevents separate client scopes from accidentally reading or blending flag variants in multi-tenant environments.


### ✅ Recommended (Reactive Flags)

Subscribe to flag updates so your component re-renders automatically on every SSE push:

```ts
// Vue 3 Composition API
import { useFlagmint } from 'flagmint-vuejs-feature-flags';

const { getFlag, isReady } = useFlagmint();
const darkMode = computed(() => getFlag('dark-mode', false));
```

```ts
// Vue 2 (via mixin)
export default {
  mixins: [useFlagsMixin],
  mounted() {
    console.log(this.flags['dark-mode']);
    console.log(this.getFlag('dark-mode', false));
  }
}
```

### ⚠️ Non-reactive (snapshot only, won't update on push)

```ts
const enabled = this.$flagmint.getFlag('dark-mode', false);
```

Use this only when you genuinely need a one-time read (e.g. inside a non-reactive utility function). For anything rendered in a template, use the reactive pattern above.

---

## ⏳ Await Initialization

`$flagmintReady` is a reactive boolean ref, not a Promise — watch it rather than awaiting it:

```ts
// Vue 2
this.$watch('$flagmintReady', (ready) => {
  if (ready) { /* client is ready */ }
});
```

```ts
// Vue 3
import { useFlagmintReady } from 'flagmint-vuejs-feature-flags';
const isReady = useFlagmintReady(); // Ref<boolean>
watch(isReady, (ready) => {
  if (ready) { /* client is ready */ }
});
```

If you need a one-time async wait (e.g. before an `onMounted` block runs), call the injected `init()` function instead — it returns a Promise that resolves once the client is ready:

```ts
const client = await this.$flagmintInit(); // Vue 2
```

---

## 🔌 Vue 2 Helpers

### `$flagmint` access

```ts
export default {
  async mounted() {
    const client = await this.$flagmintInit();
    const enabled = client.getFlag('dark-mode', false);
  }
}
```

### ✅ Vue 2 Mixin

```ts
import { useFlagsMixin } from 'flagmint-vuejs-feature-flags/vue2/mixin/useFlagsMixin';

export default {
  mixins: [useFlagsMixin],
  mounted() {
    console.log(this.flags['dark-mode']);
    console.log(this.getFlag('dark-mode', false));
  }
}
```

---

## 🔌 Vue 3 Helpers

### Option A: Composition API (Recommended)

```ts
import { useFlagmint } from 'flagmint-vuejs-feature-flags';

export default {
  setup() {
    const { getFlag, isReady, trackError } = useFlagmint();
    const feature = computed(() => getFlag('chat-enabled', false));
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

## 💡 Debugging Broadcast Channels in DevTools

To verify that multiple frames are collapsing down to a single socket on your local device environment:
- Open Chrome/Edge DevTools (F12) and head to the Application tab.
- In the left panel section menu, find Background Services and click on Broadcast Channels.
- Reload your project page setup. You will see your namespace registration signature.
- Click on your project Network panel tab. Confirm that switching windows or updating your cloud variables updates all views concurrently while creating exactly one websocket initialization record track.
---

## 🧩 Feature Component

In Vue templates, use the `<BoolFeatureGate>` component:
<BoolFeatureGate> is for boolean flags only, and string/number/JSON flags should be read via getFlag() directly and branched on with v-if.

```vue
<template>
  <BoolFeatureGate featureKeys="['dark-mode']">
    <div>Dark mode is enabled!</div>
  </BoolFeatureGate>
</template>

<script setup lang="ts">
import { BoolFeatureGate } from 'flagmint-vuejs-feature-flags/vue3/Feature';
</script>
```

`feature-keys` accepts a single string or an array of strings. If multiple keys are provided, **all** must be enabled.

> ⚠️ **Important:** Never call `client.destroy()` from within a component or composable. `destroy()` tears down the shared SSE connection for the entire application. If you're building a custom integration around `FlagClient`, only ever call `client.subscribe()` and its returned unsubscribe function for component-level cleanup.

---

## 🧪 Preview Mode (No Network)

Enable `previewMode: true` in `FlagClientOptions` to evaluate flags **locally only**:

* No API key needed
* Useful for SDK testing, Storybook, or static environments

```ts
createFlagmintPlugin({
  previewMode: true,
  enableFlagmint: false,
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

Using `transportMode: 'sse'` or `'auto'`, flags update live when changed.

Fallback to polling if SSE fails.

---

## 📊 Application error tracking

Call `trackError` after a flag was served if that variation hurt the user. The JS SDK no-ops when **Analytics Tracking** is off for that flag. The server also drops those events.

```ts
// Vue 3
const { getFlag, trackError } = useFlagmint();

try {
  await submitPayment();
} catch (error) {
  trackError('checkout_redesign', error, { step: 'payment' });
  throw error;
}
```

```ts
// Vue 2 mixin
this.trackError('checkout_redesign', error);
```

`track(flagKey, eventName)` uses the same pipe for custom metrics. Only `kind: 'error'` is counted in app error rate today.

---

## 📦 Versioning & Releases

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
- Never call `client.destroy()` from a component, mixin, or composable — only the plugin/app-level teardown should own that call

---

## 🗂 Roadmap

* [x] Segment evaluation
* [x] Rollout strategies
* [x] Preview/local-only mode
* [x] Composables and mixins
* [x] SSE + long-polling fallback
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

### SSE connection fails
- With `transportMode: 'auto'` the SDK falls back to long-polling
- Check network connectivity and CORS settings
- Verify the API server exposes `GET /evaluator/v2/flags/stream`
- Check browser console for connection errors

### Component re-renders not happening on flag updates
- Make sure you're using the reactive pattern (`useFlagmint()` composable or `useFlagsMixin`) rather than calling `client.getFlag()` directly in a `computed`. The client's internal flag state is not a Vue reactive object — only the `subscribe()`-backed wrappers re-render correctly
- If you unmounted and remounted a `<BoolFeatureGate>` and updates stopped working app-wide, confirm nothing in your codebase calls `client.destroy()` outside of app-level teardown

### Stale flags in offline cache
- Clear localStorage or set `enableOfflineCache: false`
- Adjust `cacheTTL` to control cache duration (in milliseconds)
- Use `previewMode: true` for testing without network

### Performance issues
- Limit the number of flags in targeting rules
- Use the `subscribe()`-backed reactive pattern (via composable or mixin) instead of polling `getFlag()` in a loop
- Consider lazy-loading flags for large applications

### TypeScript issues
- Ensure `tsconfig.json` includes `sdk/` in `include` paths
- Check that `node_modules` types are installed: `npm install`

---

## 📜 License

BSD 3-Clause License