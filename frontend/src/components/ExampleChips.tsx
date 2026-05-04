import { motion } from "motion/react";
import { EXAMPLE_BRIEFS } from "../lib/examples";
import { cn } from "../lib/utils";

interface ExampleChipsProps {
  onPick: (text: string) => void;
  dimmed?: boolean;
}

const PILL_STYLES = [
  { bg: "bg-[#F3EFFF]", fg: "text-[#5A3FD9]" }, // purple
  { bg: "bg-[#E8F0FF]", fg: "text-[#2563EB]" }, // blue
  { bg: "bg-[#E8F7EF]", fg: "text-[#1B7A3F]" }, // green
  { bg: "bg-[#FFF1E8]", fg: "text-[#B8531A]" }, // peach
];

export function ExampleChips({ onPick, dimmed = false }: ExampleChipsProps) {
  return (
    <div
      className={cn(
        "transition-opacity duration-300",
        dimmed ? "opacity-60" : "opacity-100"
      )}
    >
      <p className="text-center text-[12px] font-medium uppercase tracking-[0.14em] text-ink-subtle mb-3.5">
        Or try one of these
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {EXAMPLE_BRIEFS.map((ex, i) => {
          const style = PILL_STYLES[i % PILL_STYLES.length];
          return (
            <motion.button
              key={ex.label}
              type="button"
              onClick={() => onPick(ex.text)}
              whileTap={{ scale: 0.97 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className={cn(
                "rounded-pill px-4 py-2 text-[13.5px] font-medium",
                "transition-shadow duration-150 hover:shadow-card",
                style.bg,
                style.fg
              )}
            >
              {ex.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
