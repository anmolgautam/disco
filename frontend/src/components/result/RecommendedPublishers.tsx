import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import type { PublisherWithReach, SelectionThresholds } from "../../types";
import { PanelSection } from "./PanelSection";
import { PublisherCard } from "./PublisherCard";
import { cn } from "../../lib/utils";

interface RecommendedPublishersProps {
  publishers: PublisherWithReach[];
  borderline?: PublisherWithReach[];
  thresholds: SelectionThresholds;
}

const CATALOG_TOTAL = 20; // backend catalog size; only used for "top X of N" copy

export function RecommendedPublishers({
  publishers,
  borderline = [],
  thresholds,
}: RecommendedPublishersProps) {
  const [showMore, setShowMore] = useState(false);

  // Sort borderline weakest-first so the bottom card visually anchors the floor.
  const borderlineSorted = useMemo(
    () =>
      [...borderline].sort((a, b) => a.cell.final_score - b.cell.final_score),
    [borderline]
  );
  const lastIdx = borderlineSorted.length - 1;

  const subtitle =
    `Where to run, ranked by fit · top ${thresholds.k_publishers} of ${CATALOG_TOTAL} · ` +
    `${thresholds.confidence_used}-confidence brief`;

  return (
    <PanelSection
      title="Selected Publishers"
      subtitle={subtitle}
      meta={`${publishers.length} chosen`}
    >
      <div className="space-y-3">
        {publishers.map((p) => (
          <PublisherCard key={p.cell.publisher_id} pub={p} />
        ))}
      </div>

      {borderlineSorted.length > 0 && (
        <div className="mt-6 pt-5 border-t border-line/60">
          <button
            type="button"
            onClick={() => setShowMore((s) => !s)}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted hover:text-ink transition-colors duration-150"
          >
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-200",
                showMore ? "rotate-0" : "-rotate-90"
              )}
              strokeWidth={2.5}
            />
            {showMore ? "Hide" : "Show"} {borderlineSorted.length} more candidate
            {borderlineSorted.length === 1 ? "" : "s"} (the silent middle)
          </button>

          <AnimatePresence initial={false}>
            {showMore && (
              <motion.div
                key="borderline"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <p className="mt-4 text-[12.5px] text-ink-subtle italic leading-relaxed max-w-prose">
                  Ranked below the top {thresholds.k_publishers} but not flagged
                  for exclusion (score ≥ {thresholds.exclusion_score_floor.toFixed(2)},
                  risk ≤ {thresholds.exclusion_risk_ceiling.toFixed(2)}).
                </p>
                <div className="mt-4 space-y-3">
                  {borderlineSorted.map((p, i) => (
                    <div key={p.cell.publisher_id} className="space-y-1.5">
                      <PublisherCard pub={p} muted />
                      {i === lastIdx && (
                        <p className="pl-2 text-[10.5px] uppercase tracking-[0.14em] text-ink-subtle font-semibold">
                          Lowest of {borderlineSorted.length} ranked
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </PanelSection>
  );
}
