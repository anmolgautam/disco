import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import type { PublisherWithReach } from "../../types";
import { ScorePill } from "./ScorePill";
import { ComponentBars } from "./ComponentBars";
import { ReasoningAccordion } from "./ReasoningAccordion";
import { cn, formatImpressions } from "../../lib/utils";

interface PublisherCardProps {
  pub: PublisherWithReach;
  defaultOpen?: boolean;
  /** Visually subordinate (used for the "borderline" expand below the recommended list). */
  muted?: boolean;
}

export function PublisherCard({ pub, defaultOpen = false, muted = false }: PublisherCardProps) {
  const { cell, top_personas_reached } = pub;
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article
      className={cn(
        "border rounded-card overflow-hidden",
        muted
          ? "border-line/50 bg-canvas/40"
          : "border-line/80 bg-canvas-raised"
      )}
    >
      {/* Header — clickable, always visible */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between gap-4 px-6 py-4 text-left",
          "hover:bg-canvas/40 transition-colors duration-150"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <ScorePill score={cell.final_score} />
          <h3 className="text-[19px] font-bold tracking-[-0.018em] text-ink truncate">
            {cell.publisher_name}
          </h3>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-[12.5px] text-ink-muted font-mono tabular-nums">
            {formatImpressions(cell.monthly_impressions)} reach
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-ink-subtle transition-transform duration-200",
              open ? "rotate-0" : "-rotate-90"
            )}
            strokeWidth={2.25}
          />
        </div>
      </button>

      {/* Body — collapsible */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2">
              <ComponentBars components={cell.components} kind="publisher" />

              <p className="mt-6 text-[14.5px] text-ink leading-relaxed max-w-prose">
                {cell.reasons.overall_thought}
              </p>

              <div className="mt-5">
                <ReasoningAccordion reasons={cell.reasons} />
              </div>

              {top_personas_reached.length > 0 && (
                <div className="mt-5 pt-5 border-t border-line/70 flex items-center gap-3 flex-wrap">
                  <span className="text-[10.5px] uppercase tracking-[0.14em] text-ink-subtle font-semibold">
                    Reaches
                  </span>
                  {top_personas_reached.map((p) => (
                    <span
                      key={p.persona_id}
                      className="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-[12.5px] font-medium bg-[#F3EFFF] text-[#5A3FD9]"
                    >
                      {p.persona_name}
                      <span className="text-[#5A3FD9]/60">·</span>
                      <span className="font-mono tabular-nums">
                        {p.affinity_score.toFixed(2)}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
