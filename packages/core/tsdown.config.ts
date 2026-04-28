import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  deps: {
    neverBundle: ['react'],
  },
});
