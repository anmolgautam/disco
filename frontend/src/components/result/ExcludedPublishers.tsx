import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import type { ExcludedPublisher, SelectionThresholds } from "../../types";
import { PanelSection } from "./PanelSection";
import { ScorePill } from "./ScorePill";
import { ComponentBars } from "./ComponentBars";
import { ReasoningAccordion } from "./ReasoningAccordion";
import { cn } from "../../lib/utils";

interface ExcludedPublishersProps {
  excluded: ExcludedPublisher[];
  thresholds: SelectionThresholds;
}

const DEFAULT_VISIBLE = 5;

export function ExcludedPublishers({ excluded, thresholds }: ExcludedPublishersProps) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? excluded : excluded.slice(0, DEFAULT_VISIBLE);
  const hidden = excluded.length - visible.length;

  return (
    <PanelSection
      title="Excluded Publishers"
      subtitle="Where we deliberately held back"
      meta={`${excluded.length} excluded`}
    >
      {excluded.length === 0 ? (
        <div className="rounded-lg border border-line/60 bg-canvas/40 px-5 py-4">
          <p className="text-[13.5px] text-ink leading-relaxed max-w-prose">
            Nothing crossed the exclusion gates for this{" "}
            <span className="font-semibold">{thresholds.confidence_used}</span>-confidence
            brief. No publisher scored below{" "}
            <span className="font-mono tabular-nums">
              {thresholds.exclusion_score_floor.toFixed(2)}
            </span>{" "}
            or had risk above{" "}
            <span className="font-mono tabular-nums">
              {thresholds.exclusion_risk_ceiling.toFixed(2)}
            </span>
            . Everything weak fell into the silent middle of Selected Publishers
            instead.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-line/70">
            {visible.map((e) => (
              <ExcludedRow key={e.cell.publisher_id} excluded={e} />
            ))}
          </ul>

          {hidden > 0 && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-4 text-[12.5px] font-medium text-ink-muted hover:text-ink transition-colors duration-150 inline-flex items-center gap-1.5"
            >
              <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.5} />
              Show {hidden} more
            </button>
          )}
        </>
      )}
    </PanelSection>
  );
}

function ExcludedRow({ excluded }: { excluded: ExcludedPublisher }) {
  const [open, setOpen] = useState(false);
  const { cell, exclusion_reason } = excluded;

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-4 py-3.5 text-left",
          "hover:bg-canvas/60 transition-colors duration-150 -mx-3 px-3 rounded-lg"
        )}
      >
        <ScorePill score={cell.final_score} variant="muted" />
        <span className="text-[14.5px] text-ink font-medium shrink-0">
          {cell.publisher_name}
        </span>
        <span className="text-[13.5px] text-ink-muted truncate flex-1 min-w-0">
          — {exclusion_reason}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-ink-subtle transition-transform duration-200 shrink-0",
            open ? "rotate-0" : "-rotate-90"
          )}
          strokeWidth={2}
        />
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
            <div className="pb-5 pt-2 pl-[60px] pr-2 space-y-4">
              <ComponentBars components={cell.components} kind="publisher" />
              <p className="text-[13.5px] text-ink leading-relaxed max-w-prose">
                {cell.reasons.overall_thought}
              </p>
              <ReasoningAccordion reasons={cell.reasons} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
