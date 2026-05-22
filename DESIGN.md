# TractionFI Design System

> Personal finance decision engine. Tells users the **single most important next step** for their money based on the US Personal Income Spending Flowchart. Web-first, designed to translate cleanly to native iOS/Android.

---

## 1. Visual Theme & Atmosphere

**Mood:** Calm authority. The opposite of an anxious spreadsheet or a gamified budgeting app. Reads as a tool a competent friend built, not a brokerage or a fintech startup chasing trust signals.

**Design philosophy:**
- **Dark canvas, warm decisions.** The shell of the product is a deep near-black; the actual recommendation (what to do with your money this month) flips to a warm cream surface. The user's *decision* is the only thing that glows brightly. Everything else is a quiet workspace.
- **One thing at a time.** The engine returns a single `currentPriority`. The UI must respect that — never present three competing CTAs, never show the full roadmap with equal visual weight to "what to do now."
- **Precise, not playful.** Tight letter-spacing on headings. Tabular figures on currency. No illustrations, no mascots, no celebration animations on milestone completion.
- **Restraint over decoration.** A faint radial glow on the canvas is the most decorative element in the entire system. No gradients on cards, no blur effects, no glassmorphism. Surfaces are flat with subtle borders.

**Density:** Medium-low. Generous whitespace around the priority card; tighter rhythm in metric grids and roadmap rows.

**Reference brands:** Linear (restraint, purple accent), Superhuman (premium dark), Notion (warm cream surface accent). Specifically *not* Mint, Monarch, Wise, or Coinbase — TractionFI does not look like a PFM app.

---

## 2. Color Palette & Roles

### Canvas (dark, primary)

| Token | Hex | Role |
|---|---|---|
| `--background` | `#0A0A10` | Page background. Near-black with a faint blue-purple undertone. |
| `--surface` | `#13131C` | Cards, metric tiles, milestone rows. One step elevated. |
| `--surface-2` | `#1C1C28` | Hover/active states, nested surfaces, inline badges. |
| `--border` | `#262633` | Default border on cards, dividers. |
| `--border-strong` | `#32323F` | Hover-state borders, emphasized dividers. |

### Foreground (text on dark)

| Token | Hex | Contrast on `--background` | Role |
|---|---|---|---|
| `--foreground` | `#EDEDF2` | 17.2:1 (AAA) | Primary text, headings, key numbers. |
| `--muted` | `#8A8AA0` | 7.1:1 (AAA) | Secondary text, labels, helper copy. |
| `--muted-2` | `#7A7A90` | 5.0:1 (AA) | Disclaimers, captions. **Never use below this hex on the dark canvas — anything lighter than #7A7A90 fails AA.** |

### Accent (electric purple)

| Token | Hex | Role |
|---|---|---|
| `--accent` | `#8B7CFF` | Primary CTAs, active states, the "FI" in the wordmark, link hover. |
| `--accent-hover` | `#A195FF` | CTA hover state. |
| `--accent-dim` | `#5D4DCC` | Pressed/active state on accent buttons. |
| `--accent-glow` | `rgba(139, 124, 255, 0.18)` | Soft glow under accent CTAs and on the canvas radial wash. Decorative only. |

