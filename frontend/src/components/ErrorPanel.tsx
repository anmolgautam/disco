import { motion } from "motion/react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { cn } from "../lib/utils";

interface ErrorPanelProps {
  message: string;
  onRetry: () => void;
  onEdit: () => void;
}

/**
 * Shown when the SSE stream errors out — most commonly the 429 rate-limit
 * from /campaign (1 req / 30s per IP). Soft amber chrome so it reads as
 * "expected friction" rather than a system crash.
 */
export function ErrorPanel({ message, onRetry, onEdit }: ErrorPanelProps) {
  const isRateLimit = /rate.?limit|too many requests|1 per/i.test(message);
  const eyebrow = isRateLimit ? "Rate limited" : "Something went wrong";
  const title = isRateLimit
    ? "Slow down a moment."
    : "We couldn't finish that one.";
  const helper = isRateLimit
    ? "We cap requests at one every 30 seconds to keep the demo responsive for everyone. Hang on a beat and try again."
    : "The pipeline failed mid-run. The detail below should help — or just retry.";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      className={cn(
        "w-full rounded-card border px-7 py-7 sm:px-9 sm:py-8",
        "bg-[#FFFBF5] border-[#F5D9B6]"
      )}
    >
      <header className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FFF1E0] text-[#B8531A] shrink-0">
          <AlertTriangle className="w-4 h-4" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#B8531A]">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-[22px] sm:text-[24px] font-extrabold tracking-[-0.02em] text-ink leading-[1.15]">
            {title}
          </h2>
        </div>
      </header>

      <p className="mt-4 text-[14.5px] text-ink-muted leading-relaxed max-w-prose">
        {helper}
      </p>

      <div className="mt-5 rounded-lg border border-[#F0DEC2] bg-white/60 px-4 py-3">
        <p className="text-[12.5px] font-mono text-[#7A4A1A] leading-snug break-words">
          {message}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            "inline-flex items-center gap-2 rounded-pill px-5 py-2.5 text-[13.5px] font-semibold",
            "bg-brand-gradient text-white shadow-brand hover:shadow-brand-strong cursor-pointer transition-shadow duration-200"
          )}
        >
          <RotateCw className="w-3.5 h-3.5" strokeWidth={2.5} />
          Try again
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-pill px-5 py-2.5 text-[13.5px] font-medium text-ink-muted hover:text-ink border border-line bg-canvas-raised transition-colors duration-150"
        >
          Edit brief
        </button>
      </div>
    </motion.section>
  );
}
