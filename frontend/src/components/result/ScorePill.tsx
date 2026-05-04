import { cn } from "../../lib/utils";

interface ScorePillProps {
  score: number;
  /** Visual emphasis. Strong = full gradient; muted = lower opacity (used for excluded). */
  variant?: "strong" | "muted";
  /** Display precision — defaults to 3 decimals. */
  precision?: number;
}

export function ScorePill({
  score,
  variant = "strong",
  precision = 3,
}: ScorePillProps) {
  const display = score.toFixed(precision);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-pill font-mono",
        "px-2.5 py-1 text-[12px] tabular-nums tracking-tight font-semibold leading-none",
        variant === "strong"
          ? "bg-brand-gradient text-white shadow-brand"
          : "bg-line text-ink-muted"
      )}
    >
      [{display}]
    </span>
  );
}
