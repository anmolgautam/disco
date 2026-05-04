import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import type {
  AdvPersonaFitReasons,
  AdvPubFitReasons,
} from "../../types";
import { cn } from "../../lib/utils";

interface ReasoningAccordionProps {
  reasons: AdvPubFitReasons | AdvPersonaFitReasons;
  /** Open by default, used when the row is already in an "expanded" context. */
  defaultOpen?: boolean;
}

const PUBLISHER_LABELS: Record<string, string> = {
  category_reason: "category",
  audience_reason: "audience",
  economic_reason: "economic",
  reach_reason: "reach",
  tone_reason: "tone",
  geo_reason: "geo",
  risk_reason: "risk",
};

const PERSONA_LABELS: Record<string, string> = {
  category_reason: "category",
  audience_reason: "audience",
  economic_reason: "economic",
  tone_reason: "tone",
  disinterest_reason: "disinterest",
};

export function ReasoningAccordion({
  reasons,
  defaultOpen = false,
}: ReasoningAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  // Pick the right label set based on which keys are present.
  const labels =
    "geo_reason" in reasons ? PUBLISHER_LABELS : PERSONA_LABELS;

  const lookup = reasons as unknown as Record<string, string>;
  const items = Object.entries(labels).map(([key, label]) => ({
    label,
    text: lookup[key] ?? "",
  }));

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted hover:text-ink transition-colors duration-150"
      >
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-200",
            open ? "rotate-0" : "-rotate-90"
          )}
          strokeWidth={2.5}
        />
        Per-component reasoning
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <dl className="mt-4 grid grid-cols-1 gap-y-3 pl-5 border-l border-line">
              {items.map((item) => (
                <div key={item.label} className="flex flex-col gap-1">
                  <dt className="text-[10.5px] uppercase tracking-[0.14em] text-ink-subtle font-semibold">
                    {item.label}
                  </dt>
                  <dd className="text-[13.5px] text-ink leading-relaxed">
                    {item.text}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
