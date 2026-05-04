import { motion } from "motion/react";
import type {
  AdvPersonaFitComponents,
  AdvPubFitComponents,
} from "../../types";
import { cn } from "../../lib/utils";

interface ComponentRow {
  key: string;
  label: string;
  value: number;
  /** When true, higher is worse — bar uses red tint. */
  isNegative?: boolean;
}

interface ComponentBarsProps {
  components: AdvPubFitComponents | AdvPersonaFitComponents;
  kind: "publisher" | "persona";
}

const PUBLISHER_KEYS: ComponentRow[] = [
  { key: "category", label: "category", value: 0 },
  { key: "audience", label: "audience", value: 0 },
  { key: "economic", label: "economic", value: 0 },
  { key: "reach", label: "reach", value: 0 },
  { key: "tone", label: "tone", value: 0 },
  { key: "geo", label: "geo", value: 0 },
  { key: "risk", label: "risk", value: 0, isNegative: true },
];

const PERSONA_KEYS: ComponentRow[] = [
  { key: "category", label: "category", value: 0 },
  { key: "audience", label: "audience", value: 0 },
  { key: "economic", label: "economic", value: 0 },
  { key: "tone", label: "tone", value: 0 },
  { key: "disinterest", label: "disinterest", value: 0, isNegative: true },
];

export function ComponentBars({ components, kind }: ComponentBarsProps) {
  const template = kind === "publisher" ? PUBLISHER_KEYS : PERSONA_KEYS;
  const lookup = components as unknown as Record<string, number>;
  const rows: ComponentRow[] = template.map((t) => ({
    ...t,
    value: lookup[t.key] ?? 0,
  }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
      {rows.map((row, idx) => (
        <BarRow key={row.key} row={row} idx={idx} />
      ))}
    </div>
  );
}

function BarRow({ row, idx }: { row: ComponentRow; idx: number }) {
  const pct = Math.max(2, Math.min(100, row.value * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11.5px] uppercase tracking-wider text-ink-subtle w-[68px] shrink-0">
        {row.label}
      </span>
      <span className="relative flex-1 h-1 rounded-full bg-line/70 overflow-hidden">
        <motion.span
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            row.isNegative ? "bg-red-300" : "bg-brand-gradient"
          )}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: idx * 0.04 }}
        />
      </span>
      <span className="text-[11.5px] font-mono text-ink-muted tabular-nums w-9 text-right shrink-0">
        {row.value.toFixed(2)}
      </span>
    </div>
  );
}
