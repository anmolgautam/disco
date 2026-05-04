import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

interface ResultsActionBarProps {
  onReset: () => void;
}

export function ResultsActionBar({ onReset }: ResultsActionBarProps) {
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Detect when the bar has stuck (sentinel above leaves viewport).
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px 0px 0px" }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      {/* Sentinel — when this scrolls out of view, the bar has stuck. */}
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />

      <div
        className={cn(
          "sticky top-2 z-10 transition-all duration-300",
          scrolled
            ? "bg-canvas/85 backdrop-blur-md border border-line/70 shadow-card"
            : "bg-transparent border border-transparent",
          "rounded-card px-4 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between gap-3"
        )}
      >
        <span className="text-[10.5px] uppercase tracking-[0.18em] text-ink-subtle font-semibold">
          Your campaign
        </span>

        <motion.button
          type="button"
          onClick={onReset}
          whileTap={{ scale: 0.97 }}
          whileHover="hover"
          className="group inline-flex items-center gap-2 rounded-pill bg-brand-gradient text-white px-4 py-2 text-[13px] font-semibold shadow-brand hover:shadow-brand-strong transition-shadow duration-200"
        >
          Try another brief
          <motion.span
            variants={{ hover: { x: 3 } }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="inline-flex"
          >
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.75} />
          </motion.span>
        </motion.button>
      </div>
    </>
  );
}
