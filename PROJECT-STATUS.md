# PROJECT-STATUS.md — TractionFI

> Living status doc. The wrapup skill updates this at the end of each session.

## Purpose

Personal finance decision engine + web app implementing the US Personal Income Spending flowchart.

## Tech Stack

- TypeScript monorepo — engine (pure TS) + web (Next.js 16 / React 19 / Tailwind 4)
- Deploy target: Cloudflare Workers + Assets (via @opennextjs/cloudflare) + D1 + Better Auth

## Current Phase

**Phase 5 in progress — Steps 5.1, 5.2, 5.3 complete (dashboard shell shipped as `43cec86`; first real consumer of `useEngineState`). Next: Step 5.4 (real per-tab components, replacing the `_components/` placeholders).**

## Last Changed

- 2026-05-22 (session N) — **`/verify-pending` UX polish complete.** Single file change: `web/src/app/verify-pending/page.tsx`.
  - **Email fallback from session:** when `?email=` param is absent, useEffect falls back to `GET /api/auth/get-session` and pre-fills the Resend button from `user.email`. Cancellation flag prevents stale setState on unmount.
  - **Signed-out affordance:** `emailState` state ('loading' | 'present' | 'missing'). When `missing`, Resend is replaced by "Log in to retry" button (navigates to `/login`).
  - **Cursor fix:** Tailwind v4 drops `cursor: pointer` from button preflight. All buttons now carry explicit `cursor-pointer`; disabled state gets `disabled:cursor-not-allowed disabled:opacity-50`.
  - **"Already verified?" modal:** clicking now shows a shadcn `<Dialog>` ("Not verified yet") when the session has `emailVerified: false`. Modal includes a "Resend link" button when email is known, and a Close button. Button shows "Checking…" during the fetch.
  - **`type="button"` on all three buttons** (defensive, prevents form-submission regression).
  - Typecheck clean · 8/8 web tests pass.

- 2026-05-22 (session M) — **Pre-Step-5.3 checklist + Step 5.3 dashboard shell shipped.** One commit on `feat/v1-migration`: `43cec86` (11 files, +497/-242). Bundled Step 5.2 (untracked from session L) with Step 5.3.
  - **Static gates** — typecheck (engine + web), 56/56 engine, 8/8 web, `next build`, lint on `use-engine-state.ts` (clean). 430 web lint errors are pre-existing baseline (e.g. `verify-pending/page.tsx` set-state-in-effect from session I).
  - **Visual smoke (Claude Preview MCP)** — walked `/`, `/login`, `/signup`, `/reset`, `/reset/confirm`, `/dashboard`, `/verify-pending` across dark + light. CSS tokens all resolve, **CTA polarity flips correctly via `text-brand-foreground`** (`#0a0a10` dark / `#fdfdfe` light — session K's rename created a `--brand-foreground` token; `--accent-foreground` is now correctly shadcn's neutral-surface text token, not the brand CTA text token). Priority card warm shadow softens in light per session H plan (`0.4` → `0.28` alpha). **Zero console errors** anywhere. Old dashboard stub had mojibake (`â† back to landing`, `Â·` separators) — gone in 5.3 rewrite.
  - **Auth + persistence regression (signed-in via Preview)** — GET `/api/user_state` returns `{ user_id: string, blob: CurrentBlob (empty userData + schemaVersion 1), version: 0 }` for new accounts. First PUT with version=0 → 200 `{ version: 1 }`. Stale PUT with version=0 (after server moved to 1) → 409 `{ error: 'conflict', current: { blob, version: 1 } }`. Both shapes match the hook's `PutOkResponse` / `PutConflictResponse` types exactly.
  - **Pre-5.3 decisions locked:**
    - **ConflictBanner resolution: Option 2 (extend hook).** Hook now exposes `conflictVersion`, `acceptServer()`, `keepMine()`. Departs from session-L PROJECT-STATUS preference for "re-GET" because (1) the 409 payload already carries server blob+version — re-GET discards free data; (2) a third write landing between conflict and re-GET would silently change what the banner committed; (3) state machine stays in one place. Surface growth: +1 field, +2 callbacks.
    - **Sidebar at narrow viewports: `grid-cols-1 lg:grid-cols-[1fr_320px]`.** Sidebar stacks below main under `lg` (1024px); switches to right column with `border-l` at `lg+`. Verified at both 665px (stacked) and 1280px (main 960 / aside 320 at x=960). Defers polished mobile UX to Phase 9.
  - **Step 5.3 — dashboard shell** at `web/src/app/dashboard/page.tsx` (rewritten). Wired to `useEngineState`. Loading state, topbar (theme toggle + logout, preserved from prior stub), Setup-N-left destructive badge anchored to Recommendations when `blockers.length > 0`, conditional ConflictBanner / OfflineBanner, 6-tab Tabs primitive (default = Recommendations, gear icon when blocked), Engine + tax-year footer with proper U+00B7 middle dot.
  - **Placeholder per-tab components** in `web/src/app/dashboard/_components/`: `paycheck-tab.tsx`, `incomes-tab.tsx`, `expenses-tab.tsx`, `assets-tab.tsx`, `debts-tab.tsx`, `recommendations-tab.tsx` (renders blocker list / priority card / roadmap from `output`), `summary-sidebar.tsx` (6 metrics with positive/negative cash-flow tone), `conflict-banner.tsx` (Accept server / Keep mine buttons wired to the new hook callbacks), `offline-banner.tsx`. All satisfy the prop signatures the shell threads.
  - **`useEngineState` extended** — `EngineState.conflictVersion?: number` added; 409 handler stores it; `acceptServer()` swaps blob+version locally and clears conflict fields; `keepMine()` re-PUTs `state.blob` at `state.conflictVersion`. Pure state transitions; no extra fetch on Accept.
  - **Out-of-scope follow-up spawned:** `/verify-pending` UX bug — Resend silently disables when URL lacks `?email=` param; stale-tab case can make all 3 buttons appear inert. Fix: derive email from session, add a visible "log in to retry" fallback, explicit `type="button"`. Not blocking Phase 5; should land before Phase 8 E2E.

