import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TopBar } from "./components/TopBar";
import { Hero } from "./components/Hero";
import { BriefInput } from "./components/BriefInput";
import { PrimaryButton } from "./components/PrimaryButton";
import { ExampleChips } from "./components/ExampleChips";
import { BriefCard } from "./components/BriefCard";
import { StreamingView } from "./components/StreamingView";
import { ResultsView } from "./components/result/ResultsView";
import { ClarifyPanel } from "./components/clarify/ClarifyPanel";
import { ErrorPanel } from "./components/ErrorPanel";
import { useCampaignStream } from "./hooks/useCampaignStream";
import "./App.css";

type View = "form" | "streaming";

function App() {
  const [view, setView] = useState<View>("form");
  const [brief, setBrief] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const briefIsEmpty = brief.trim().length === 0;

  const { state, start, reset } = useCampaignStream();

  function handlePickExample(text: string) {
    setBrief(text);
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      const end = ta.value.length;
      ta.setSelectionRange(end, end);
    });
  }

  function handleGenerate() {
    if (briefIsEmpty) return;
    setView("streaming");
    start(brief);
  }

  function handleEdit() {
    reset();
    setView("form");
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }

  function handleReset() {
    reset();
    setView("form");
    // Keep brief in textarea so the user can iterate on it.
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      // Scroll to top.
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function handleResubmit(augmented: string) {
    setBrief(augmented);
    reset();
    // Defer start so the reset state flushes first.
    requestAnimationFrame(() => {
      start(augmented);
    });
  }

  function handleRetry() {
    reset();
    requestAnimationFrame(() => {
      start(brief);
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />

      <main className="flex-1 px-6 pb-24 pt-10 sm:pt-14">
        <AnimatePresence mode="wait">
          {view === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[640px] mx-auto flex flex-col items-center"
            >
              <Hero />

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full mt-12"
              >
                <BriefInput ref={textareaRef} value={brief} onChange={setBrief} />

                <div className="mt-7 flex justify-center">
                  <PrimaryButton disabled={briefIsEmpty} onClick={handleGenerate} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="mt-12 w-full"
              >
                <ExampleChips onPick={handlePickExample} dimmed={!briefIsEmpty} />
              </motion.div>
            </motion.div>
          )}

          {view === "streaming" && (
            <motion.div
              key="streaming"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[920px] mx-auto flex flex-col gap-5"
            >
              <BriefCard brief={brief} onEdit={handleEdit} />
              <StreamingView state={state} />

              {state.phase === "complete" && (
                <ResultsView state={state} onReset={handleReset} />
              )}

              {state.phase === "needs_clarification" &&
                state.doneData &&
                state.doneData.status === "needs_clarification" && (
                  <ClarifyPanel
                    brief={brief}
                    questions={state.doneData.clarifying_questions}
                    onResubmit={handleResubmit}
                  />
                )}

              {state.phase === "error" && (
                <ErrorPanel
                  message={state.error ?? "Unknown error"}
                  onRetry={handleRetry}
                  onEdit={handleEdit}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
