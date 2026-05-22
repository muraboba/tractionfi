"use client";

import { useMemo, useState, type ChangeEvent } from "react";

type DemoResult = {
  phase: number;
  title: string;
  desc: string;
  why: string;
};

function fmtMoney(n: number) {
  return `$${n.toLocaleString()}`;
}

export default function Demo() {
  const [income, setIncome] = useState(5800);
  const [expenses, setExpenses] = useState(3400);
  const [ef, setEf] = useState(0);
  const [ccDebt, setCcDebt] = useState(0);
  const [matchCaptured, setMatchCaptured] = useState(false);

  const result = useMemo<DemoResult>(() => {
    const surplus = income - expenses;
    if (surplus <= 0) {
      return {
        phase: 1,
        title: "Get to a positive monthly surplus first",
        desc: "Right now expenses exceed income. Trim recurring spending or grow income until there's at least some surplus to deploy.",
        why: "The engine can't allocate dollars that don't exist. Cash flow comes before any phase.",
      };
    }
    if (ef < 1000) {
      return {
        phase: 2,
        title: "Build a $1,000 starter emergency fund",
        desc: "Park a thousand dollars in a separate high-yield savings account. This is the buffer that stops a flat tire from becoming a credit-card balance.",
        why: `You have ${fmtMoney(ef)} in designated emergency cash. A starter buffer comes before debt paydown because it prevents new debt from forming.`,
      };
    }
    if (!matchCaptured) {
      return {
        phase: 3,
        title: "Capture your full 401(k) employer match",
        desc: "Increase your 401(k) contribution to at least your full match. A 100% return on contribution is the highest-leverage move in any portfolio.",
        why: "You're not capturing the full employer match. Those dollars don't recur, they're left behind every paycheck you skip.",
      };
    }
    if (ccDebt > 0) {
      return {
        phase: 4,
        title: "Pay off your credit-card balance",
        desc: "Direct any remaining slack in your budget toward the highest-APR debt first. A 19% APR is a guaranteed-return investment you can't beat.",
        why: `You're carrying ${fmtMoney(ccDebt)} on a card. High-interest debt ranks above further investing until cleared.`,
      };
    }
    if (ef < expenses * 3) {
      return {
        phase: 5,
        title: "Grow your emergency fund to 3 to 6 months of expenses",
        desc: "Now that high-interest debt is gone, top up the buffer. This is the cushion that lets you negotiate from strength.",
        why: `Essential monthly spend is ${fmtMoney(expenses)}. You hold ${fmtMoney(ef)}, about ${(ef / expenses).toFixed(1)} months of runway.`,
      };
    }
    return {
      phase: 7,
      title: "Aim for 15% of gross income toward retirement",
      desc: "High-interest debt is gone and the emergency fund is full. The next leverage is retirement contributions, Roth IRA, then traditional, then back-door.",
      why: "All earlier phases are complete. Time-in-market is the dominant variable from here on.",
    };
  }, [income, expenses, ef, ccDebt, matchCaptured]);

  return (
    <section id="demo" className="border-t border-border py-24">
      <div className="mx-auto max-w-[1024px] px-6">
        <div className="mb-12 max-w-[640px]">
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Try it</div>
          <h2
            className="mt-4 font-semibold tracking-[-0.02em] text-balance"
            style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
          >
            Move the dials.
            <br />
            <span className="text-muted-foreground">Watch the priority change.</span>
          </h2>
          <p className="mt-4 max-w-[55ch] text-[16px] leading-[1.6] text-muted-foreground">
            Five inputs, eight phases, one answer. The card on the right updates in real time as
            you adjust the numbers, same engine that runs the full dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-7">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-2">
              Your inputs
            </div>
            <div className="mt-6 grid gap-5">
              <Slider
                label="Monthly take-home income"
                value={income}
                onChange={setIncome}
                min={0}
                max={15000}
                step={100}
              />
              <Slider
                label="Essential monthly expenses"
                value={expenses}
                onChange={setExpenses}
                min={0}
                max={10000}
                step={100}
              />
              <Slider
                label="Emergency fund balance"
                value={ef}
                onChange={setEf}
                min={0}
                max={30000}
                step={250}
              />
              <Slider
                label="Credit-card balance"
                value={ccDebt}
                onChange={setCcDebt}
                min={0}
                max={20000}
                step={100}
              />
              <Toggle
                label="Capturing full 401(k) employer match"
                value={matchCaptured}
                onChange={setMatchCaptured}
              />
            </div>
          </div>

          <DemoResultCard result={result} />
        </div>
      </div>
    </section>
  );
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-[13px] text-muted-foreground">{label}</label>
        <span className="text-[15px] font-medium tabular-nums text-foreground">
          {fmtMoney(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
        className="demo-slider w-full appearance-none rounded-full outline-none"
        style={{
          height: "4px",
          background: `linear-gradient(to right, var(--brand) 0%, var(--brand) ${pct}%, var(--surface-2) ${pct}%, var(--surface-2) 100%)`,
        }}
      />
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-[26px] w-11 rounded-full border p-0 transition-colors ${
          value ? "border-brand bg-brand" : "border-border bg-surface-2"
        }`}
      >
        <span
          className="absolute top-0.5 h-[18px] w-[18px] rounded-full transition-[left]"
          style={{
            left: value ? "20px" : "2px",
            background: value ? "var(--background)" : "var(--muted-foreground)",
          }}
        />
      </button>
    </label>
  );
}

function DemoResultCard({ result }: { result: DemoResult }) {
  return (
    <div className="lg:sticky lg:top-24">
      <div className="mb-3 flex items-center gap-2 font-mono text-[11px] tracking-[0.04em] text-muted-2">
        <span>engine.decide(inputs)</span>
        <span className="h-px flex-1 bg-border" />
        <span className="text-brand">â†’ phase {String(result.phase).padStart(2, "0")}</span>
      </div>

      <article
        key={result.title}
        className="rounded-2xl bg-priority-bg p-8 shadow-[var(--priority-shadow)] outline outline-1 outline-[rgba(194,65,12,0.15)] -outline-offset-1"
      >
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-priority-accent">
          Your next step
        </div>
        <h3
          className="mt-2.5 font-semibold tracking-[-0.02em] text-balance text-priority-fg"
          style={{ fontSize: "26px", lineHeight: 1.15 }}
        >
          {result.title}
        </h3>
        <p className="mt-3 text-[15px] leading-[1.55] text-priority-fg/85">{result.desc}</p>

        <div
          className="mt-5 rounded-lg px-4 py-3.5 text-sm leading-[1.5] text-priority-muted"
          style={{ background: "rgba(194,65,12,0.06)" }}
        >
          <strong className="font-semibold text-priority-fg">Why: </strong>
          {result.why}
        </div>
      </article>
    </div>
  );
}
