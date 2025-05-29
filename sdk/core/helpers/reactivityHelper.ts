import { isVue2, isVue3 } from 'vue-demi';

let makeReactive: ((obj: object) => any) | null = null;

async function resolveReactive(): Promise<(obj: object) => any> {
  if (isVue2) {
    const Vue = require('vue');
    return Vue.observable;
  } else if (isVue3) {
    const vue = await import('vue');
    return vue.reactive;
  } else {
    throw new Error('Unsupported Vue version');
  }
}

/**
 * Call this before creating any clients.
 */
export async function initReactivity() {
  if (!makeReactive) {
    makeReactive = await resolveReactive();
  }
}

/**
 * Returns the reactive function.
 * Throws an error if reactivity hasn't been initialized.
 */
export function getReactiveMaker(): (obj: object) => any {
  if (!makeReactive) {
    throw new Error('Reactivity not initialized. Call initReactivity() first.');
  }
  return makeReactive;
}