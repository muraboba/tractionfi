#!/usr/bin/env pwsh
# Apply all D1 migrations to the local dev shadow of the production DB.
# Run this after every `git pull` that touches web/migrations/.
npx wrangler d1 migrations apply tractionfi --local
