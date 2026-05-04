import type { CampaignRecommendation } from "../../types";
import { PanelSection } from "./PanelSection";
import { cn } from "../../lib/utils";

interface PersonaPubMatrixProps {
  recommendation: CampaignRecommendation;
}

function intensityFor(score: number): { dots: number; bgOpacity: number } {
  if (score >= 0.5) return { dots: 3, bgOpacity: 0.18 };
  if (score >= 0.3) return { dots: 2, bgOpacity: 0.1 };
  return { dots: 1, bgOpacity: 0.04 };
}

export function PersonaPubMatrix({ recommendation }: PersonaPubMatrixProps) {
  const personas = recommendation.recommended_personas;
  const publishers = recommendation.recommended_publishers.map((p) => p.cell);
  const table = recommendation.persona_pub_table;

  // Find the strongest cell for the footer summary
  let best: { persona: string; pub: string; score: number } | null = null;
  for (const persona of personas) {
    const row = table[persona.persona_id] ?? [];
    for (const pub of row) {
      if (!best || pub.joint_score > best.score) {
        best = {
          persona: persona.persona_name,
          pub: pub.publisher_name,
          score: pub.joint_score,
        };
      }
    }
  }

  return (
    <PanelSection
      title="Persona × Publisher Reach"
      subtitle="Joint scores per pair"
      meta="joint = pub_fit × affinity"
    >
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="text-left py-2.5 pr-4 text-[10.5px] uppercase tracking-[0.14em] text-ink-subtle font-semibold align-bottom">
                Persona ↓ / Publisher →
              </th>
              {publishers.map((pub) => (
                <th
                  key={pub.publisher_id}
                  className="px-3 py-2.5 text-[12.5px] font-semibold text-ink text-center align-bottom whitespace-nowrap"
                >
                  {pub.publisher_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {personas.map((persona, rowIdx) => {
              const row = table[persona.persona_id] ?? [];
              const byPubId: Record<string, number> = Object.fromEntries(
                row.map((r) => [r.publisher_id, r.joint_score])
              );
              return (
                <tr key={persona.persona_id}>
                  <td
                    className={cn(
                      "py-3 pr-4 text-[14px] text-ink font-medium whitespace-nowrap border-t border-line/70",
                      rowIdx === 0 && "border-t-0"
                    )}
                  >
                    {persona.persona_name}
                  </td>
                  {publishers.map((pub) => {
                    const score = byPubId[pub.publisher_id] ?? 0;
                    const isBest =
                      best &&
                      best.persona === persona.persona_name &&
                      best.pub === pub.publisher_name;
                    const { dots, bgOpacity } = intensityFor(score);
                    return (
                      <td
                        key={pub.publisher_id}
                        className={cn(
                          "px-3 py-3 text-center align-middle border-t border-line/70 relative",
                          rowIdx === 0 && "border-t-0"
                        )}
                      >
                        {/* Background tint proportional to score */}
                        <span
                          aria-hidden
                          className="absolute inset-1 rounded-lg bg-brand-gradient pointer-events-none"
                          style={{ opacity: bgOpacity }}
                        />
                        <span className="relative flex flex-col items-center gap-1">
                          <span
                            className={cn(
                              "font-mono tabular-nums text-[14px] font-semibold",
                              isBest ? "text-ink" : "text-ink"
                            )}
                          >
                            {score.toFixed(2)}
                          </span>
                          <span className="flex gap-0.5">
                            {[1, 2, 3].map((i) => (
                              <span
                                key={i}
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  i <= dots
                                    ? "bg-brand-gradient"
                                    : "bg-line"
                                )}
                              />
                            ))}
                          </span>
                          {isBest && (
                            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-brand-purple" />
                          )}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {best && (
        <p className="mt-6 text-[13px] text-ink-muted">
          <span className="text-ink-subtle uppercase tracking-[0.14em] font-semibold mr-2 text-[10.5px]">
            Best match
          </span>
          <span className="text-ink font-medium">{best.persona}</span>
          <span className="mx-1.5 text-ink-subtle">×</span>
          <span className="text-ink font-medium">{best.pub}</span>
          <span className="ml-2 font-mono tabular-nums text-ink">
            ({best.score.toFixed(2)})
          </span>
        </p>
      )}
    </PanelSection>
  );
}
