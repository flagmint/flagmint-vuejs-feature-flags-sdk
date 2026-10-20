# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.1] - 2026-10-20

### Changed
- Depend on stable `flagmint-js-sdk` `^2.2.3` (local-evaluation reload / cross-tab cache fixes, rules-only connection sharing, lease renewals). See the JS SDK `[2.2.3]` changelog.

> npm: `npm install flagmint-vuejs-feature-flags@2.1.1`

Pre-releases `2.1.1-rc.0`–`rc.6` tracked the JS SDK RC line; prefer this stable. Avoid anything that still resolves `flagmint-js-sdk@2.2.3-rc-2` (typo publish; regressed config-sync offline cache).

## [2.1.0] - 2026-10-14

### Changed
- Depend on `flagmint-js-sdk` ^2.2.2 (config-sync PII hash-before-compare / `hmac-v1`, plus prior config-sync / stream / sharing fixes).
- Store the `FlagClient` in a `shallowRef` + `markRaw` so Vue does not deeply proxy the client (important for `shareConnection` / BroadcastChannel).

### Added
- Document `shareConnection` as a first-class plugin option (passed through to the JS SDK; default `true` in browsers with `BroadcastChannel`).
- Document `configSync` (local evaluation / signed rules) in the README — passed through to `flagmint-js-sdk` ^2.2.2.

### Fixed
- Reset `initPromise` (and tear down the client) if anything after `ready()` fails, so `init()` can retry and automatic init still reports via `onError`.
- Clarify in README that shared SSE requires `BroadcastChannel`.

## [1.4.0] - 2026-08-18

### Changed
- Depend on `flagmint-js-sdk` ^2.0.0 (SSE transport; `transportMode: 'auto' | 'sse' | 'long-polling'`).
- Pass `enableFlagmint` through from plugin options instead of forcing a connection.
- Remove Vue-level iframe leader election. Tab/iframe sharing is handled by `flagmint-js-sdk` (`shareConnection`).

### Added
- `trackError` / `track` on `useFlagmint()` and the Vue 2 mixin, gated by Analytics Tracking on the flag.
- `createFlagmintPlugin` alias for `createFeatureFlagPlugin`.

## [1.3.7] - 2026-06-29

### Fixed
- `useFlagmint` composable: resolved temporal dead zone crash (`ReferenceError: can't access lexical declaration 'stopWatch' before initialization`) when the plugin was already initialised before a component mounted. The `watch` callback with `{ immediate: true }` fired synchronously before `const stopWatch` was assigned; refactored to use `let` to avoid the forward reference.
- `BoolFeatureGate`: updated slot API from a single default slot to named `#enabled` and `#disabled` slots, allowing components to declaratively render fallback UI when a flag is off without additional `v-if`/`v-else` logic in the consuming component.


## [1.3.2] 2026-06-24
- Add support for updating context using the updateContext function

## [1.3.1] 2026-06-20

### Added
- Rename <Feature> Component to <BoolFeatureGate> component 

## [1.3.0] 2026-06-19

### Added
- Automated release workflow with GitHub Actions
- Comprehensive README with troubleshooting guide
- Contributing guidelines
- <Feature> component destroy() bug fix
- <Feature> reactivity fix (subscribe model)
- useFlagmint composable rewrite (subscribe model, top-level inject)
- Plugin module-level state scoped to install()
- useFlagsMixin Vue 2 fixes (subscribe model, cleanup, type corrections)

## [1.2.0] - 2026-06-19

### Added
- Vue 3 Composition API support with `useFlagClient()` and `useFlagmintReady()`
- Vue 3 `<Feature>` component for conditional rendering
- Offline caching with configurable TTL
- Preview mode for local-only flag evaluation
- WebSocket and long-polling transport options
- Variant-based rollout strategies

### Changed
- Improved segment evaluation logic
- Enhanced error handling with `onError` callback
- Updated documentation with examples

### Fixed
- WebSocket connection fallback to long-polling
- Context persistence across page reloads

## [1.1.0] - 2026-03-15

### Added
- Vue 2 mixin support via `useFlagsMixin`
- Global `$flagmint` property access
- `$flagmintReady` initialization promise
- Reactive flag updates with `getReactiveFlags()`

### Added
- Initial public release
- Core flag evaluation engine
- Segment targeting support
- Rollout strategies (percentage-based)
- Vue 2 and Vue 3 integration

---

## Changelog Guidelines

When making changes, update this file following these rules:

1. **Date Format**: Use `YYYY-MM-DD` format for release dates
2. **Version Format**: Follow [Semantic Versioning](https://semver.org/) - MAJOR.MINOR.PATCH
3. **Section Types**:
   - `Added` - for new features
   - `Changed` - for changes in existing functionality
   - `Deprecated` - for features that will be removed soon
   - `Removed` - for removed features
   - `Fixed` - for bug fixes
   - `Security` - for security-related changes

4. **Before Releasing**:
   - Move entries from `[Unreleased]` to the new version section
   - Create a new release tag (handled by GitHub Actions workflow)
   - Update version in `package.json`

5. **Example Entry**:
   ```markdown
   ## [X.Y.Z] - YYYY-MM-DD

   ### Added
   - New feature description

   ### Fixed
   - Bug fix description
   ```
