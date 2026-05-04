import { AnimatePresence, motion } from "motion/react";
import { Check, X } from "lucide-react";
import type {
  AdvPersonaFitMatrix,
  AdvPubFitMatrix,
  CampaignConfig,
  CampaignRecommendation,
  CanonicalBrief,
  CreativeSet,
  UIStageState,
} from "../types";
import {
  cn,
  formatCurrency,
  formatDuration,
  formatScore,
} from "../lib/utils";

interface StageRowProps {
  stage: UIStageState;
}

export function StageRow({ stage }: StageRowProps) {
  const { status, name, duration_ms, error } = stage;

  return (
    <motion.li layout="position" className="relative pl-9">
      {/* Status indicator (absolute on left) */}
      <StatusIndicator status={status} />

      {/* Header row */}
      <div className="flex items-baseline justify-between gap-3 min-h-[28px]">
        <span
          className={cn(
            "text-[14.5px] font-medium leading-tight tracking-[-0.005em]",
            status === "waiting" && "text-ink-subtle",
            status !== "waiting" && "text-ink"
          )}
        >
          {name}
        </span>
        <span className="text-[12px] font-mono text-ink-muted tabular-nums shrink-0">
          {status === "waiting" && ""}
          {status === "running" && (
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-brand-purple opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-purple" />
              </span>
              running
            </span>
          )}
          {status === "complete" && duration_ms !== undefined && formatDuration(duration_ms)}
          {status === "error" && (
            <span className="text-[#B8531A] font-semibold uppercase tracking-[0.12em] text-[11px]">
              failed
            </span>
          )}
        </span>
      </div>

      {/* Expanded preview when complete */}
      <AnimatePresence initial={false}>
        {status === "complete" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-1">
              <StagePreview stage={stage} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error detail: wraps inside an amber-tinted block instead of overflowing the row */}
      <AnimatePresence initial={false}>
        {status === "error" && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 rounded-lg border border-[#F0DEC2] bg-[#FFFBF5] px-3 py-2.5 max-w-full">
              <p className="text-[12px] font-mono text-[#7A4A1A] leading-snug break-words whitespace-pre-wrap">
                {error}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

// ---------------------------------------------------------------------------

function StatusIndicator({ status }: { status: UIStageState["status"] }) {
  const baseRing = "absolute left-0 top-1 w-[18px] h-[18px] rounded-full";

  if (status === "waiting") {
    return <span className={cn(baseRing, "border-[1.5px] border-line")} />;
  }
  if (status === "running") {
    return (
      <span className={cn(baseRing, "p-[1.5px]")}>
        <span className="relative w-full h-full rounded-full">
          <motion.span
            className="absolute inset-0 rounded-full bg-brand-gradient"
            animate={{ scale: [1, 1.18, 1], opacity: [1, 0.55, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </span>
    );
  }
  if (status === "complete") {
    return (
      <span
        className={cn(
          baseRing,
          "bg-brand-gradient flex items-center justify-center"
        )}
      >
        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
      </span>
    );
  }
  // error
  return (
    <span
      className={cn(
        baseRing,
        "bg-red-100 border-[1.5px] border-red-400 flex items-center justify-center"
      )}
    >
      <X className="w-2.5 h-2.5 text-red-600" strokeWidth={3} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Stage-specific previews
// ---------------------------------------------------------------------------

const PILL_STYLES = [
  { bg: "bg-[#F3EFFF]", fg: "text-[#5A3FD9]" },
  { bg: "bg-[#E8F0FF]", fg: "text-[#2563EB]" },
  { bg: "bg-[#E8F7EF]", fg: "text-[#1B7A3F]" },
  { bg: "bg-[#FFF1E8]", fg: "text-[#B8531A]" },
  { bg: "bg-[#F1F2F5]", fg: "text-[#5A5A5A]" },
];

function StagePreview({ stage }: { stage: UIStageState }) {
  const { stage_id, payload } = stage;
  if (!payload) return null;

  if (stage_id === "extract_brief") {
    const brief = payload as CanonicalBrief;
    const chips: { label: string; value: string }[] = [];
    if (brief.category) chips.push({ label: "category", value: brief.category });
    if (brief.price_tier && brief.price_tier !== "unknown")
      chips.push({ label: "tier", value: brief.price_tier });
    if (brief.business_model && brief.business_model !== "unknown")
      chips.push({ label: "model", value: brief.business_model });
    if (brief.tone) chips.push({ label: "tone", value: brief.tone });
    chips.push({ label: "confidence", value: brief.confidence });

    return (
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c, i) => {
          const s = PILL_STYLES[i % PILL_STYLES.length];
          return (
            <span
              key={c.label}
              className={cn(
                "inline-flex items-center rounded-pill px-2.5 py-0.5 text-[11.5px] font-medium",
                s.bg,
                s.fg
              )}
            >
              <span className="opacity-60 mr-1.5 lowercase">{c.label}</span>
              <span className="truncate max-w-[160px]">{c.value}</span>
            </span>
          );
        })}
      </div>
    );
  }

  if (stage_id === "adv_pub_fit") {
    const m = payload as AdvPubFitMatrix;
    const top = m.cells.slice(0, 3);
    return <ScoreBars rows={top.map((c) => ({ label: c.publisher_name, score: c.final_score }))} />;
  }

  if (stage_id === "adv_persona_fit") {
    const m = payload as AdvPersonaFitMatrix;
    const top = m.cells.slice(0, 3);
    return <ScoreBars rows={top.map((c) => ({ label: c.persona_name, score: c.final_score }))} />;
  }

  if (stage_id === "combine") {
    const r = payload as CampaignRecommendation;
    return (
      <p className="text-[13px] text-ink-muted leading-snug">
        <span className="text-ink font-medium">{r.recommended_publishers.length}</span>{" "}
        publishers chosen ·{" "}
        <span className="text-ink font-medium">{r.excluded_publishers.length}</span>{" "}
        excluded · persona–publisher join table ready
      </p>
    );
  }

  if (stage_id === "creative_writing") {
    const cs = payload as CreativeSet;
    return (
      <ul className="space-y-1.5">
        {cs.creatives.map((c) => (
          <li key={c.persona_id} className="text-[13.5px] text-ink leading-snug">
            <span className="text-ink-subtle mr-2 text-[12px] font-mono">→</span>
            <span className="font-medium tracking-[-0.01em]">{c.headline}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (stage_id === "campaign_config") {
    const cfg = payload as CampaignConfig;
    return (
      <p className="text-[13px] text-ink-muted leading-snug">
        Campaign assembled ·{" "}
        <span className="text-ink font-medium">{formatCurrency(cfg.total_budget_usd)}</span> ·{" "}
        <span className="text-ink font-medium">
          {cfg.bid_strategy.bid_type} ${cfg.bid_strategy.max_bid_usd.toFixed(0)}
        </span>{" "}
        ·{" "}
        <span className="text-ink font-medium">
          {cfg.creative_assignments.length}
        </span>{" "}
        creative assignments
      </p>
    );
  }

  return null;
}

function ScoreBars({ rows }: { rows: { label: string; score: number }[] }) {
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-3">
          <span className="text-[11.5px] font-mono text-ink-muted tabular-nums w-9 shrink-0">
            {formatScore(r.score)}
          </span>
          <span className="text-[13.5px] text-ink min-w-0 truncate flex-1">
            {r.label}
          </span>
          <span className="relative flex-1 h-1 rounded-full bg-line/70 overflow-hidden max-w-[140px]">
            <motion.span
              className="absolute inset-y-0 left-0 bg-brand-gradient rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(2, Math.min(100, r.score * 100))}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
