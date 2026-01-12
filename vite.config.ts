import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@oneblink/apps': path.resolve(__dirname, 'src/apps'),
    },
  },
  test: {
    environment: 'jsdom',
  },
})
