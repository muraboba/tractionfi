/// <reference types="@cloudflare/vitest-pool-workers/types" />

import type { D1Migration } from '@cloudflare/vitest-pool-workers'

declare module 'vitest' {
  interface ProvidedContext {
    D1_MIGRATIONS: D1Migration[]
  }
}
