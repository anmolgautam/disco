import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number): string {
  return score.toFixed(2);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatCurrency(usd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(usd);
}

export function formatPercent(pct: number): string {
  return `${pct.toFixed(1)}%`;
}

export function formatImpressions(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

// Pill color picker: maps a score 0-1 to one of the brand pill palettes.
export function scoreToPill(score: number): "green" | "blue" | "purple" | "peach" | "gray" {
  if (score >= 0.7) return "green";
  if (score >= 0.5) return "blue";
  if (score >= 0.3) return "purple";
  if (score >= 0.15) return "peach";
  return "gray";
}
