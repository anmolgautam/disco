import { motion } from "motion/react";
import type { CampaignStreamState } from "../../hooks/useCampaignStream";
import { ResultsActionBar } from "./ResultsActionBar";
import { BriefDetail } from "./BriefDetail";
import { MatchQualityBanner } from "./MatchQualityBanner";
import { RecommendedPublishers } from "./RecommendedPublishers";
import { ExcludedPublishers } from "./ExcludedPublishers";
import { SelectedPersonas } from "./SelectedPersonas";
import { PersonaPubMatrix } from "./PersonaPubMatrix";
import { CreativeVariants } from "./CreativeVariants";
import { CampaignConfigPanel } from "./CampaignConfigPanel";

interface ResultsViewProps {
  state: CampaignStreamState;
  onReset: () => void;
}

export function ResultsView({ state, onReset }: ResultsViewProps) {
  if (
    !state.doneData ||
    state.doneData.status !== "complete"
  ) {
    return null;
  }

  const { brief, recommendation, creatives, config } = state.doneData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.2,
      }}
      className="flex flex-col gap-5"
    >
      <ResultsActionBar onReset={onReset} />
      <BriefDetail brief={brief} />
      <MatchQualityBanner
        quality={recommendation.match_quality}
        note={recommendation.match_quality_note}
      />
      <RecommendedPublishers
        publishers={recommendation.recommended_publishers}
        borderline={recommendation.borderline_publishers}
        thresholds={recommendation.selection_thresholds}
      />
      <ExcludedPublishers
        excluded={recommendation.excluded_publishers}
        thresholds={recommendation.selection_thresholds}
      />
      <SelectedPersonas
        personas={recommendation.recommended_personas}
        borderline={recommendation.borderline_personas}
        thresholds={recommendation.selection_thresholds}
      />
      <PersonaPubMatrix recommendation={recommendation} />
      <CreativeVariants creatives={creatives} />
      <CampaignConfigPanel config={config} />
    </motion.div>
  );
}
