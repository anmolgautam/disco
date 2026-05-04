import { type ReactNode } from "react";
import { motion } from "motion/react";

interface PanelSectionProps {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  children: ReactNode;
  /** When true, animates immediately on mount instead of waiting for viewport. */
  animateOnMount?: boolean;
}

/**
 * Generic section wrapper used by every result panel.
 * Bold title (the explicit answer to what the assignment asked for) + optional
 * subtitle prose + optional right-aligned meta + body.
 * Fades in from below when scrolled into view.
 */
export function PanelSection({
  title,
  subtitle,
  meta,
  children,
  animateOnMount = false,
}: PanelSectionProps) {
  const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      {...(animateOnMount
        ? {
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.4, ease, delay: 0.3 },
          }
        : {
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, margin: "-80px" as const },
            transition: { duration: 0.4, ease },
          })}
      className="bg-canvas-raised border border-line/70 rounded-card px-7 py-7 sm:px-9 sm:py-8"
    >
      <header className="flex items-baseline justify-between gap-4">
        <h2 className="text-[22px] sm:text-[26px] font-bold tracking-[-0.02em] text-ink leading-tight">
          {title}
        </h2>
        {meta && (
          <div className="text-[12.5px] text-ink-subtle font-mono shrink-0">{meta}</div>
        )}
      </header>
      {subtitle && (
        <p className="mt-1.5 text-[14px] text-ink-muted leading-snug">{subtitle}</p>
      )}
      <div className="mt-6">{children}</div>
    </motion.section>
  );
}