CTA contrast: `--background` (#0A0A10) text on `--accent` (#8B7CFF) = **6.5:1 (AA)**. Do not put white text on the accent button — it fails contrast.

### Priority surface (the visual hero — warm cream)

The "Your next step" card is the *only* light surface in the product. It is what the user opens the app to see. It must feel like a printed card on a desk — calm, warm, important.

| Token | Hex | Contrast on `--priority-bg` | Role |
|---|---|---|---|
| `--priority-bg` | `#FDF4E3` | — | Card background. Warm cream, not white. |
| `--priority-fg` | `#2A1A05` | 14.8:1 (AAA) | Title and body copy on the card. |
| `--priority-muted` | `#6B4A1F` | 6.5:1 (AAA) | Supporting copy ("Why:" rationale text). |
| `--priority-accent` | `#C2410C` | 4.7:1 (AA) | Section eyebrow ("YOUR NEXT STEP"), inline emphasis, in-card CTAs. |

### Status palette (tuned for dark)

| Status | FG | BG | Use |
|---|---|---|---|
| Success | `#6EE7A7` | `#0F2A1C` | Completed milestones, positive cash flow. |
| Warning | `#FBBF24` | `#2A1F08` | Active/current focus, skipped milestones. |
| Danger | `#FCA5A5` | `#2A1010` | Blockers, negative cash flow, destructive actions. |
| Info | `#93C5FD` | `#0C1E36` | Informational toasts, neutral badges. |

All status badges use a 1px `ring-1` outline at 20% opacity of the FG color for visual separation from surfaces.

### Light mode

**Not provided in v1.** The product is dark-canvas-only. If light mode is added later, the priority card remains cream — it does not invert. The accent purple may shift to `#6B5BFF` (darker for AA contrast on white surfaces).

---

## 3. Typography Rules

### Font families

| Role | Family | Weight | Why |
|---|---|---|---|
| Sans (UI, body) | **Geist Sans** (Google Fonts) | 400, 500, 600 | Tight, technical, modern. Pairs with the precision-focused tone. |
| Mono (data, code) | **Geist Mono** | 400, 500 | Optional, for engine version strings, debug surfaces. |

Single-family system. No serif pairing in v1. (Optional v1.5: Instrument Serif for editorial pages only — about, philosophy, blog. Never inside the product.)

### Type scale

| Token | Size / Line | Weight | Letter-spacing | Use |
|---|---|---|---|---|
| `text-display` | 60px / 1.05 | 600 | `-0.025em` | Landing H1 only. |
| `text-h1` | 36px / 1.1 | 600 | `-0.02em` | Page titles. |
| `text-h2` | 28px / 1.2 | 600 | `-0.02em` | Section heads, priority card title. |
| `text-h3` | 20px / 1.3 | 600 | `-0.01em` | Card titles, milestone row titles. |
| `text-body` | 16px / 1.6 | 400 | `0` | Default body copy. |
| `text-body-lg` | 18px / 1.6 | 400 | `0` | Priority card body, hero descriptions. |
| `text-sm` | 14px / 1.5 | 400 | `0` | Secondary copy, labels, helper text. |
| `text-xs` | 12px / 1.4 | 500 | `0.05em` (uppercase) | Eyebrows, status badges, metric labels. |

### Rules

- **Currency and numeric values must use `font-variant-numeric: tabular-nums`** (Tailwind: `tabular-nums`). Non-negotiable — currency layout shift is the most common amateur-tell in finance UIs.
- **Eyebrows are uppercase + tracked +0.2em** (e.g. "YOUR NEXT STEP"). Apply at `text-xs` only.
- **Headings use negative letter-spacing.** Body text uses default.
- **Never set body text below 16px** on mobile (iOS auto-zoom trigger).
- **Line-length cap: 65ch on desktop, full-width on mobile.** Apply via `max-w-prose` or explicit `max-w-[65ch]` on long-form copy blocks.

---

## 4. Component Stylings

### Buttons

**Primary CTA** (used once per screen):
```
bg: --accent (#8B7CFF)
text: --background (#0A0A10)
padding: 12px 24px (py-3 px-6)
radius: rounded-lg (8px)
min-height: 44px
shadow: 0 0 24px var(--accent-glow)
hover: bg --accent-hover
focus-visible: outline 2px --accent, offset 2px
disabled: opacity 0.5, cursor not-allowed
```

**Secondary button** (back, log out, "show me how"):
```
bg: --surface
text: --foreground
border: 1px solid --border
padding: 10px 16px (py-2.5 px-4)
radius: rounded-lg (8px)
min-height: 44px
hover: border --border-strong, bg --surface-2
focus-visible: outline 2px --accent, offset 2px
```

**Ghost link** (inline, "back to landing"):
```
text: --muted, underlined on hover
hover: text --accent + text-decoration underline (color-not-only)
no padding constraint, but ensure 44pt tap area if standalone on mobile
```

**Loading state** (all buttons): show inline spinner (12px) + replace label text with action verb in progressive tense ("Signing out…", "Saving…"). Disable button. Required for any async action exceeding 200ms.

### Cards

**Standard metric card:**
```
bg: --surface
border: 1px solid --border
radius: rounded-lg (8px)
padding: 16px (p-4)
hover: border --border-strong (no scale, no shadow)
content: eyebrow label (--muted, uppercase 12px) + value (foreground, 24px semibold, tabular-nums)
```

**Priority card (hero):**
```
bg: --priority-bg (#FDF4E3)
radius: rounded-2xl (16px)
padding: 32px (p-8)
shadow: 0 30px 80px -30px rgba(194, 65, 12, 0.4)
ring: 1px --priority-accent at 15% opacity
content:
  - eyebrow: "YOUR NEXT STEP" in --priority-accent, 12px, +0.2em tracking
  - title: 32px semibold, --priority-fg, -0.02em tracking
  - body: 16-18px regular, --priority-fg at 90% opacity
  - rationale: "Why:" prefix in semibold --priority-fg, body in --priority-muted
  - CTA (optional but recommended): inline button in --priority-accent bg with cream text
```

**Milestone row (active state):**
```
border: 1px solid --accent at 40% opacity
ring: 0 0 0 1px var(--accent-glow)
numbered badge: bg --accent, text --background, 28px circle
```

**Milestone row (default state):**
```
bg: --surface
border: 1px solid --border
radius: rounded-lg (8px)
padding: 16px (p-4)
numbered badge: bg --surface-2, text --muted, 28px circle
```

### Inputs

```
bg: --surface
border: 1px solid --border
text: --foreground
placeholder: --muted-2 (#7A7A90, AA-safe)
radius: rounded-lg (8px)
min-height: 44px
padding: 10px 12px
focus: border --accent, ring 3px --accent-glow
error: border --danger-fg, ring 3px --danger-fg at 20%
label: --muted, 14px, 500 weight, positioned above input (never placeholder-only)
helper: --muted, 13px, positioned below input
error message: --danger-fg, 13px, below input, prefixed with caution icon
```

### Status badges

```
inline-flex, rounded-full, px-2 py-0.5
text-xs (12px) font-medium
ring-1 ring-inset using status FG at 20% opacity
bg: status BG token
text: status FG token
```

### Navigation (when added)

- **Web desktop:** Top bar, left-aligned wordmark, right-aligned auth/account menu. No left sidebar in v1.
- **Web mobile / native mobile:** Bottom tab bar, max 4 tabs. Default tabs: Home (priority view), Roadmap, Inputs, Settings. Active state uses `--accent` indicator + filled icon variant. Inactive uses `--muted` + outline icon variant.
- **Tab labels are always shown alongside icons.** Icon-only nav is forbidden — discoverability outweighs minimalism for a finance product.

---

## 5. Layout Principles

### Spacing scale

Use 4px increments. Tailwind's default scale is correct. Allowed values:

```
4, 8, 12, 16, 24, 32, 48, 64, 96
```

No arbitrary values like `13px` or `21px`. If a layout needs a non-scale value, the layout is wrong.

**Vertical rhythm tiers:**
- Within a card: 8–16px
- Between cards in a section: 16px
- Between sections: 40–48px (`mt-10` to `mt-12`)
- Above page footer: 64px (`mt-16`)

### Grid

- **Container max-width:** `max-w-5xl` (1024px) for product surfaces. `max-w-2xl` (672px) for landing copy. `max-w-prose` for long-form text.
- **Page horizontal padding:** `px-6` (24px) on mobile, `px-8` on desktop. Never edge-to-edge on tablet+.
- **Metric grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` with `gap-4`. Three-column at small breakpoints is forbidden (currency values truncate).

### Border-radius scale

**Locked to two tiers:**
- `rounded-lg` (8px) — all controls, inputs, standard cards, badges (rounded-full overrides).
- `rounded-2xl` (16px) — hero surfaces only (priority card, modals, primary CTAs over 200px wide).

Forbidden: `rounded-md`, `rounded-xl`, arbitrary radii. Cleanup any in-betweens.

### Whitespace philosophy

The priority card is surrounded by at least 40px of vertical breathing room on every side. It is the *only* element with this treatment. Everything else sits in a tighter rhythm so the priority card visually dominates by isolation as much as by color.

---

## 6. Depth & Elevation

Minimal elevation system. Three tiers only.

| Tier | Use | Treatment |
|---|---|---|
| **0 — Canvas** | Page background | `--background` flat. Optional decorative radial gradient at 18% opacity, fixed attachment. |
| **1 — Surface** | Cards, metric tiles, milestone rows | `--surface` + `--border`. No shadow. Border-strong on hover. |
| **2 — Hero / Floating** | Priority card, modals, popovers | Soft warm shadow: `0 30px 80px -30px rgba(194, 65, 12, 0.4)` for priority; `0 24px 64px -16px rgba(0,0,0,0.6)` for dark modals. |

**Forbidden:**
- Multi-layered drop shadows (Material elevation 3+ style).
- Inner shadows for "pressed" states (use color shift instead).
- Glassmorphism / backdrop-blur (except in modal scrims).

**Modal scrims:** `rgba(10, 10, 16, 0.7)` with `backdrop-blur-sm`. Strong enough to isolate foreground.

**Decorative canvas glow** (the one exception to the no-decoration rule):
```css
background-image:
  radial-gradient(1200px 600px at 80% -10%, var(--accent-glow), transparent 60%),
  radial-gradient(900px 500px at -10% 110%, rgba(94, 77, 204, 0.10), transparent 60%);
background-attachment: fixed;
```
Apply to `body` only. Static, not animated. Respects `prefers-reduced-motion` by default (no motion).

---

## 7. Do's and Don'ts

### Do

- ✅ Treat the priority card as the visual hero. It is the product.
- ✅ Use `tabular-nums` on every currency or numeric value.
- ✅ Pair color with shape, icon, or text — never rely on color alone for meaning (status badges have rings, active milestone has both ring + filled badge).
- ✅ Maintain a single primary CTA per screen.
- ✅ Use semantic tokens (`--accent`, `--priority-bg`) in components, not raw hex.
- ✅ Test contrast in dark mode against `--background`, not against an assumed gray.
- ✅ Lock corner radius to `rounded-lg` and `rounded-2xl`.
- ✅ Provide visible focus rings on every interactive element.
- ✅ Show loading state on any async button after 200ms.

### Don't

- ❌ Don't add gradients to cards. The accent CTA glow is the only gradient effect.
- ❌ Don't use `--muted-2` for anything that must be readable (fails to AA on text smaller than 18px).
- ❌ Don't put white text on the `--accent` button — fails contrast. Use `--background` text.
- ❌ Don't invert the priority card to a dark variant. The warmth is the whole point.
- ❌ Don't add celebration animations on milestone completion. The product is sober, not gamified.
- ❌ Don't use emojis as icons. Use Lucide or Heroicons (outline variant).
- ❌ Don't use placeholder text as a label substitute.
- ❌ Don't show three milestones with equal weight when only one is `active`.
- ❌ Don't use icon-only navigation. Labels are required.
- ❌ Don't introduce a third radius tier. Two is the contract.
- ❌ Don't animate `width`/`height`/`top`/`left`. Transform and opacity only.

---

## 8. Responsive Behavior

### Breakpoints (Tailwind defaults)

| Name | Min width | Target |
|---|---|---|
| (default) | 0 | Mobile portrait |
| `sm` | 640px | Mobile landscape, small tablet |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape, small desktop |
| `xl` | 1280px | Desktop |

### Layout collapsing strategy

- **Landing page:** Single column, center-aligned, all viewport widths. Type scale down: `text-5xl sm:text-6xl` on H1.
- **Dashboard metric grid:** 1 column < 640px, 2 columns 640–1024px, 3 columns ≥ 1024px.
- **Priority card:** Always full-width within the container. Padding scales from `p-6` mobile to `p-8` desktop.
- **Roadmap milestones:** Always vertical stack. Numbered badge + content row never wraps to two lines.
- **Top bar:** Wordmark left, account menu right at all breakpoints. No hamburger menu in v1 (top bar is light enough to stay flat on mobile).

### Touch targets

- **All interactive elements ≥ 44pt × 44pt** (iOS standard, exceeds Material 48dp on the smaller dimension is acceptable but prefer 48dp where possible).
- Buttons: `min-height: 44px`. Use `py-2.5` minimum, never `py-2` for primary or secondary buttons.
- Icon-only buttons must have explicit `width: 44px; height: 44px` (use Tailwind `h-11 w-11`).
- Tap targets must be separated by ≥ 8px gaps.

### Safe areas (mobile / native)

- Top: respect status bar / notch. Bottom: respect home indicator. Use `env(safe-area-inset-*)`.
- Bottom CTA bars: padding-bottom = `max(16px, env(safe-area-inset-bottom))`.
- Fixed elements (toasts, modals) must never collide with system gesture areas.

### Native mobile translation

This system maps cleanly to React Native / SwiftUI:
- Canvas dark → black background with subtle gradient overlay.
- Priority card → home tab's "Today" card. The full-screen hero of the app.
- Metric tiles → horizontal scroll snap on mobile (optional v1.5), 2-column grid in v1.
- Bottom tab bar replaces top nav at native target.
- All radii, spacing, and tokens transfer 1:1.

---

## 9. Agent Prompt Guide

### Quick color reference (copy-paste)

**Dark canvas system:**
```
Background:       #0A0A10
Surface:          #13131C
Surface 2:        #1C1C28
Border:           #262633
Border strong:    #32323F
Foreground:       #EDEDF2
Muted:            #8A8AA0
Muted 2:          #7A7A90 (AA floor on dark)
```

**Accent (electric purple):**
```
Accent:           #8B7CFF
Accent hover:     #A195FF
Accent dim:       #5D4DCC
Accent glow:      rgba(139, 124, 255, 0.18)
```

**Priority surface (warm cream — the hero):**
```
Priority bg:      #FDF4E3
Priority fg:      #2A1A05
Priority muted:   #6B4A1F
Priority accent:  #C2410C
```

**Status:**
```
Success: #6EE7A7 on #0F2A1C
Warning: #FBBF24 on #2A1F08
Danger:  #FCA5A5 on #2A1010
Info:    #93C5FD on #0C1E36
```

### Ready-to-use agent prompts

**Build a landing page:**
> Build a single-column landing page using TractionFI's design system. Dark canvas background (#0A0A10) with the subtle radial gradient glow defined in Section 6. Center a small "Personal finance, decided" pill at the top using `--surface` background with a glowing purple dot. Wordmark "Traction**FI**" with FI in `--accent` (#8B7CFF), 60px display weight. Single primary CTA "See a sample dashboard" using the accent button spec from Section 4. Footer disclaimer in `--muted-2` (12px). No images, no illustrations.

**Build the dashboard:**
> Build a dashboard at `max-w-5xl` with: (1) Header with back-link, page title, account menu button. (2) A 6-tile metric grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) showing income/expenses/cashflow/net worth/emergency fund/annual gross. All numeric values use `tabular-nums`. (3) The Priority Card — the visual hero — using the `--priority-bg` cream surface spec from Section 4. Includes an eyebrow "YOUR NEXT STEP", a 32px title, a body description, and a "Why:" rationale block. (4) A vertical roadmap of numbered milestone rows. The active milestone uses the active-state spec (purple ring, filled badge); others use the default-state spec. Each row includes a status badge from Section 4.

**Build the input form (paycheck tab):**
> Build a form section for paycheck entry. Use the input spec from Section 4. Each field has a visible label above it, helper text below, and uses `tabular-nums` for currency fields. Group fields in a `--surface` card with `rounded-lg` and 24px padding. Submit button uses the primary CTA spec with loading state. On error, show error message below the offending field in `--danger-fg`.

**Build an empty state / blocker:**
> When the engine returns blockers, render a warning section using `--danger-bg` background with a 1px `--danger-fg` border at 20% opacity. Title in `--danger-fg`, bullet list of blocker messages in `--danger-fg` at 90% opacity. Each bullet should be a clickable deep link to the relevant input tab.

**Mobile / native translation:**
> Translate this design to React Native. Bottom tab bar with 4 tabs (Home, Roadmap, Inputs, Settings) replacing the top nav. The Home tab is the Priority Card, fullscreen with safe-area padding. Metric tiles become a 2-column grid below the priority card. All tokens transfer as-is — same hex values, same radii, same spacing scale. Use Geist Sans via expo-font.

### Anti-prompts (things to push back on)

- "Add a celebration animation when a milestone completes" → No. Sober, not gamified.
- "Make the CTA brighter / bigger / pulse" → No. The priority card is the hero; the CTA is supporting.
- "Use a green accent for trustworthiness" → No. That's the PFM cliché we're explicitly avoiding.
- "Add a third radius option" → No. Two tiers, locked.
- "Use emoji icons" → No. Lucide outline only.

---

## File pointer

Reference implementation lives in:
- Tokens: `web/src/app/globals.css`
- Landing: `web/src/app/page.tsx`
- Dashboard: `web/src/app/dashboard/page.tsx`

Engine version stamped on every output: see `engine/src/index.ts` `ENGINE_VERSION`.
