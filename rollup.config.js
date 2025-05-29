// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import vue from 'rollup-plugin-vue';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
const envReplacements = replace({
  preventAssignment: true,
  values: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
     preventAssignment: true,
  }
});
export default [
  {
    input: 'sdk/plugin.ts',
    output: [
      { file: 'dist/index.cjs.js', format: 'cjs' },
      { file: 'dist/index.esm.js', format: 'esm' }
    ],
    plugins: [envReplacements, typescript()],
    external: ['vue', 'vue-demi']
  },
  {
    input: 'sdk/vue2/mixin/useFlagsMixin.ts',
    output: [
      { file: 'dist/vue2.mjs', format: 'esm' }
    ],
    plugins: [typescript()],
    external: ['vue', 'vue-demi']
  },
  {
  input: 'sdk/vue2/component/Feature.vue',
  output: [{ file: 'dist/vue2-feature.mjs', format: 'esm' }],
  plugins: [
    resolve(),
    vue({ target: 'browser' }),
    commonjs(),
    typescript()
  ],
  external: ['vue', 'vue-demi']
},
  {
    input: 'sdk/vue3/composable/useFlags.ts',
    output: [
      { file: 'dist/vue3.mjs', format: 'esm' }
    ],
    plugins: [typescript()],
    external: ['vue', 'vue-demi']
  },
  {
  input: 'sdk/vue3/component/Feature.vue',
  output: [{ file: 'dist/vue3-feature.mjs', format: 'esm' }],
  plugins: [
    resolve(),
    vue({ target: 'browser' }),
    commonjs(),
    typescript()
  ],
  external: ['vue', 'vue-demi']
},
  // Core Plugin (types)
  {
    input: 'sdk/plugin.ts',
    output: { file: 'dist/index.d.ts', format: 'es' },
    plugins: [dts()],
  },
  // Vue 2 helper (types)
  {
    input: 'sdk/vue2/mixin/useFlagsMixin.ts',
    output: { file: 'dist/vue2.d.ts', format: 'es' },
    plugins: [dts()],
  },
  // Vue 3 helper (types)
  {
    input: 'sdk/vue3/composable/useFlags.ts',
    output: { file: 'dist/vue3.d.ts', format: 'es' },
    plugins: [dts()],
  }
];

// This Rollup configuration compiles TypeScript files from 'src/index.ts' into both CommonJS and ESM formats,
// outputting them to the 'dist' directory. It uses the 'rollup-plugin-typescript2' plugin for TypeScript support.
// The 'vue' and 'vue-demi' packages are marked as external dependencies, meaning they won't be bundled into the output files.
// This allows the library to be used in projects that already have these dependencies installed, avoiding duplication.
// The output files will be 'dist/index.js' for CommonJS and 'dist/index.esm.js' for ESM, making it compatible with both module systems.
// The configuration is suitable for building libraries that need to be consumed by other projects, especially in the Vue ecosystem.