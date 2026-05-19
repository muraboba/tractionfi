#!/usr/bin/env pwsh
# Apply all D1 migrations to the local dev DB.
# Run this after every `git pull` that touches web/migrations/.
npx wrangler d1 migrations apply tractionfi-dev --local
