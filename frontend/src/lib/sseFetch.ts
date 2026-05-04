// Minimal SSE-over-fetch consumer.
// Native EventSource only supports GET, but the backend takes a JSON body, so
// we POST and parse `event:` / `data:` frames out of the streamed response.

import type { DoneEvent, StageEvent } from "../types";
import { clearAuth, getAuthHeader } from "./auth";

export type ServerEvent =
  | { event: "stage"; data: StageEvent }
  | { event: "done"; data: DoneEvent }
  | { event: "error"; data: { message: string } };

export async function* campaignSSE(
  brief: string,
  signal?: AbortSignal
): AsyncGenerator<ServerEvent, void, void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  const auth = getAuthHeader();
  if (auth) headers.Authorization = auth;

  const res = await fetch("/campaign", {
    method: "POST",
    headers,
    body: JSON.stringify({ brief }),
    signal,
  });

  if (res.status === 401) {
    // Stale or wrong credentials. Clear and prompt the AuthGate again.
    clearAuth();
    window.location.reload();
    throw new Error("Unauthorized — please sign in again.");
  }

  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const j = await res.json();
      if (j?.message) detail = j.message;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    // Normalize CRLF → LF so the same logic works for sse-starlette (CRLF)
    // and the mock generator (LF).
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

    // SSE frames are separated by a blank line (\n\n).
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const parsed = parseFrame(frame);
      if (parsed) yield parsed;
    }
  }

  // Flush any final frame without trailing blank line.
  const tail = buffer.trim();
  if (tail) {
    const parsed = parseFrame(tail);
    if (parsed) yield parsed;
  }
}

function parseFrame(frame: string): ServerEvent | null {
  let event: string | null = null;
  const dataLines: string[] = [];
  for (const rawLine of frame.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (line.startsWith(":")) continue; // comment / heartbeat ping
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^ /, ""));
  }
  if (!event || dataLines.length === 0) return null;

  let data: unknown;
  try {
    data = JSON.parse(dataLines.join("\n"));
  } catch {
    return null;
  }

  if (event === "stage" || event === "done" || event === "error") {
    return { event, data } as ServerEvent;
  }
  return null;
}
