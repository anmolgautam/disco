import { useCallback, useRef, useState } from "react";
import {
  STAGES_DEFINITION,
  type DoneEvent,
  type StageEvent,
  type UIStageState,
} from "../types";
import { mockCampaignStream, mockClarifyingStream } from "../lib/mockStream";
import { campaignSSE, type ServerEvent } from "../lib/sseFetch";

export type Phase =
  | "idle"
  | "streaming"
  | "complete"
  | "needs_clarification"
  | "error";

export interface CampaignStreamState {
  phase: Phase;
  stages: UIStageState[];
  doneData?: DoneEvent;
  error?: string;
}

const initialStages = (): UIStageState[] =>
  STAGES_DEFINITION.map((s) => ({
    stage_id: s.stage_id,
    name: s.name,
    status: "waiting" as const,
  }));

const INITIAL_STATE: CampaignStreamState = {
  phase: "idle",
  stages: initialStages(),
};

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export function useCampaignStream() {
  const [state, setState] = useState<CampaignStreamState>(INITIAL_STATE);

  // Track an "abort" generation so a re-run cancels the previous in-flight loop.
  const generationRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    generationRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setState({ ...INITIAL_STATE, stages: initialStages() });
  }, []);

  const start = useCallback((brief: string) => {
    generationRef.current += 1;
    const myGeneration = generationRef.current;

    // Cancel any in-flight stream from a previous start().
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({
      phase: "streaming",
      stages: initialStages(),
    });

    const stream = USE_MOCK
      ? mockStreamFor(brief)
      : campaignSSE(brief, controller.signal);

    (async () => {
      try {
        for await (const evt of stream) {
          if (generationRef.current !== myGeneration) return; // cancelled
          applyEvent(setState, evt);
        }
      } catch (err) {
        if (generationRef.current !== myGeneration) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : String(err);
        setState((prev) => ({
          ...prev,
          phase: "error",
          error: message,
          // Halt any in-flight running stage so the spinner stops.
          stages: prev.stages.map((s) =>
            s.status === "running" ? { ...s, status: "error", error: message } : s
          ),
        }));
      }
    })();
  }, []);

  return { state, start, reset } as const;
}

// ---------------------------------------------------------------------------
// Mock fallback (preserves the dev-without-backend workflow behind VITE_USE_MOCK)

function mockStreamFor(brief: string) {
  const lowConfidence =
    brief.trim().length < 32 ||
    /^(idk|i don'?t know|just try|we help people|new thing for moms)/i.test(
      brief.trim()
    );
  return lowConfidence ? mockClarifyingStream(brief) : mockCampaignStream(brief);
}

// ---------------------------------------------------------------------------

function applyEvent(
  setState: React.Dispatch<React.SetStateAction<CampaignStreamState>>,
  evt: ServerEvent | { event: "stage"; data: StageEvent } | { event: "done"; data: DoneEvent }
) {
  if (evt.event === "stage") {
    const incoming = evt.data;
    setState((prev) => ({
      ...prev,
      stages: prev.stages.map((s) =>
        s.stage_id === incoming.stage_id
          ? {
              ...s,
              status: incoming.status,
              duration_ms: incoming.duration_ms,
              payload: incoming.payload,
              error: incoming.error,
            }
          : s
      ),
    }));
    return;
  }

  if (evt.event === "error") {
    const message = evt.data.message;
    setState((prev) => ({
      ...prev,
      phase: "error",
      error: message,
      stages: prev.stages.map((s) =>
        s.status === "running" ? { ...s, status: "error", error: message } : s
      ),
    }));
    return;
  }

  // done event
  setState((prev) => ({
    ...prev,
    phase:
      evt.data.status === "needs_clarification" ? "needs_clarification" : "complete",
    doneData: evt.data,
  }));
}
