export type FeatureFlags<T = unknown> = Record<string, T>;

function getFlagsKey(apiKey: string): string {
  return `flagmint_${apiKey}_flags`;
}

function getContextKey(apiKey: string): string {
  return `flagmint_${apiKey}_context`;
}

export function loadCachedFlags<T>(apiKey: string, ttl: number): FeatureFlags<T> | null {
  try {
    const raw = localStorage.getItem(getFlagsKey(apiKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > ttl) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function saveCachedFlags<T>(apiKey: string, data: FeatureFlags<T>) {
  try {
    localStorage.setItem(getFlagsKey(apiKey), JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // silent fail
  }
}

export function loadCachedContext<C>(apiKey: string): C | null {
  try {
    const raw = localStorage.getItem(getContextKey(apiKey));
    return raw ? (JSON.parse(raw) as C) : null;
  } catch {
    return null;
  }
}

export function saveCachedContext<C>(apiKey: string, context: C) {
  try {
    localStorage.setItem(getContextKey(apiKey), JSON.stringify(context));
  } catch {
    // silent fail
  }
}