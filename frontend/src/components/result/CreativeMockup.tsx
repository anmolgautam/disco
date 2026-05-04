import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { Creative } from "../../types";
import { cn } from "../../lib/utils";

interface CreativeMockupProps {
  creative: Creative;
}

export function CreativeMockup({ creative }: CreativeMockupProps) {
  const [open, setOpen] = useState(false);

  return (
    <article>
      {/* Eyebrow above the ad */}
      <p className="text-[10.5px] uppercase tracking-[0.18em] text-ink-subtle font-semibold mb-3">
        Creative for · <span className="text-ink-muted">{creative.persona_name}</span>
      </p>

      {/* The ad mockup itself — distinct surface to feel like the rendered ad */}
      <div className="relative bg-[#FAFAF7] border border-line rounded-card px-8 py-10 sm:px-10 sm:py-12 shadow-card">
        {/* Tiny "AD PREVIEW" label in the corner */}
        <span className="absolute top-3.5 right-4 text-[9.5px] uppercase tracking-[0.18em] text-ink-subtle/80 font-semibold font-mono">
          ad preview
        </span>

        <h3 className="text-[24px] sm:text-[26px] font-bold tracking-[-0.02em] text-ink leading-[1.15] max-w-[520px]">
          {creative.headline}
        </h3>
        <p className="mt-4 text-[15px] text-ink-muted leading-relaxed max-w-[520px]">
          {creative.body}
        </p>
        <div className="mt-7">
          <span className="inline-flex items-center gap-2 rounded-pill bg-brand-gradient text-white text-[13.5px] font-semibold px-5 py-2.5 shadow-brand">
            {creative.cta}
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.75} />
          </span>
        </div>
      </div>

      {/* Reasoning toggle */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted hover:text-ink transition-colors duration-150"
        >
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-200",
              open ? "rotate-0" : "-rotate-90"
            )}
            strokeWidth={2.5}
          />
          Why this works for {creative.persona_name}
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="reasoning"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <p className="mt-4 pl-5 border-l border-line text-[14px] text-ink leading-relaxed max-w-prose">
                {creative.reasoning}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}