- 2026-05-22 (session L) — **Phase 5 Step 5.2 complete — `useEngineState` hook written.** No commit yet; file is untracked on `feat/v1-migration`.
  - **New file:** `web/src/lib/use-engine-state.ts` (~125 lines). Implements `tasks/todo.md` lines 1089-1156 verbatim plus three minimum-bar correctness additions:
    - `cancelled` flag on the initial-load `useEffect` — StrictMode double-mount safety.
    - `try/catch` around the PUT fetch in `save()` — prevents a network reject from leaving `status` pinned to `'saving'` forever.
    - Unmount cleanup `useEffect` clears `saveTimer.current` so a queued autosave can't fire after the dashboard unmounts.
  - **Public surface:** `{ state: { blob, version, status, conflictBlob? }, output: EngineOutput | null, updateBlob: (mut) => void }`. Statuses: `loading | ready | saving | conflict | offline`. Autosave debounce constant `AUTOSAVE_DEBOUNCE_MS = 500` (spec §9 question 4; tune during E2E).
  - **API contracts confirmed** against `web/src/app/api/user_state/route.ts` + `web/src/server/queries/user_state.ts`: GET returns `{ user_id, blob, version }` (hook ignores `user_id`); PUT returns `{ version }` on 200, `{ error: 'conflict', current: { blob, version } }` on 409. Hook shape matches.
  - **Known caveat for Step 5.3:** on 409 the hook stores `conflictBlob: current.blob` but keeps `state.version` at the pre-conflict value (per spec). `ConflictBanner` resolution will need to either re-GET to re-sync or be extended to also track `conflictVersion`. Re-GET is simpler — leave the hook surface small.
  - **Verified:** `npm run typecheck` (engine + web) ✓ · `npm test --workspace=engine` 56/56 ✓ · `npm test --workspace=web` 8/8 ✓.
  - **Not done this session (deferred to next):** manual browser smoke of dashboard wiring once Step 5.3 shell exists; visual smoke of the Phase 5.1 token rename surfaces (still pending from session K).

