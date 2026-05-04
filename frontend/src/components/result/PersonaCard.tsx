import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import type { AdvPersonaFitCell } from "../../types";
import { ScorePill } from "./ScorePill";
import { ComponentBars } from "./ComponentBars";
import { ReasoningAccordion } from "./ReasoningAccordion";
import { cn } from "../../lib/utils";

interface PersonaCardProps {
  cell: AdvPersonaFitCell;
  defaultOpen?: boolean;
  /** Visually subordinate (used for the "borderline" expand below the selected list). */
  muted?: boolean;
}

export function PersonaCard({ cell, defaultOpen = false, muted = false }: PersonaCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article
      className={cn(
        "border rounded-card overflow-hidden",
        muted ? "border-line/50 bg-canvas/40" : "border-line/80 bg-canvas-raised"
      )}
    >
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
            {cell.persona_name}
          </h3>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-ink-subtle transition-transform duration-200 shrink-0",
            open ? "rotate-0" : "-rotate-90"
          )}
          strokeWidth={2.25}
        />
      </button>

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
              <ComponentBars components={cell.components} kind="persona" />

              <p className="mt-6 text-[14.5px] text-ink leading-relaxed max-w-prose">
                {cell.reasons.overall_thought}
              </p>

              <div className="mt-5">
                <ReasoningAccordion reasons={cell.reasons} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
