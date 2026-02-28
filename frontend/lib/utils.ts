/** Formatters and UI helpers for risk bands and display */

export type RiskBand = "Low" | "Medium" | "High" | "Critical";

export function formatRiskBand(band: string): string {
  return band || "Unknown";
}

export function getRiskBandColor(band: string): string {
  switch (band) {
    case "Low":
      return "var(--color-risk-low)";
    case "Medium":
      return "var(--color-risk-medium)";
    case "High":
      return "var(--color-risk-high)";
    case "Critical":
      return "var(--color-risk-critical)";
    default:
      return "var(--color-text-muted)";
  }
}

export function formatScore(n: number): string {
  return Number.isFinite(n) ? Math.round(n).toString() : "—";
}

export function formatDateRange(start: string, end: string): string {
  if (!start || !end) return "—";
  return `${start} – ${end}`;
}
