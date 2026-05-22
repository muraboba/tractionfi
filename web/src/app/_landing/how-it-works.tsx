import { ListOrdered, PencilLine, Target } from "./icons";
import type { ComponentType, SVGProps } from "react";

type Step = {
  n: string;
  eyebrow: string;
  title: string;
  body: string;
  Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
};

const STEPS: Step[] = [
  {
    n: "01",
    eyebrow: "You",
    title: "Tell us about your money.",
    body: "Income, recurring expenses, savings accounts, debts. Five inputs is usually enough to start.",
    Icon: PencilLine,
  },
  {
    n: "02",
    eyebrow: "The engine",
    title: "We rank every move you could make.",
    body: "The eight-phase framework runs against your numbers. 401(k) match, debt payoff, emergency fund, retirement, every move is scored.",
    Icon: ListOrdered,
  },
  {
    n: "03",
    eyebrow: "Today",
    title: "One priority. Surfaced.",
    body: "The single highest-leverage move with your next dollar shows up on a warm-cream card. Nothing else competes for your attention.",
    Icon: Target,
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="border-t border-border py-24">
      <div className="mx-auto max-w-[1024px] px-6">
        <div className="mb-16 max-w-[640px]">
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            How it works
          </div>
          <h2
            className="mt-4 font-semibold tracking-[-0.02em] text-balance"
            style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
          >
            Three small inputs.
            <br />
            <span className="text-muted">One decisive answer.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <StepCard key={s.n} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ n, eyebrow, title, body, Icon }: Step) {
  return (
    <article className="group relative flex min-h-[260px] flex-col rounded-lg border border-border bg-surface px-6 py-7 transition-colors hover:border-border-strong hover:bg-surface-2">
      <div className="mb-8 flex items-center justify-between">
        <span className="font-mono text-xs tracking-[0.06em] text-muted-2">{n}</span>
        <Icon size={18} className="text-accent" />
      </div>
      <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-2">{eyebrow}</div>
      <h3 className="mt-2.5 text-[20px] font-semibold leading-[1.25] tracking-[-0.01em] text-foreground">
        {title}
      </h3>
      <p className="mt-2.5 text-sm leading-[1.55] text-muted">{body}</p>
    </article>
  );
}
