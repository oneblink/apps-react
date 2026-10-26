import process from 'node:process'

export default {
  root: import.meta.dirname,
  base: './',
  build: {
    outDir: process.env.HARNESS_OUT_DIR || 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    rolldownOptions: { shimMissingExports: true },
  },
  preview: { port: Number(process.env.HARNESS_PORT || 4173) },
}
