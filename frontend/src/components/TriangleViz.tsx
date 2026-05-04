import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import type { UIStageState } from "../types";
import type { Phase } from "../hooks/useCampaignStream";

interface TriangleVizProps {
  phase: Phase;
  stages: UIStageState[];
}

// Geometry — all coordinates in a 320x320 viewBox.
// Slight isoceles tilt: Advertiser at top center, Pub bottom-left, Persona bottom-right.
const ADV = { x: 160, y: 56 };
const PUB = { x: 56, y: 248 };
const PER = { x: 264, y: 248 };
const NODE_R = 12;

function findStage(stages: UIStageState[], id: string) {
  return stages.find((s) => s.stage_id === id);
}

export function TriangleViz({ phase, stages }: TriangleVizProps) {
  const extract = findStage(stages, "extract_brief");
  const pubFit = findStage(stages, "adv_pub_fit");
  const personaFit = findStage(stages, "adv_persona_fit");
  const combine = findStage(stages, "combine");
  const creative = findStage(stages, "creative_writing");
  const config = findStage(stages, "campaign_config");

  // Node states
  const advLit = extract?.status === "complete";
  const advRunning = extract?.status === "running";

  const pubLit = pubFit?.status === "complete";
  const perLit = personaFit?.status === "complete";

  // Edge states
  // adv-pub edge
  const advPubRunning = pubFit?.status === "running";
  const advPubLit = pubFit?.status === "complete";
  // adv-persona edge
  const advPerRunning = personaFit?.status === "running";
  const advPerLit = personaFit?.status === "complete";
  // pub-persona edge: dim baseline before combine, full after
  const pubPerLit = combine?.status === "complete";

  const creativeRunning = creative?.status === "running";
  const configDone = config?.status === "complete";

  return (
    <section className="flex flex-col items-center">
      <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-subtle mb-5 self-start">
        ARCHITECTURE
      </h2>

      <div className="relative w-full max-w-[320px] aspect-square">
        <svg viewBox="0 0 320 320" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7B5CFF" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="brandGradV" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7B5CFF" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>

          {/* EDGES — render under nodes */}
          <Edge
            from={ADV}
            to={PUB}
            running={advPubRunning}
            lit={advPubLit}
            dim={false}
          />
          <Edge
            from={ADV}
            to={PER}
            running={advPerRunning}
            lit={advPerLit}
            dim={false}
          />
          <Edge
            from={PUB}
            to={PER}
            running={false}
            lit={pubPerLit}
            // The bottom edge is the "precomputed" baseline — visible before any work runs.
            dim={!pubPerLit}
          />

          {/* NODES */}
          <Node center={ADV} lit={advLit} pulse={advRunning} />
          <Node center={PUB} lit={pubLit} pulse={pubFit?.status === "running"} />
          <Node center={PER} lit={perLit} pulse={personaFit?.status === "running"} />

          {/* LABELS */}
          <NodeLabel center={ADV} above text="advertiser" />
          <NodeLabel center={PUB} text="publisher" />
          <NodeLabel center={PER} text="persona" />
        </svg>

        {/* Below-the-triangle status line */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            {creativeRunning && !configDone && (
              <motion.div
                key="creative"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="text-[12px] text-ink-muted font-medium tracking-tight inline-flex items-center gap-2"
              >
                writing creatives
                <PulsingDot />
              </motion.div>
            )}

            {configDone && phase === "complete" && (
              <motion.div
                key="assembled"
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink rounded-pill bg-canvas-raised border border-line px-3 py-1.5 shadow-card"
              >
                <span className="inline-flex w-3.5 h-3.5 rounded-full bg-brand-gradient items-center justify-center">
                  <Check className="w-2 h-2 text-white" strokeWidth={3.5} />
                </span>
                campaign assembled
              </motion.div>
            )}

            {phase === "needs_clarification" && (
              <motion.div
                key="needs"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="text-[12px] text-ink-muted font-medium tracking-tight"
              >
                awaiting clarification
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function Edge({
  from,
  to,
  running,
  lit,
  dim,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  running: boolean;
  lit: boolean;
  dim: boolean;
}) {
  const length = Math.hypot(to.x - from.x, to.y - from.y);

  // Base line — always rendered.
  // - dim: low-opacity gradient (precomputed baseline)
  // - lit: full gradient
  // - otherwise: light gray (waiting)
  const baseStroke =
    lit ? "url(#brandGrad)" : dim ? "url(#brandGrad)" : "#E6E8EC";
  const baseOpacity = lit ? 1 : dim ? 0.32 : 1;

  return (
    <g>
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={baseStroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        animate={{ strokeOpacity: baseOpacity }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Running overlay — a short bright dash that travels along the line */}
      {running && (
        <motion.line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="url(#brandGrad)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={`${length * 0.15} ${length * 0.85}`}
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset: -length }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
      )}
    </g>
  );
}

function Node({
  center,
  lit,
  pulse,
}: {
  center: { x: number; y: number };
  lit: boolean;
  pulse: boolean;
}) {
  return (
    <g>
      {/* Pulse ring (only while running) */}
      {pulse && (
        <motion.circle
          cx={center.x}
          cy={center.y}
          r={NODE_R}
          fill="none"
          stroke="url(#brandGrad)"
          strokeWidth={1.5}
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          style={{ transformOrigin: `${center.x}px ${center.y}px` }}
        />
      )}

      {/* Outer ring */}
      <circle
        cx={center.x}
        cy={center.y}
        r={NODE_R}
        fill="white"
        stroke={lit ? "url(#brandGrad)" : "#E6E8EC"}
        strokeWidth={1.5}
      />

      {/* Inner fill — animates from gray to gradient when lit */}
      <motion.circle
        cx={center.x}
        cy={center.y}
        r={NODE_R - 4}
        animate={{ opacity: lit ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        fill="url(#brandGrad)"
      />
      {/* Inactive inner dot */}
      <motion.circle
        cx={center.x}
        cy={center.y}
        r={3}
        animate={{ opacity: lit ? 0 : 1 }}
        transition={{ duration: 0.4 }}
        fill="#C7CAD1"
      />
    </g>
  );
}

function NodeLabel({
  center,
  text,
  above,
}: {
  center: { x: number; y: number };
  text: string;
  above?: boolean;
}) {
  const offset = above ? -22 : 28;
  return (
    <text
      x={center.x}
      y={center.y + offset}
      textAnchor="middle"
      className="fill-ink"
      style={{
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.02em",
      }}
    >
      {text}
    </text>
  );
}

function PulsingDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full rounded-full bg-brand-purple opacity-75 animate-ping" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-purple" />
    </span>
  );
}
