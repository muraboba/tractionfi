import { defineConfig } from 'vitest/config'
import { cloudflareTest } from '@cloudflare/vitest-pool-workers'

export default defineConfig({
  plugins: [
    cloudflareTest({
      main: './tests/worker.ts',
      wrangler: { configPath: './wrangler.toml' },
    }),
  ],
  test: {
    globalSetup: ['./tests/setup.ts'],
  },
})
