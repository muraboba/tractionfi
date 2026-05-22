import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number, props: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  ...props,
});

export function ArrowRight({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function ChevronDown({ size = 14, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function Lock({ size = 13, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function PencilLine({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function ListOrdered({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
  );
}

export function Target({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function Check({ size = 14, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function Plus({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function Minus({ size = 18, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M5 12h14" />
    </svg>
  );
}
