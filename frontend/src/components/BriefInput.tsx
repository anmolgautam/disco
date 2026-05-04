import { useEffect, useState, forwardRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { EXAMPLE_BRIEFS } from "../lib/examples";
import { cn } from "../lib/utils";

interface BriefInputProps {
  value: string;
  onChange: (next: string) => void;
}

/**
 * Generous textarea with rotating crossfade placeholder.
 * Focus state shows a 2px brand-gradient border via wrapper-padding trick + outer focus ring.
 */
export const BriefInput = forwardRef<HTMLTextAreaElement, BriefInputProps>(
  function BriefInput({ value, onChange }, ref) {
    const [placeholderIdx, setPlaceholderIdx] = useState(0);
    const [focused, setFocused] = useState(false);

    // Rotate the placeholder every 3.5s — only when textarea is empty AND not focused
    useEffect(() => {
      if (value.length > 0 || focused) return;
      const interval = setInterval(() => {
        setPlaceholderIdx((i) => (i + 1) % EXAMPLE_BRIEFS.length);
      }, 3500);
      return () => clearInterval(interval);
    }, [value, focused]);

    const showPlaceholder = value.length === 0;

    return (
      <div
        className={cn(
          "relative rounded-[18px] p-[2px] transition-shadow duration-200",
          focused ? "bg-brand-gradient shadow-input-focus" : "bg-line"
        )}
      >
        <div className="relative bg-canvas-raised rounded-[16px] overflow-hidden">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            spellCheck={false}
            className={cn(
              "block w-full h-[148px] resize-none bg-transparent text-ink",
              "px-6 py-5 text-[17px] leading-[1.55]",
              "focus:outline-none border-0 placeholder-transparent",
              "selection:bg-brand-purple/20"
            )}
            // Hidden native placeholder for accessibility; visible overlay below handles the visual.
            placeholder={EXAMPLE_BRIEFS[placeholderIdx].text}
            aria-label="Describe your business"
          />
          {showPlaceholder && (
            <div className="absolute inset-0 px-6 py-5 pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.span
                  key={placeholderIdx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 0.55, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="block text-ink-subtle text-[17px] leading-[1.55]"
                >
                  {EXAMPLE_BRIEFS[placeholderIdx].text}
                </motion.span>
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    );
  }
);
