import type { CreativeSet } from "../../types";
import { PanelSection } from "./PanelSection";
import { CreativeMockup } from "./CreativeMockup";

interface CreativeVariantsProps {
  creatives: CreativeSet;
}

export function CreativeVariants({ creatives }: CreativeVariantsProps) {
  return (
    <PanelSection
      title="Persona-Tuned Creatives"
      subtitle="What to say, one variant per persona"
      meta={`${creatives.creatives.length} variants`}
    >
      <div className="space-y-9">
        {creatives.creatives.map((c) => (
          <CreativeMockup key={c.persona_id} creative={c} />
        ))}
      </div>
    </PanelSection>
  );
}
