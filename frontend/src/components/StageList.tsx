import type { UIStageState } from "../types";
import { StageRow } from "./StageRow";
import { formatDuration } from "../lib/utils";
import type { Phase } from "../hooks/useCampaignStream";

interface StageListProps {
  phase: Phase;
  stages: UIStageState[];
}

export function StageList({ phase, stages }: StageListProps) {
  const totalMs = stages.reduce(
    (acc, s) => acc + (s.duration_ms ?? 0),
    0
  );

  const heading =
    phase === "complete"
      ? `CAMPAIGN GENERATED · ${formatDuration(totalMs)}`
      : phase === "needs_clarification"
      ? "CLARIFICATION NEEDED"
      : phase === "error"
      ? "GENERATION FAILED"
      : "GENERATING CAMPAIGN";

  return (
    <section>
      <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-subtle mb-5">
        {heading}
      </h2>

      <ol className="space-y-4">
        {stages.map((stage) => (
          <StageRow key={stage.stage_id} stage={stage} />
        ))}
      </ol>
    </section>
  );
}
