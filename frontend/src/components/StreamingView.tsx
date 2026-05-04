import { motion } from "motion/react";
import type { CampaignStreamState } from "../hooks/useCampaignStream";
import { StageList } from "./StageList";
import { TriangleViz } from "./TriangleViz";

export function StreamingView({ state }: { state: CampaignStreamState }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
      className="w-full bg-canvas-raised border border-line/70 rounded-card px-7 py-7 sm:px-9 sm:py-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-10">
        <div className="lg:col-span-7">
          <StageList phase={state.phase} stages={state.stages} />
        </div>
        <div className="lg:col-span-5 lg:border-l lg:border-line/60 lg:pl-10">
          <TriangleViz phase={state.phase} stages={state.stages} />
        </div>
      </div>
    </motion.section>
  );
}
