import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface PrimaryButtonProps {
  label?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function PrimaryButton({
  label = "Generate Campaign",
  disabled = false,
  onClick,
}: PrimaryButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      whileHover={disabled ? undefined : "hover"}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "group relative inline-flex items-center gap-2.5",
        "rounded-pill px-7 py-3.5 text-[15px] font-semibold tracking-tight text-white",
        "transition-shadow duration-200",
        disabled
          ? "bg-ink-subtle/40 cursor-not-allowed shadow-none"
          : "bg-brand-gradient shadow-brand hover:shadow-brand-strong cursor-pointer"
      )}
    >
      <span>{label}</span>
      <motion.span
        variants={{ hover: { x: 4 } }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="inline-flex"
      >
        <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
      </motion.span>
    </motion.button>
  );
}
