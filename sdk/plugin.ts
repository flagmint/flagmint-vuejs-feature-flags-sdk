import { isVue2, isVue3, Plugin } from 'vue-demi';
import { FlagClient, FlagClientOptions } from '@/core/client';
import { initReactivity } from '@/core/helpers/reactivityHelper';


export let flagClientInstance: FlagClient;
export let flagmintReady: Promise<void>;

const createFeatureFlagPlugin = <
  T = unknown,
  C extends Record<string, any> = Record<string, any>
>(
  options: FlagClientOptions<C>
): Plugin => ({
  async install(appOrVue: any) {
    await initReactivity(); // ✅ Initialize reactivity layer before using it
    flagClientInstance = new FlagClient<T, C>(options);
    flagmintReady = flagClientInstance.ready(); // ✅ Await internal .ready()
     if (isVue3) {
        appOrVue.config.globalProperties.$flagmint = flagClientInstance;
         appOrVue.config.globalProperties.$flagmintReady = flagmintReady;
        appOrVue.provide('__flagmint__', flagClientInstance);
      } else if (isVue2) {
        appOrVue.prototype.$flagmint = flagClientInstance;
        appOrVue.prototype.$flagmintReady = flagmintReady;
      }
    if (options.previewMode && (import.meta?.env?.DEV || process.env.NODE_ENV === 'development')) {
      console.warn(
        '[flagmint] Preview Mode is enabled via plugin. Avoid using this in production.'
      );
    }
  }
});

/**
 * Alternate factory name for clarity and alignment with import usage.
 * Users can call `createFlagmintPlugin()` instead of `createFeatureFlagPlugin()`.
 */
export function createFlagmintPlugin<C extends Record<string, any>>(
  options: FlagClientOptions<C>
): Plugin {
  return createFeatureFlagPlugin(options);
}
// Optional helper to access the instance in composition API
export function useFlagClient<T = unknown>() {
  return flagClientInstance as FlagClient<T>;
}

export function useFlagmintReady(): Promise<void> {
  return flagmintReady;
}