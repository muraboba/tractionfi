"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "./data";
import { Minus, Plus } from "./icons";

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="border-t border-border py-24">
      <div className="mx-auto grid max-w-[1024px] grid-cols-1 items-start gap-12 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-16">
        <div className="lg:sticky lg:top-24">
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted">FAQ</div>
          <h2
            className="mt-4 font-semibold tracking-[-0.02em] text-balance"
            style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.1 }}
          >
            Sensible questions,
            <br />
            <span className="text-muted">straight answers.</span>
          </h2>
          <p className="mt-5 max-w-[44ch] text-[15px] leading-[1.6] text-muted">
            If something here doesn&apos;t answer what you&apos;re actually asking, email{" "}
            <span className="text-foreground">hello@tractionfi.app</span>.
          </p>
        </div>

        <ul className="grid list-none gap-2 p-0">
          {FAQ_ITEMS.map((item, i) => (
            <FAQRow
              key={item.q}
              q={item.q}
              a={item.a}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? -1 : i)}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function FAQRow({
  q,
  a,
  isOpen,
  onToggle,
}: {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="overflow-hidden rounded-lg border border-border bg-surface transition-colors">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex min-h-[60px] w-full items-center justify-between gap-4 border-0 bg-transparent px-6 py-5 text-left text-base font-medium tracking-[-0.01em] text-foreground"
      >
        <span>{q}</span>
        {isOpen ? (
          <Minus size={18} className="shrink-0 text-muted" />
        ) : (
          <Plus size={18} className="shrink-0 text-muted" />
        )}
      </button>
      <div
        className="overflow-hidden transition-[max-height,opacity] duration-200 ease-out"
        style={{ maxHeight: isOpen ? "400px" : "0px", opacity: isOpen ? 1 : 0 }}
      >
        <div className="max-w-[65ch] px-6 pb-[22px] text-[15px] leading-[1.6] text-muted">{a}</div>
      </div>
    </li>
  );
}
