import type { CanonicalBrief } from "../../types";
import { PanelSection } from "./PanelSection";
import { cn } from "../../lib/utils";

interface BriefDetailProps {
  brief: CanonicalBrief;
}

const PILL_SOFT = "bg-canvas border border-line text-ink-muted";

function PillChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-0.5 text-[12px] font-medium",
        PILL_SOFT
      )}
    >
      {children}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-[10.5px] uppercase tracking-[0.14em] text-ink-subtle font-semibold">
        {label}
      </dt>
      <dd className="text-[14.5px] text-ink leading-snug">{children}</dd>
    </div>
  );
}

export function BriefDetail({ brief }: BriefDetailProps) {
  const confidenceColor =
    brief.confidence === "high"
      ? "bg-brand-gradient text-white"
      : brief.confidence === "medium"
      ? "bg-[#FFF1E8] text-[#B8531A]"
      : "bg-[#FEE2E2] text-[#B91C1C]";

  return (
    <PanelSection
      title="Campaign Brief"
      subtitle="What we extracted from your input"
      meta={
        <span
          className={cn(
            "inline-flex items-center rounded-pill px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
            confidenceColor
          )}
        >
          confidence: {brief.confidence}
        </span>
      }
    >
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
        {brief.product_or_service && (
          <Field label="Product">{brief.product_or_service}</Field>
        )}
        {brief.category && <Field label="Category">{brief.category}</Field>}

        {brief.subcategory_signals.length > 0 && (
          <Field label="Tags">
            <div className="flex flex-wrap gap-1.5">
              {brief.subcategory_signals.map((s) => (
                <PillChip key={s}>{s}</PillChip>
              ))}
            </div>
          </Field>
        )}

        {brief.target_customer && (
          <Field label="Target customer">{brief.target_customer}</Field>
        )}

        {brief.value_props.length > 0 && (
          <Field label="Value props">
            <div className="flex flex-wrap gap-1.5">
              {brief.value_props.map((v) => (
                <PillChip key={v}>{v}</PillChip>
              ))}
            </div>
          </Field>
        )}

        {brief.proof_or_features.length > 0 && (
          <Field label="Proof / features">
            <div className="flex flex-wrap gap-1.5">
              {brief.proof_or_features.map((p) => (
                <PillChip key={p}>{p}</PillChip>
              ))}
            </div>
          </Field>
        )}

        {brief.positioning && (
          <Field label="Positioning">{brief.positioning}</Field>
        )}

        <Field label="Pricing">
          <span>
            {brief.price_tier !== "unknown" ? brief.price_tier : "—"}
            {brief.business_model !== "unknown" && (
              <>
                <span className="text-ink-subtle mx-1.5">·</span>
                {brief.business_model.replace(/_/g, " ")}
              </>
            )}
          </span>
        </Field>

        {brief.tone && <Field label="Tone">{brief.tone}</Field>}

        <Field label="Geos">
          <div className="flex flex-wrap gap-1.5">
            {(brief.geo_intent.length ? brief.geo_intent : ["nationwide"]).map(
              (g) => (
                <PillChip key={g}>{g}</PillChip>
              )
            )}
          </div>
        </Field>

        {brief.constraints_or_risks.length > 0 && (
          <Field label="Constraints / risks">
            <ul className="space-y-1 list-disc pl-4 text-[13.5px] text-ink-muted">
              {brief.constraints_or_risks.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Field>
        )}
      </dl>

      {brief.assumptions.length > 0 && (
        <div className="mt-7 pt-5 border-t border-line/70">
          <p className="text-[10.5px] uppercase tracking-[0.14em] text-ink-subtle font-semibold mb-2">
            AI inferred
          </p>
          <ul className="space-y-1">
            {brief.assumptions.map((a) => (
              <li
                key={a}
                className="text-[13px] italic text-ink-muted leading-relaxed"
              >
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </PanelSection>
  );
}
