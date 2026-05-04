/**
 * The single custom branding moment.
 * "compose" in heavy Inter, with a thin gradient arc connecting the two o's
 * beneath the baseline — like a brace tying them together.
 *
 * Sized for the top bar (~22px). For larger placements, scale via CSS transform
 * rather than re-tuning SVG coordinates.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`relative inline-block select-none leading-none ${className}`}>
      <span
        className="font-extrabold text-[22px] text-ink"
        style={{ letterSpacing: "-0.025em" }}
      >
        compose
      </span>
      {/* Gradient arc connector — spans from beneath the first o to beneath the second o. */}
      <svg
        aria-hidden
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
        className="absolute pointer-events-none"
        style={{
          left: "18%",
          width: "47%",
          bottom: "-6px",
          height: "8px",
        }}
      >
        <defs>
          <linearGradient id="wordmark-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7B5CFF" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <path
          d="M 2 2 Q 50 9 98 2"
          stroke="url(#wordmark-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
