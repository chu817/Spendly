interface Nudge {
  title: string;
  message: string;
  why_this: string;
  action_step: string;
  confidence: number;
}

interface NudgeCardsProps {
  nudges: Nudge[];
}

export default function NudgeCards({ nudges }: NudgeCardsProps) {
  if (!nudges || nudges.length === 0) {
    return (
      <div>
        <h2 className="panelTitle" style={{ marginBottom: 12 }}>
          Personalized nudges
        </h2>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          Loading nudges…
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="panelTitle" style={{ marginBottom: 12 }}>
        Personalized nudges
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {nudges.map((n, i) => (
          <article
            key={i}
            className="nudgeCard"
            style={{
              padding: "1.25rem",
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          >
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem", fontWeight: 600 }}>
              {n.title}
            </h3>
            <p style={{ fontSize: "0.9rem", marginBottom: "0.75rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
              {n.message}
            </p>
            <p style={{ fontSize: "0.85rem", marginBottom: "0.35rem" }}>
              <strong>Why:</strong> {n.why_this}
            </p>
            <p style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              <strong>Action:</strong> {n.action_step}
            </p>
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--color-text-muted)",
                padding: "4px 8px",
                background: "var(--color-surface)",
                borderRadius: "var(--radius)",
              }}
            >
              Confidence: {Math.round(n.confidence * 100)}%
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}