- 2026-05-21 (session K) — **Theme toggle committed + Phase 5.1 shadcn/ui install + token reconcile.** Two commits on `feat/v1-migration`.
  - **Commit `04d3896`** — theme toggle + brand lockup + landing modularization (29 files, +2196/-86). Auto-mode decision: commit theme toggle as-is, defer auth-page brand presence to Phase 9 (`/ui-ux-pro-max` design pass). Reasoning: auth pages already inherit theme tokens correctly; partial styling now → redo later.
  - **Commit `e0c9693`** — Phase 5.1 (25 files, +2994/-326). shadcn init clobbered our dark `:root` tokens with light oklch values; reconciled by restoring our dark canvas and adding shadcn semantic tokens as aliases. Two semantic renames forced by the integration:
    - `--accent → --brand` (shadcn's `--accent` = subtle hover bg; ours was the electric purple CTA). Tailwind classes `bg-accent/text-accent/border-accent/accent-foreground/accent-hover/accent-glow/accent-dim` → `bg-brand` etc., done via PowerShell regex `(?<!priority-)accent` to preserve `priority-accent`.
    - `--muted → --muted-foreground` (shadcn's `--muted` = subtle bg; ours was a gray foreground text color). Tailwind `text-muted` → `text-muted-foreground` across 12 files via `text-muted(?![\w-])` (preserves `text-muted-2` and existing `text-muted-foreground` stubs).
  - **shadcn token mapping** in both `:root` (dark) and `[data-theme="light"]`: `--card`/`--popover` → `var(--surface)`; `--primary` → `var(--brand)`; `--secondary`/`--muted`/`--accent` → `var(--surface-2)`; `--destructive` → `var(--danger-fg)`; `--input` → `var(--border)`; `--ring` → `var(--brand)`; `--radius` 0.625rem.
  - **`@custom-variant dark`** rewritten as `&:where(:root:not([data-theme="light"]) *, :root:not([data-theme="light"]))` to fire on our default-dark inversion model. shadcn's `.dark` block dropped.
  - **shadcn stack:** base-nova preset → `@base-ui/react` primitives (not Radix). `lucide-react` for icons. `tw-animate-css` import for animations.
  - **Components added:** `alert`, `badge`, `button`, `card`, `checkbox`, `dialog`, `input`, `label`, `tabs` (in `web/src/components/ui/`). Plus `web/src/lib/utils.ts` (cn helper) and `web/components.json` config.
  - **Verified:** typecheck (engine + web), 56 engine tests, 8 web tests, `next build` all green after both commits.

- 2026-05-21 (session J) — **Manual browser smoke test of theme toggle passed (7/7 steps).** No code changes this session — design discussion only.
  - **Smoke test result:** Dark-mode OS → dark renders ✓; toggle → light ✓; refresh persists ✓; clear localStorage → OS default ✓; OS switch live-follows ✓; toggle on `/login` works ✓; brand lockup readable in both themes ✓.
  - **Auth pages design question raised:** Login/signup/reset pages use bare Phase 4 stubs (plain centered card, no brand topbar, no accent colors). Theme tokens (background, border, text) do apply correctly via CSS vars, but pages have no visual brand presence.
  - **Decision deferred:** Whether to add minimal brand presence to auth pages before committing the theme toggle, or leave it for Phase 9 (design system pass). User to decide at next session start.

- 2026-05-21 (session I) — **Theme toggle + light palette fully implemented.** All code shipped; typecheck + 8 web + 56 engine tests pass. Not yet deployed.
  - **`[data-theme="light"]` token block** added to `web/src/app/globals.css` with full cool-clinical palette per session H brief. New tokens: `--priority-shadow` (dark `0 30px 80px -30px rgba(194,65,12,0.4)`, light softened `0 24px 64px -28px rgba(194,65,12,0.28)`), `--accent-foreground` (dark = `--background` / light = `#fdfdfe` for CTA polarity flip). Light canvas removes radial glow via `[data-theme="light"] body { background-image: none }`.
  - **FOUC-prevention inline script** added to `<head>` in `web/src/app/layout.tsx`. Reads `localStorage['tractionfi:theme']`, falls back to `prefers-color-scheme`, sets `data-theme` on `<html>` before React mounts. `suppressHydrationWarning` added to `<html>`.
  - **`useTheme()` hook** at `web/src/lib/theme.ts`. Uses `useSyncExternalStore` (React 19 — avoids setState-in-effect lint rule). Exposes `{ theme, preference, setPreference, mounted }`. Module-level store with `matchMedia` listener for System mode; `localStorage['tractionfi:theme']` persistence.
  - **`ThemeToggle` component** at `web/src/components/theme-toggle.tsx`. Inline Lucide-style Sun/Moon SVG (no extra dep). 44×44, 150ms transition on icon, `aria-live="polite"` sr-only announcement. Shows Sun when dark (click → light), Moon when light (click → dark).
  - **`BrandLockup` component** at `web/src/components/brand-lockup.tsx`. Inlines `lockup-horizontal.svg` as React JSX using `var(--foreground)` / `var(--accent)` — required because the SVG asset hardcoded `#F5F5FA` (invisible on light bg). `<Image src="/brand/lockup-horizontal.svg">` replaced in topbar + footer.
  - **`(auth)/layout.tsx`** created at `web/src/app/(auth)/layout.tsx`. Adds fixed top-right ThemeToggle to login, signup, reset, reset/confirm pages.
  - **Toggle wired into all surfaces:** landing TopBar, dashboard header, `(auth)/layout.tsx`, `verify-pending/page.tsx` (inline floating).
  - **CTA polarity fix across all landing + dashboard:** `text-background` → `text-accent-foreground` on all `bg-accent` elements (hero, footer, framework chip, topbar CTA, dashboard milestone active badge).
  - **Priority shadow tokenized:** all 4 priority card instances (`hero`, `priority-preview`, `demo`, `dashboard`) now use `shadow-[var(--priority-shadow)]` instead of hardcoded value.
  - **Open question resolved:** toggle IS on all Better Auth pages (no layout collision). Settings → Appearance segmented radio **deferred** — no Settings page yet (Phase 7).
  - typecheck ✓ · lint clean on new files · 8 web + 56 engine tests pass · FOUC script + toggle aria-labels confirmed in served HTML via curl.

- 2026-05-21 (session H) — **Impeccable shape: dark/light theme toggle design brief locked.** No code changed this session — design planning only.
  - **PRODUCT.md created** at project root (was missing; impeccable gate required it). Register = `product`; 5 design principles distilled from PRD + existing DESIGN.md, with the cream-priority-card-does-not-invert invariant explicitly carried forward into light mode.
  - **Design brief locked for theme toggle feature:**
    - **Light palette strategy:** Cool-clinical (Stripe / Vercel / Apple System Settings anchors), not warm-paper. Rationale: principle #2 ("the user's decision glows, not the chrome") requires the cream priority card to pop against neutral surroundings; a warm-paper canvas would mute it by sympathy.
    - **Tokens (light):** bg `#F6F7FB`, surface `#FDFDFE`, surface-2 `#EEF0F5`, border `#E1E3EC`, border-strong `#C7CAD6`, foreground `#0F1019` (AAA), muted `#5F627A` (AAA), muted-2 `#767889` (AA floor at 18px+). Accent `#6B5BFF` (was already hinted in DESIGN.md § Light mode; 4.8:1 on white). Accent CTA uses white text on light (inverse of dark's dark-text-on-bright-purple, because contrast forces it).
    - **Priority card:** unchanged tokens. Shadow softened ~30% (`0 24px 64px -28px rgba(194,65,12,0.28)`) since warm shadow reads stronger against bright canvas.
    - **Canvas radial glow:** removed in light mode (would read as smudge on near-white).
    - **Status palette:** recomputed for light backgrounds (success `#15803D`/`#DCFCE7`, warning `#92400E`/`#FEF3C7`, danger `#B91C1C`/`#FEE2E2`, info `#1D4ED8`/`#DBEAFE`).
    - **Toggle UX:** top-bar icon button (Lucide Sun/Moon, 44×44, 150ms opacity+rotate swap, transform/opacity only) on every authenticated AND unauthenticated surface; Settings → Appearance segmented radio (`System` / `Light` / `Dark`); first-visit default follows `prefers-color-scheme`; persistence via `localStorage['tractionfi:theme']`. Live `matchMedia` listener when in System mode. Inline blocking `<script>` in `<head>` prevents FOUC.
    - **Anti-pattern explicitly rejected:** no whole-page transition animation on theme switch — only the toggle icon animates. Matches the restraint principle.
  - **Open questions deferred to implementation session:** does the toggle appear on Better Auth `/verify`-style email confirmation pages (likely yes); ENGINE_VERSION footer visual eye-check after `--muted-2` recomputation; wordmark "FI" accent shifts from `#8B7CFF` (dark) to `#6B5BFF` (light) — confirm brand acceptable.
- 2026-05-19 (session G) — **Phase 4 smoke test complete** (this session):
  - **Login redirect bug fixed:** middleware was doing an internal `fetch('/api/auth/get-session')` from Edge runtime which silently returned null on OpenNext/Cloudflare (cookie lost in subrequest). Fix: split auth gate into two layers. `middleware.ts` (Edge) uses `getSessionCookie` from `better-auth/cookies` for cheap cookie-presence check only. New `web/src/app/dashboard/layout.tsx` (Node runtime, server component) does the full `auth.api.getSession()` call + `emailVerified` check.
  - **Why two layers:** Next.js 16's `proxy.ts` (Node runtime middleware) is not yet supported by `@opennextjs/cloudflare` — deploy fails with `ERROR Node.js middleware is not currently supported`. Watch for OpenNext to land this; when it does, the two-layer split can collapse into one.
  - **Logout button** added to `web/src/app/dashboard/page.tsx` (POST `/api/auth/sign-out` → redirect to `/login`).
  - **Smoke tests passed (Steps 4.9 + 4.10):** signup → verify email → login → dashboard ✅; logout → login → dashboard ✅; forgot password → reset email → new password → login ✅; logged-out direct `/dashboard` hit → `/login` ✅; unverified login → `/verify-pending` ✅; cross-browser verify link → marks verified, user logs in manually ✅; garbage token → silently redirects to `/login` (no error UI — acceptable for v1, revisit in Phase 8).
  - **4 middleware tests updated** (`web/tests/middleware.test.ts`); 8 web tests + 56 engine tests pass.
  - Deployed as commit in this session.
- _Older session summaries (A-F) have been archived to NotebookLM._

## In Progress

- **Phase 5 — dashboard rebuild.** Steps 5.1, 5.2, 5.3 complete. Next: Step 5.4 — flesh out each tab component (`paycheck-tab.tsx`, `incomes-tab.tsx`, `expenses-tab.tsx`, `assets-tab.tsx`, `debts-tab.tsx`) replacing the placeholder bodies under `web/src/app/dashboard/_components/`. First real exercise of `updateBlob` + autosave + conflict path end-to-end. Then Step 5.5 — full `RecommendationsTab` (blocked + active states).

## Implemented But Not Deployed

- **Theme toggle + Phase 5.1 shadcn install + Phase 5.2/5.3 dashboard shell** — three commits on `feat/v1-migration` (`04d3896`, `e0c9693`, `43cec86`); not yet deployed. Last deployed commit: `7252759` (Phase 4 smoke fix).

## Implementation Notes

- 2026-05-22 (session N) — **Tailwind v4 drops `cursor: pointer` from button preflight.** In Tailwind v3, buttons automatically got `cursor: pointer`. In v4 (this project uses Tailwind 4), that base style is gone. All `<button>` elements in this project will have `cursor: default` unless you add `cursor-pointer` to their className explicitly. Pattern: `className="cursor-pointer ..."` on every interactive button, `disabled:cursor-not-allowed` on buttons that can be disabled.
- 2026-05-22 (session N) — **`verify-pending` email fallback uses a cancelled-flag pattern.** The useEffect fetches `/api/auth/get-session` only when `?email=` is absent. It sets a `cancelled` boolean and returns a cleanup that sets `cancelled = true`. This prevents a stale setState if the component unmounts before the fetch resolves (e.g. middleware redirect fires first). Use this pattern in any `useEffect` with an async fetch.
- 2026-05-22 (session M) — **ConflictBanner resolution: Option 2 (extend hook) chosen over re-GET.** Departure from session-L's PROJECT-STATUS preference is deliberate. The 409 response already returns `current.blob` AND `current.version` — re-GET would discard the version we already have AND open a race window where a third client's write could land in between, silently changing what the banner committed. Hook surface grew by `conflictVersion: number` field plus `acceptServer()` / `keepMine()` callbacks (~15 lines) — small price for correctness + locality of state transitions. The hook is now the single source of truth for blob/version/status; banner is purely presentational.
- 2026-05-22 (session M) — **`text-brand-foreground` is the CTA text token, not `text-accent-foreground`.** Session K's `--accent → --brand` rename also created a `--brand-foreground` token (dark `#0a0a10`, light `#fdfdfe`). `--accent-foreground` is now correctly shadcn's text-on-neutral-surface token (it resolves to near-black in both themes). Any CTA polarity flip must be applied via `text-brand-foreground`. Verified in the dashboard topbar + landing hero/topbar CTAs.
- 2026-05-22 (session M) — **Old dashboard stub had UTF-8/Latin-1 mojibake** in static strings (`â† back to landing`, `Â·` instead of `·`). Resolved by the 5.3 rewrite — new shell uses proper Unicode literals (`Engine X.Y · Tax year Z`). If reintroducing a header link with a left arrow, prefer `←` (U+2190) over the HTML entity or escape sequence — Next dev server serves the file as UTF-8 and a literal `←` survives. Avoid `←` in JSX text since it'll be passed through unchanged but the source file editor encoding may corrupt it.
- 2026-05-22 (session M) — **Sidebar responsive: `grid-cols-1 lg:grid-cols-[1fr_320px]`.** Below `lg` (1024px) the aside stacks below main with a `border-t`; at `lg+` it sits at x=`100% - 320px` with a `border-l`. Tailwind handles this via `lg:border-t-0 lg:border-l` on the aside. Verified at 665px (stacked) and 1280px (split). Defers any drawer/inline-summary UX to Phase 9.
- 2026-05-22 (session M) — **`/verify-pending` Resend disabled without `?email=` URL param.** Page reads email from `URLSearchParams` in a useEffect; `disabled={!email}` makes Resend look broken if the URL lost the param (back button, stale bookmark). Out-of-scope follow-up spawned to: (1) derive email from `auth.api.getSession()` when missing; (2) add an explicit "log in to retry" affordance instead of silent disable; (3) add `type="button"` defensively. Not blocking Phase 5.
- 2026-05-22 (session L) — **`useEngineState` keeps the pre-conflict version on 409, by spec.** When the PUT returns 409 the hook stores `conflictBlob: current.blob` but leaves `state.version` at the *user's* pre-conflict version (not the server's). _**Session M update:** the hook now ALSO stores `conflictVersion: current.version` and exposes `acceptServer()` / `keepMine()` so ConflictBanner can resolve without a re-GET. Session-L's "re-GET preferred" note is superseded._
- 2026-05-22 (session L) — **`as never` cast on `skippedMilestones`.** Blob's `settings.skippedMilestones` is `string[]` (forward-compat for unknown future milestone IDs); `EvaluateOptions.skippedMilestones` is `MilestoneId[]`. `as never` is the spec-prescribed bridge — keeps the cast explicit at the call site rather than burying it in a wrapper.
- 2026-05-21 (session K) — **shadcn's `--accent` and `--muted` semantics conflict with ours.** shadcn (base-nova preset) treats `--accent` and `--muted` as subtle *background* tokens for hover states. Our pre-shadcn system used `--accent` for the electric purple brand CTA and `--muted` for the gray foreground text color. Forced renames: `--accent → --brand` everywhere, `--muted → --muted-foreground` everywhere. shadcn's `--primary` is now the brand-color slot (mapped to `--brand`); shadcn's `--accent`/`--muted` both map to `--surface-2`. PowerShell regex `(?<!priority-)accent` was used to avoid touching `--priority-accent` (the warm priority card token, which is unrelated). `text-muted(?![\w-])` was used to avoid touching `text-muted-2` or existing `text-muted-foreground`.
- 2026-05-21 (session K) — **shadcn `dark:` variant rewritten for our `[data-theme]` system.** Default shadcn `@custom-variant dark (&:is(.dark *))` doesn't fire in our model (we use `[data-theme="light"]` as an override on the dark default, not a `.dark` class on the body). Rewrote as `&:where(:root:not([data-theme="light"]) *, :root:not([data-theme="light"]))` so shadcn components' `dark:` qualifiers fire when the root is anything except light. shadcn's `.dark { ... }` block (light defaults inverted) was dropped because our `[data-theme="light"]` block already does the inversion.
- 2026-05-21 (session K) — **`tw-animate-css` and `shadcn/tailwind.css` imports kept.** shadcn init added `@import "tw-animate-css"` (provides animation utilities) and `@import "shadcn/tailwind.css"` (provides `@custom-variant data-open/data-closed/data-checked/...` for shadcn components that use `data-*` state attrs). Both packages hoist to repo-root `node_modules`. Keep both imports — required for components to animate correctly.
- 2026-05-21 (session K) — **shadcn stack is base-nova → `@base-ui/react`, not Radix.** Phase 5 plan referenced shadcn defaults; the v4.8 CLI with `--defaults` chose base-nova preset. This means `import { ... } from "@base-ui/react/..."` rather than `@radix-ui/react-*`. Behavior is similar but check `node_modules/@base-ui/react/dist/docs/` if a component behaves unexpectedly. No Radix anywhere in the tree.
- 2026-05-21 (session I) — **Brand SVG was hardcoded to dark-mode colors.** `public/brand/lockup-horizontal.svg` uses `fill="#F5F5FA"` for the wordmark — invisible on light bg. Fix: inline as React component `BrandLockup` using `var(--foreground)` / `var(--accent)`. The static SVG asset is kept as-is (used for OG/social); only the in-app usages (topbar, footer) use the component. If brand asset is updated, `brand-lockup.tsx` must be kept in visual sync.
- 2026-05-21 (session I) — **`useTheme()` uses `useSyncExternalStore`, not `useState` + `useEffect`.** React 19's `react-hooks/set-state-in-effect` rule flags synchronous setState in effects (including the `setMounted(true)` pattern). `useSyncExternalStore` is the canonical React 19 solution: `getServerSnapshot` returns a stable default; `getSnapshot` reads from a module-level store initialized lazily on first client render. The store holds `{ preference, theme, mounted }`. Module-level `clientSnapshot` is null until first `getSnapshot` call. `emit()` notifies subscribers on both explicit preference changes and system-preference changes.
- 2026-05-21 (session I) — **`--accent-foreground` token introduced.** Dark: `var(--background)` (dark text on bright purple — existing behavior). Light: `#fdfdfe` (white text on `#6B5BFF` = 4.8:1 AA). Registered in `@theme inline` as `--color-accent-foreground`. All `bg-accent text-background` occurrences should use `text-accent-foreground` going forward.
- _Historical implementation notes (Phases 1-4) have been archived to NotebookLM._

## Open Items

- [x] **Phase 0** — scaffolding committed to `main`, `feat/v1-migration` branch active.
- [x] **Phase 1** — engine 0.2.0 with structured `Blocker[]` (commit `a5ed389`).
- [x] **Phase 2** — Cloudflare Workers + D1 wired. Single `tractionfi` DB. OpenNext adapter. Initial migration applied (commits `c998548`, `c9a9947`).
- [x] **Phase 3** — query layer + user_state GET/PUT API + blob migrator (commit `e80f5bb`). 56 engine + 4 web tests; clean typechecks.
- [x] **Phase 4** — complete. All auth flows smoke-tested. Login redirect bug fixed (middleware split). Logout button added. 8 web + 56 engine tests pass.
- [x] **Theme toggle + light palette** — committed `04d3896` (session K). Smoke-tested in session J. Not yet deployed.
  - [x] Manual browser smoke (7-step checklist — passed session J)
  - [x] Commit on `feat/v1-migration` (committed as-is; auth-page brand presence deferred to Phase 9)
  - [ ] Settings → Appearance segmented radio (deferred to Phase 7)
- [ ] **Phase 5 — dashboard rebuild** (in progress).
  - [x] Step 5.1 — install shadcn/ui + reconcile token system (commit `e0c9693`).
  - [x] Step 5.2 — `useEngineState` hook (`web/src/lib/use-engine-state.ts`). Committed as part of `43cec86`.
  - [x] Pre-5.3 test pass — static gates + visual smoke + auth/persistence regression + decision-locking, all green (session M).
  - [x] Step 5.3 — dashboard shell (commit `43cec86`).
  - [ ] Step 5.4 — per-tab components (replace placeholders in `web/src/app/dashboard/_components/`).
  - [ ] Step 5.5 — `RecommendationsTab` (blocked + active states).
- [x] **`/verify-pending` UX polish** — email session fallback, signed-out affordance, cursor fix, "Already verified?" modal. Completed session N.
- [ ] **Phases 6–7** — landing/settings, observability.
- [ ] **Phase 8** — E2E verification (14-step manual checklist).
- [ ] **Phase 9** — `/ui-ux-pro-max` design system pass.
- [ ] **Phase 10–11** — production cutover + cleanup of v0 Worker + KV `USER_DATA`.
- [ ] **Spec drift:** design spec §2.5 still lists `BlockerTab` as 4-member union (includes `'incomes'`); code is now 3-member. Reconcile in Phase 12 cleanup.
- [ ] **Verify Workers Alerts thresholding** on Workers tier (Phase 7 step 7.5 — Axiom free tier is fallback).
