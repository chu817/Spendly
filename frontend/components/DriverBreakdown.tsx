import type { ScoreBreakdown } from "@/lib/types";

interface DriverBreakdownProps {
  breakdown: ScoreBreakdown;
  topDrivers: string[];
}

export default function DriverBreakdown({ breakdown, topDrivers }: DriverBreakdownProps) {
  const entries = breakdown
    ? Object.entries(breakdown).filter(([, v]) => typeof v === "number")
    : [];
  const labels: Record<string, string> = {
    spike: "Spending spikes",
    burst: "Burst buying",
    eom: "End-of-month surge",
    timing: "Timing triggers",
    category: "Category concentration",
  };

  return (
    <div>
      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Score breakdown & top drivers</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
        {topDrivers.map((d) => (
          <span
            key={d}
            style={{
              padding: "0.25rem 0.5rem",
              background: "var(--color-border)",
              borderRadius: "var(--radius)",
              fontSize: "0.85rem",
            }}
          >
            {d}
          </span>
        ))}
      </div>
      <ul style={{ listStyle: "none" }}>
        {entries.map(([key, value]) => (
          <li key={key} style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}>
            <span style={{ color: "var(--color-text-muted)" }}>{labels[key] ?? key}: </span>
            <span>{Math.round((Number(value) as number) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
