# TractionFI

**A personal-finance decision engine.** TractionFI turns the well-known *US Personal Income Spending* flowchart from a static image into a live, personalized engine: you enter your finances across organized tabs, and it returns the single most important next action — plus the roadmap of phases that follow.

🔗 **Live:** [tractionfi.com](https://tractionfi.com)

The product principle is restraint: most finance apps show you ten charts and let you decide. TractionFI surfaces **one decision, calmly**, and explains the reasoning behind it.

---

## Architecture

A TypeScript monorepo with a strict separation between *decision logic* and *delivery*.

```
engine/   Pure-TS decision engine — no I/O, no framework. Deterministic.
web/      Next.js 16 app — data entry, auth, dashboard. Deployed to Cloudflare.
```

### `engine/` — the decision core
A pure TypeScript package (`@tractionfi/engine`) with **no I/O and no framework dependencies**. It takes a user's financial state (paychecks, expenses, assets, debts) and deterministically returns:

- the current **priority** — the single most important next action,
- a prioritized **roadmap** of subsequent financial milestones,
- structural **blockers** (e.g. missing emergency-fund designation, incomplete income data) that must be resolved before a recommendation is possible.

Because the engine is pure and deterministic, it is fully unit-testable in isolation — **56 Vitest unit tests** cover its rules and thresholds.

### `web/` — the application
- **Next.js 16** / **React 19** / **Tailwind CSS v4** / **shadcn/ui** + **Base UI**
- **Cloudflare Workers** via the `@opennextjs/cloudflare` adapter (edge-deployed)
- **Cloudflare D1** (serverless SQLite) accessed through **Kysely** (`kysely-d1`) — typed queries, schema migrations via Wrangler
- **Better Auth** for authentication with **Resend**-powered email verification
- A debounced autosave layer with optimistic-concurrency conflict handling (409 resolution) over a versioned user-state blob
- A two-layer auth gate: fast cookie check in edge middleware + full validation in the server layer

## Testing

| Layer | Tooling |
|---|---|
| Engine unit tests | Vitest (56 tests) |
| Web unit/integration | Vitest + `@cloudflare/vitest-pool-workers` |
| End-to-end | Playwright (smoke + signup/multi-device flows against production) |

```bash
npm run test        # engine unit tests
npm run typecheck   # typecheck both workspaces
```

## Local development

Requires Node 20+ and a Cloudflare account (for D1).

```bash
npm install                      # install workspace deps
npm run dev                      # run the web app locally (Next.js)

npm run db:migrate:local         # apply D1 migrations to the local shadow DB
npm run db:migrate:prod          # apply to production D1
```

Secrets (`BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `BETTER_AUTH_API_KEY`) are provided as Cloudflare secrets / `.dev.vars` locally and are **not** committed.

## Deployment

```bash
npm run deploy      # opennextjs-cloudflare build && deploy to Cloudflare Workers
```

## Project docs

- [`PRODUCT.md`](./PRODUCT.md) — product purpose, audience, design principles
- [`PRD.md`](./PRD.md) — full product requirements
- [`DESIGN.md`](./DESIGN.md) — visual system and design tokens
- [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) — current state and open items

---

*Built by [Judy Chen](https://linkedin.com/in/judychenco).*
