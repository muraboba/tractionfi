# Product

## Register

product

## Users

US adults aged 22–45 who earn income, have some debt and/or savings, and want
clarity on financial priorities. Web-fluent, not necessarily financially
literate. Often arrive on mobile. Most are in a quiet, decision-making mood —
not in an emergency, but stuck on "should I pay down debt or save?"

Secondary audience: financial-literacy educators and personal-finance content
creators looking for a tool to point their audience to.

## Product Purpose

Translate the US Personal Income Spending Flowchart from a static image into a
live, personalized recommendation engine. The user fills in their finances
across organized tabs; the engine returns the single most important next
action plus a roadmap of subsequent phases.

Success = the user opens the app, sees one clear thing to do this month, and
trusts the reasoning behind it enough to act.

## Brand Personality

Calm authority. The tone of a competent friend who happens to know personal
finance — not a brokerage, not a fintech startup performing trust, not a
gamified budgeting coach.

Three words: **precise, restrained, decisive.**

## Anti-references

- **Mint / Monarch / YNAB** — transaction-tracker aesthetics with charts
  everywhere. We do not look like a PFM.
- **Coinbase / Robinhood** — gamified, animated, urgency-driven.
- **Wise / Cash App** — consumer-friendly but visually loud, illustration-heavy.
- **Traditional brokerage UIs (Schwab, Fidelity)** — overloaded, distrustful-
  looking density.
- Any "trust signal" cliché: stock photos of diverse people pointing at
  laptops, green checkmarks everywhere, "FDIC insured" badges as decoration.

## Design Principles

1. **One decision, surfaced calmly.** The engine returns a single
   `currentPriority`. The UI must never present three competing CTAs or weight
   the full roadmap equally with "what to do now."
2. **Warm decisions on a quiet workspace.** The shell of the product is a deep
   near-black; the recommendation card is the only warm, light surface. The
   user's decision glows, not the chrome. (This contract holds in light mode
   too: the priority card remains cream and does not invert.)
3. **Precise, not playful.** Tabular numerals on every currency value. Tight
   letter-spacing on headings. No illustrations, no mascots, no celebration
   animations on milestone completion.
4. **Restraint over decoration.** A faint radial glow is the most decorative
   element in the system. Flat surfaces, subtle borders, no glassmorphism or
   gradients on cards.
5. **Explain the why.** Every recommendation links to a short explainer
   (avalanche vs snowball, Roth vs Traditional). Users come away more
   financially literate, not just more obedient.

## Accessibility & Inclusion

- **WCAG 2.1 AA** baseline. Priority card achieves AAA on body and title;
  dark-canvas body achieves AAA; muted-2 (#7A7A90) is the AA floor at 18px+.
- **Color is never the only signal** — status badges have rings + icons; the
  active milestone has both a ring and a filled numbered badge.
- **Keyboard navigable** end-to-end, visible focus rings on every interactive
  element.
- **Reduced motion respected** — no animation on the canvas glow by default;
  honor `prefers-reduced-motion` on any future transitions.
- **Mobile touch targets ≥ 44pt × 44pt**, body text ≥ 16px to avoid iOS
  auto-zoom.
- **Screen-reader friendly** form labels (never placeholder-as-label).
