import { motion } from "motion/react";

export function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="text-center max-w-2xl mx-auto"
    >
      <h1 className="text-display-xl text-ink">
        From one line to a{" "}
        <span className="text-gradient-brand whitespace-nowrap">live campaign.</span>
      </h1>
      <p className="mt-5 text-lg text-ink-muted leading-relaxed max-w-xl mx-auto">
        Describe your business. See where to run, who to talk to, what to say.
      </p>
    </motion.div>
  );
}
