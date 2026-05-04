import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import type { AdvPersonaFitCell, SelectionThresholds } from "../../types";
import { PanelSection } from "./PanelSection";
import { PersonaCard } from "./PersonaCard";
import { cn } from "../../lib/utils";

interface SelectedPersonasProps {
  personas: AdvPersonaFitCell[];
  borderline?: AdvPersonaFitCell[];
  thresholds: SelectionThresholds;
}

const PERSONA_CATALOG_TOTAL = 10;

export function SelectedPersonas({
  personas,
  borderline = [],
  thresholds,
}: SelectedPersonasProps) {
  const [showMore, setShowMore] = useState(false);

  const borderlineSorted = useMemo(
    () => [...borderline].sort((a, b) => a.final_score - b.final_score),
    [borderline]
  );
  const lastIdx = borderlineSorted.length - 1;

  const subtitle =
    `Who to talk to, ranked by fit · top ${thresholds.k_personas} of ${PERSONA_CATALOG_TOTAL} · ` +
    `${thresholds.confidence_used}-confidence brief`;

  return (
    <PanelSection
      title="Selected Personas"
      subtitle={subtitle}
      meta={`${personas.length} selected`}
    >
      <div className="space-y-3">
        {personas.map((p) => (
          <PersonaCard key={p.persona_id} cell={p} />
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
            {showMore ? "Hide" : "Show"} {borderlineSorted.length} more persona
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
                  Ranked below the top {thresholds.k_personas} — useful if you
                  want to broaden the audience.
                </p>
                <div className="mt-4 space-y-3">
                  {borderlineSorted.map((p, i) => (
                    <div key={p.persona_id} className="space-y-1.5">
                      <PersonaCard cell={p} muted />
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
