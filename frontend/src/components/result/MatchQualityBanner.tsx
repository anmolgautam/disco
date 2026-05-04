import { motion } from "motion/react";
import { Info, AlertTriangle } from "lucide-react";
import type { MatchQuality } from "../../types";
import { cn } from "../../lib/utils";

interface MatchQualityBannerProps {
  quality: MatchQuality;
  note: string;
}

/**
 * Surfaces the catalog-fit signal computed in Stage 4.
 * Renders nothing on a strong match (the happy path stays visually quiet).
 * Moderate gets a soft amber notice; weak gets a stronger one with explainer chrome.
 */
export function MatchQualityBanner({ quality, note }: MatchQualityBannerProps) {
  if (quality === "strong" || !note) return null;

  const isWeak = quality === "weak";
  const eyebrow = isWeak ? "Limited fit" : "Heads up";
  const title = isWeak
    ? "The current catalog isn't an obvious fit for this brief."
    : "Moderate match — adjacent inventory, no clean winners.";
  const Icon = isWeak ? AlertTriangle : Info;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
      className={cn(
        "w-full rounded-card border px-6 py-5 sm:px-7 sm:py-6",
        isWeak
          ? "bg-[#FFFBF5] border-[#F5D9B6]"
          : "bg-[#FDFAF3] border-[#EFE3C2]"
      )}
    >
      <header className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0",
            isWeak
              ? "bg-[#FFF1E0] text-[#B8531A]"
              : "bg-[#FBF1D9] text-[#8A6B1F]"
          )}
        >
          <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "text-[10.5px] font-semibold uppercase tracking-[0.18em]",
              isWeak ? "text-[#B8531A]" : "text-[#8A6B1F]"
            )}
          >
            {eyebrow}
          </p>
          <h3 className="mt-1 text-[17px] sm:text-[18.5px] font-bold tracking-[-0.015em] text-ink leading-snug">
            {title}
          </h3>
        </div>
      </header>

      <p className="mt-3 ml-10 text-[13.5px] text-ink-muted leading-relaxed max-w-prose">
        {note}
      </p>

      {isWeak && (
        <p className="mt-3 ml-10 text-[12.5px] text-ink-subtle italic leading-relaxed max-w-prose">
          The publishers below are the closest matches we could find. Treat them
          as a sanity check, not a recommendation, and consider whether this
          brief belongs in a different network.
        </p>
      )}
    </motion.section>
  );
}
