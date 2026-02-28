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
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Personalized nudges</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Loading nudges…</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Personalized nudges</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {nudges.map((n, i) => (
          <article
            key={i}
            style={{
              padding: "1rem",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
            }}
          >
            <h3 style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>{n.title}</h3>
            <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>
              {n.message}
            </p>
            <p style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              <strong>Why:</strong> {n.why_this}
            </p>
            <p style={{ fontSize: "0.85rem" }}>
              <strong>Action:</strong> {n.action_step}
            </p>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              Confidence: {Math.round(n.confidence * 100)}%
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}
