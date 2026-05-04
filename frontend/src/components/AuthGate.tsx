import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { Lock } from "lucide-react";
import { clearAuth, getAuthHeader, hasAuth, setAuth } from "../lib/auth";
import { Wordmark } from "./Wordmark";
import { cn } from "../lib/utils";

interface AuthGateProps {
  children: ReactNode;
}

type SubmitState = "idle" | "checking" | "error";
type GateState = "verifying" | "needs_login" | "authed";

/**
 * Single-credential gate.
 * - On mount, if creds exist in localStorage, validates them against /auth/check.
 *   Bogus or stale stored creds are wiped and the login form shown.
 * - On submit, validates the typed creds against /auth/check BEFORE persisting.
 * - On a 401 from /campaign later in the session, sseFetch clears localStorage
 *   and reloads, which brings the user back here.
 */
export function AuthGate({ children }: AuthGateProps) {
  const [gateState, setGateState] = useState<GateState>(() =>
    hasAuth() ? "verifying" : "needs_login",
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Validate any pre-existing localStorage creds. Bogus = clear + show login.
  useEffect(() => {
    if (gateState !== "verifying") return;
    const auth = getAuthHeader();
    if (!auth) {
      setGateState("needs_login");
      return;
    }
    fetch("/auth/check", { headers: { Authorization: auth } })
      .then((res) => {
        if (res.status === 401) {
          clearAuth();
          setGateState("needs_login");
        } else if (res.ok) {
          setGateState("authed");
        } else {
          // Server reachable but unexpected status — let user proceed; a real
          // 401 from /campaign later will bounce them back to login.
          setGateState("authed");
        }
      })
      .catch(() => {
        // Network blip on initial check — don't bounce a returning user. They'll
        // hit a real 401 on /campaign if creds are actually bad.
        setGateState("authed");
      });
  }, [gateState]);

  if (gateState === "authed") return <>{children}</>;
  if (gateState === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center text-[13px] text-ink-subtle">
        Verifying session…
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const u = username.trim();
    if (!u || !password.trim()) return;
    setSubmitState("checking");
    setErrorMsg("");
    try {
      const res = await fetch("/auth/check", {
        method: "GET",
        headers: { Authorization: `Basic ${btoa(`${u}:${password}`)}` },
      });
      if (res.status === 401) {
        setSubmitState("error");
        setErrorMsg("Username or password didn't match. Try again.");
        return;
      }
      if (!res.ok) {
        setSubmitState("error");
        setErrorMsg(`Couldn't verify credentials (HTTP ${res.status}).`);
        return;
      }
      setAuth(u, password);
      setGateState("authed");
    } catch {
      setSubmitState("error");
      setErrorMsg("Couldn't reach the server. Check your connection and retry.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px]"
      >
        <div className="flex justify-center mb-10">
          <Wordmark />
        </div>

        <div className="bg-canvas-raised border border-line/70 rounded-card px-7 py-8">
          <header className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-full bg-canvas border border-line/70 text-ink-muted shrink-0">
              <Lock className="w-3.5 h-3.5" strokeWidth={2.25} />
            </span>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
                Restricted demo
              </p>
              <h1 className="mt-1 text-[20px] font-bold tracking-[-0.015em] text-ink leading-snug">
                Sign in to continue.
              </h1>
            </div>
          </header>

          <p className="mt-3 ml-11 text-[13.5px] text-ink-muted leading-relaxed">
            Use the credentials in the submission email. We gate the demo so the
            LLM budget stays for the reviewer.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
                Username
              </span>
              <input
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (submitState === "error") setSubmitState("idle");
                }}
                disabled={submitState === "checking"}
                className={cn(
                  "w-full rounded-pill border bg-canvas px-4 py-2.5",
                  "text-[14px] text-ink placeholder:text-ink-subtle/60",
                  "outline-none focus:border-ink/30 focus:shadow-input-focus transition-all",
                  submitState === "error" ? "border-[#E5A87E]" : "border-line",
                  submitState === "checking" && "opacity-60 cursor-wait",
                )}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
                Password
              </span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (submitState === "error") setSubmitState("idle");
                }}
                disabled={submitState === "checking"}
                className={cn(
                  "w-full rounded-pill border bg-canvas px-4 py-2.5",
                  "text-[14px] text-ink placeholder:text-ink-subtle/60",
                  "outline-none focus:border-ink/30 focus:shadow-input-focus transition-all",
                  submitState === "error" ? "border-[#E5A87E]" : "border-line",
                  submitState === "checking" && "opacity-60 cursor-wait",
                )}
              />
            </label>

            {submitState === "error" && errorMsg && (
              <p className="text-[12.5px] text-[#B8531A] leading-snug" role="alert">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={
                !username.trim() || !password.trim() || submitState === "checking"
              }
              className={cn(
                "mt-2 inline-flex items-center justify-center rounded-pill px-5 py-2.5",
                "text-[13.5px] font-semibold text-white shadow-brand bg-brand-gradient",
                "hover:shadow-brand-strong transition-shadow duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
              )}
            >
              {submitState === "checking" ? "Checking..." : "Continue"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-[12px] text-ink-subtle text-center leading-relaxed">
          Credentials are stored locally in your browser. Clear site data to
          sign out.
        </p>
      </motion.div>
    </div>
  );
}
