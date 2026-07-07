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
    // e2e/*.spec.ts are Playwright suites — they crash the workers pool if collected
    include: ['tests/**/*.test.ts'],
    globalSetup: ['./tests/setup.ts'],
  },
})
