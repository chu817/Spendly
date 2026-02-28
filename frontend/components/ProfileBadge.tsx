import type { BehaviorProfile } from "@/lib/types";

interface ProfileBadgeProps {
  profile: BehaviorProfile;
}

export default function ProfileBadge({ profile }: ProfileBadgeProps) {
  return (
    <div>
      <h2 className="panelTitle" style={{ marginBottom: 12 }}>
        Spending behaviour profile
      </h2>
      <div
        style={{
          padding: "1.25rem",
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          transition: "border-color 0.2s",
        }}
      >
        <span
          className="statusBadge statusBadgeMedium"
          style={{ marginBottom: "0.75rem", display: "inline-block" }}
        >
          {profile.profile_label}
        </span>
        <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
          {profile.interpretation}
        </p>
      </div>
    </div>
  );
}
