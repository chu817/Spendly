import { formatScore, getRiskBandColor } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  riskBand: string;
}

export default function ScoreGauge({ score, riskBand }: ScoreGaugeProps) {
  const color = getRiskBandColor(riskBand);
  const pct = Math.min(100, Math.max(0, score));

  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Impulse risk score</h2>
      <div
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Risk score ${formatScore(score)}, ${riskBand}`}
        style={{
          height: 32,
          background: "var(--color-surface)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          border: "1px solid var(--color-border)",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: "var(--radius)",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.9rem" }}>
        <span style={{ color: "var(--color-text-muted)" }}>0</span>
        <span style={{ fontWeight: 600 }}>{formatScore(score)}</span>
        <span
          style={{
            color,
            fontWeight: 600,
          }}
        >
          {riskBand}
        </span>
        <span style={{ color: "var(--color-text-muted)" }}>100</span>
      </div>
    </div>
  );
}
