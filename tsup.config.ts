import { defineConfig } from 'tsup'

export default defineConfig({
  target: 'es2022',
  keepNames: true,
  format: ['cjs', 'esm'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  entry: ['index.ts'],
})
