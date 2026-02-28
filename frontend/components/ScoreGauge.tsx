import { formatScore, getRiskBandColor } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  riskBand: string;
}

export default function ScoreGauge({ score, riskBand }: ScoreGaugeProps) {
  const color = getRiskBandColor(riskBand);
  const pct = Math.min(100, Math.max(0, score));

  return (
    <div>
      <h2 className="panelTitle" style={{ marginBottom: 12 }}>
        Impulse risk score
      </h2>
      <div
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Risk score ${formatScore(score)}, ${riskBand}`}
        style={{
          height: 40,
          background: "var(--color-bg)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          border: "1px solid var(--color-border)",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: "var(--radius-lg)",
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
          fontSize: 14,
        }}
      >
        <span className="muted">0</span>
        <span style={{ fontWeight: 700, fontSize: 24, letterSpacing: "-0.02em" }}>
          {formatScore(score)}
        </span>
        <span
          style={{
            color,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 999,
            background: `${color}22`,
            fontSize: 13,
          }}
        >
          {riskBand}
        </span>
        <span className="muted">100</span>
      </div>
    </div>
  );
}
