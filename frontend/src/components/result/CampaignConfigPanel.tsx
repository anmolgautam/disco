import { motion } from "motion/react";
import type { CampaignConfig } from "../../types";
import { PanelSection } from "./PanelSection";
import { cn, formatCurrency, formatPercent } from "../../lib/utils";

interface CampaignConfigPanelProps {
  config: CampaignConfig;
}

function SubBlockHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10.5px] uppercase tracking-[0.18em] text-ink-subtle font-semibold mb-4">
      {children}
    </h3>
  );
}

function HRule() {
  return <div className="border-t border-line/70 my-7" />;
}

export function CampaignConfigPanel({ config }: CampaignConfigPanelProps) {
  return (
    <PanelSection
      title="Campaign Config"
      subtitle="Targeting, budget, bid strategy, and creative assignments"
      meta={
        <span className="text-ink font-mono tabular-nums text-[13px] font-semibold">
          {formatCurrency(config.total_budget_usd)}
        </span>
      }
    >
      {/* TARGETING */}
      <section>
        <SubBlockHeader>Targeting</SubBlockHeader>
        <dl className="grid grid-cols-1 sm:grid-cols-[110px_1fr] gap-y-3 gap-x-6">
          <dt className="text-[12.5px] text-ink-subtle font-medium uppercase tracking-wider">
            Publishers
          </dt>
          <dd className="text-[14px] text-ink">
            {config.targeting.publishers.join(" · ")}
          </dd>
          <dt className="text-[12.5px] text-ink-subtle font-medium uppercase tracking-wider">
            Personas
          </dt>
          <dd className="text-[14px] text-ink">
            {config.targeting.personas.join(" · ")}
          </dd>
          <dt className="text-[12.5px] text-ink-subtle font-medium uppercase tracking-wider">
            Geos
          </dt>
          <dd className="flex flex-wrap gap-1.5">
            {config.targeting.geos.map((g) => (
              <span
                key={g}
                className="inline-flex items-center rounded-pill bg-canvas border border-line px-2.5 py-0.5 text-[12px] text-ink-muted font-medium"
              >
                {g}
              </span>
            ))}
          </dd>
        </dl>
      </section>

      <HRule />

      {/* BUDGET ALLOCATION */}
      <section>
        <SubBlockHeader>Budget allocation</SubBlockHeader>
        <ul className="space-y-5">
          {config.budget_allocation.map((b, idx) => (
            <li key={b.publisher_id} className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-[14px] font-medium text-ink min-w-0 flex-1 truncate">
                  {b.publisher_name}
                </span>
                <span className="text-[13.5px] font-mono tabular-nums text-ink shrink-0">
                  {formatCurrency(b.amount_usd)}
                </span>
                <span className="text-[12px] font-mono tabular-nums text-ink-subtle w-14 text-right shrink-0">
                  {formatPercent(b.share_pct)}
                </span>
              </div>
              <div className="h-2 bg-line/70 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-brand-gradient rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${b.share_pct}%` }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                    delay: idx * 0.08,
                  }}
                />
              </div>
              <p className="text-[11.5px] text-ink-subtle font-mono leading-snug">
                {b.rationale}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <HRule />

      {/* BID STRATEGY */}
      <section>
        <SubBlockHeader>Bid strategy</SubBlockHeader>
        <div className="flex items-center flex-wrap gap-x-6 gap-y-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] text-ink-subtle uppercase tracking-wider font-medium">
              Type
            </span>
            <span className="inline-flex items-center rounded-pill bg-brand-gradient text-white text-[12px] font-semibold px-2.5 py-1 font-mono tracking-wider">
              {config.bid_strategy.bid_type}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] text-ink-subtle uppercase tracking-wider font-medium">
              Max bid
            </span>
            <span className="text-[14px] font-mono tabular-nums text-ink font-semibold">
              ${config.bid_strategy.max_bid_usd.toFixed(2)}
            </span>
          </div>
        </div>
        <p className="text-[14px] text-ink-muted leading-relaxed max-w-prose">
          {config.bid_strategy.rationale}
        </p>
      </section>

      <HRule />

      {/* CREATIVE ASSIGNMENTS */}
      <section>
        <SubBlockHeader>Creative assignments</SubBlockHeader>
        <div className="rounded-lg overflow-hidden border border-line/70">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="bg-canvas/70">
                <th className="text-left px-4 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-ink-subtle font-semibold">
                  Publisher
                </th>
                <th className="text-left px-4 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-ink-subtle font-semibold">
                  Persona
                </th>
                <th className="text-left px-4 py-2.5 text-[10.5px] uppercase tracking-[0.14em] text-ink-subtle font-semibold">
                  Creative
                </th>
              </tr>
            </thead>
            <tbody>
              {config.creative_assignments.map((a, idx) => (
                <tr
                  key={`${a.publisher_name}-${a.persona_name}`}
                  className={cn(
                    "border-t border-line/60",
                    idx % 2 === 1 && "bg-canvas/40"
                  )}
                >
                  <td className="px-4 py-2.5 text-ink font-medium whitespace-nowrap">
                    {a.publisher_name}
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted whitespace-nowrap">
                    {a.persona_name}
                  </td>
                  <td className="px-4 py-2.5 text-ink truncate max-w-[360px]">
                    {a.creative_headline}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PanelSection>
  );
}
