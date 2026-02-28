import type { BehaviorProfile } from "@/lib/types";

interface ProfileBadgeProps {
  profile: BehaviorProfile;
}

export default function ProfileBadge({ profile }: ProfileBadgeProps) {
  return (
    <div>
      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Spending behaviour profile</h2>
      <div
        style={{
          padding: "1rem",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius)",
        }}
      >
        <span
          style={{
            display: "inline-block",
            padding: "0.25rem 0.5rem",
            background: "var(--color-border)",
            borderRadius: "var(--radius)",
            fontSize: "0.9rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
          }}
        >
          {profile.profile_label}
        </span>
        <p style={{ marginTop: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
          {profile.interpretation}
        </p>
      </div>
    </div>
  );
}
