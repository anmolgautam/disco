import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface ClarifyPanelProps {
  brief: string;
  questions: string[];
  onResubmit: (augmentedBrief: string) => void;
}

export function ClarifyPanel({ brief, questions, onResubmit }: ClarifyPanelProps) {
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ""));

  const hasAnyAnswer = useMemo(
    () => answers.some((a) => a.trim().length > 0),
    [answers]
  );

  function updateAnswer(idx: number, value: string) {
    setAnswers((prev) => prev.map((a, i) => (i === idx ? value : a)));
  }

  function handleSubmit() {
    if (!hasAnyAnswer) return;
    const additions = answers
      .map((a) => a.trim())
      .filter(Boolean)
      .join(". ");
    const augmented = `${brief.trimEnd()}. ${additions}`;
    onResubmit(augmented);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="bg-canvas-raised border border-line/70 rounded-card px-7 py-7 sm:px-9 sm:py-9"
    >
      <header>
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
          Clarify
        </span>
        <h2 className="mt-1 text-[26px] sm:text-[30px] font-extrabold tracking-[-0.022em] text-ink leading-[1.1]">
          A few <span className="text-gradient-brand">more details</span> would help.
        </h2>
        <p className="mt-3 text-[15px] text-ink-muted leading-relaxed max-w-prose">
          Your brief is honest but light on signal — answer the questions below and
          we'll build the full campaign.
        </p>
      </header>

      <div className="mt-6 mb-7 border-t border-line/70" />

      <ol className="space-y-7">
        {questions.map((q, i) => (
          <li key={i} className="space-y-2.5">
            <label
              htmlFor={`clarify-q-${i}`}
              className="block text-[15px] font-semibold text-ink leading-snug"
            >
              <span className="text-ink-subtle font-mono mr-2">{i + 1}.</span>
              {q}
            </label>
            <ClarifyTextarea
              id={`clarify-q-${i}`}
              value={answers[i]}
              onChange={(v) => updateAnswer(i, v)}
            />
          </li>
        ))}
      </ol>

      <div className="mt-9 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-[12.5px] text-ink-subtle">
          Skip any you don't have a clear answer for — we'll work with what you give us.
        </p>
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={!hasAnyAnswer}
          whileTap={hasAnyAnswer ? { scale: 0.97 } : undefined}
          whileHover={hasAnyAnswer ? "hover" : undefined}
          className={cn(
            "group inline-flex items-center gap-2 rounded-pill px-6 py-3 text-[14px] font-semibold transition-shadow duration-200",
            hasAnyAnswer
              ? "bg-brand-gradient text-white shadow-brand hover:shadow-brand-strong cursor-pointer"
              : "bg-line text-ink-subtle cursor-not-allowed"
          )}
        >
          Add details and re-submit
          <motion.span
            variants={{ hover: { x: 3 } }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="inline-flex"
          >
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </motion.span>
        </motion.button>
      </div>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------

function ClarifyTextarea({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className={cn(
        "rounded-[14px] p-[1.5px] transition-shadow duration-200",
        focused ? "bg-brand-gradient shadow-input-focus" : "bg-line"
      )}
    >
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        spellCheck={false}
        rows={3}
        className="block w-full bg-canvas-raised rounded-[12.5px] px-4 py-3 text-[14.5px] leading-relaxed text-ink resize-none focus:outline-none placeholder-ink-subtle/70"
        placeholder="Type your answer…"
      />
    </div>
  );
}
