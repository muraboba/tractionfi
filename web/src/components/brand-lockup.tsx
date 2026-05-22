// Inline so the wordmark + logomark inherit theme tokens.
// Visual parity with public/brand/lockup-horizontal.svg — keep in sync if the
// brand asset changes.
export function BrandLockup({
  width = 144,
  height = 22,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 416 64"
      role="img"
      aria-label="TractionFI"
      width={width}
      height={height}
      className={className}
    >
      <g>
        <circle cx="12" cy="48" r="4.5" fill="none" stroke="var(--foreground)" strokeWidth="2" opacity="0.45" />
        <circle cx="30" cy="32" r="5.5" fill="none" stroke="var(--foreground)" strokeWidth="2" opacity="0.70" />
        <circle cx="50" cy="14" r="8.5" fill="var(--brand)" />
      </g>
      <text
        x="84"
        y="46"
        fontFamily="Geist, 'Geist Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"
        fontWeight="700"
        fontSize="48"
        letterSpacing="-1.68"
        fill="var(--foreground)"
      >
        Traction
        <tspan fill="var(--brand)">FI</tspan>
      </text>
    </svg>
  );
}
