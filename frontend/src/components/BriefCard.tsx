import { Pencil } from "lucide-react";

interface BriefCardProps {
  brief: string;
  onEdit: () => void;
}

const MAX_PREVIEW = 110;

function truncate(s: string) {
  if (s.length <= MAX_PREVIEW) return s;
  return s.slice(0, MAX_PREVIEW).trimEnd() + "…";
}

export function BriefCard({ brief, onEdit }: BriefCardProps) {
  return (
    <div className="w-full bg-canvas-raised border border-line/80 rounded-card px-5 py-3.5 flex items-center gap-4">
      <span
        aria-hidden
        className="inline-flex shrink-0 w-1.5 h-1.5 rounded-full bg-brand-gradient"
      />
      <p className="flex-1 min-w-0 text-[14.5px] leading-snug text-ink truncate">
        {truncate(brief)}
      </p>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink transition-colors duration-150"
      >
        <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
        Edit & re-submit
      </button>
    </div>
  );
}
