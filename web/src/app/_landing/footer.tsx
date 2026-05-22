import { BrandLockup } from "@/components/brand-lockup";
import { ArrowRight } from "./icons";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border px-0 pb-12 pt-16">
      <div className="mx-auto max-w-[1024px] px-6">
        <div className="mb-16 grid grid-cols-1 items-center gap-8 rounded-2xl border border-border bg-surface p-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <h2
            className="m-0 font-semibold tracking-[-0.02em] text-balance"
            style={{ fontSize: "clamp(24px, 3vw, 32px)", lineHeight: 1.15 }}
          >
            Find out the single most important
            <br />
            thing to do next with your dollars.
          </h2>
          <div className="flex flex-col items-start gap-2.5">
            <a
              href="#preview"
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-brand px-[22px] py-3.5 text-[15px] font-medium text-brand-foreground shadow-[0_0_32px_rgba(139,124,255,0.22)] transition-colors hover:bg-brand-hover"
            >
              See a sample dashboard
              <ArrowRight size={16} />
            </a>
            <span className="text-xs text-muted-2">Free during beta Â· no account required</span>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <BrandLockup width={180} height={28} className="h-7 w-auto" />
            <p className="mt-4 max-w-[44ch] text-[13px] leading-[1.55] text-muted-2">
              TractionFI provides general information based on a published financial framework. It
              is not financial, tax, or investment advice.
            </p>
          </div>

          <FooterColumn
            heading="Product"
            links={[
              { label: "How it works", href: "#how" },
              { label: "The framework", href: "#framework" },
              { label: "Sample dashboard", href: "#preview" },
              { label: "FAQ", href: "#faq" },
            ]}
          />
          <FooterColumn
            heading="About"
            links={[
              { label: "Privacy", href: "#" },
              { label: "Terms", href: "#" },
              { label: "Disclosures", href: "#" },
              { label: "hello@tractionfi.app", href: "mailto:hello@tractionfi.app" },
            ]}
          />
        </div>

        <hr className="mt-12 h-px border-0 bg-border" />
        <div className="mt-5 flex items-center justify-between text-xs text-muted-2">
          <span>Â© {year} TractionFI. Personal finance, decided.</span>
          <span className="font-mono">v0.4.2-beta</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-2">{heading}</div>
      <ul className="mt-4 grid list-none gap-2.5 p-0">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-brand hover:underline"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
