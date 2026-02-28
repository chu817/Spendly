import { useEffect, useState } from "react";
import { getUsers } from "@/lib/api";
import { formatDateRange } from "@/lib/utils";

interface UserSelectorProps {
  onSelect: (cardId: string) => void;
}

interface UserItem {
  card_id: string;
  tx_count?: number;
  date_range?: [string, string];
}

export default function UserSelector({ onSelect }: UserSelectorProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [displayUsers, setDisplayUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getUsers().then((res) => {
      if (res.error) {
        setError(res.error.message);
        setUsers([]);
        setDisplayUsers([]);
      } else if (res.data?.users) {
        const all = res.data.users;
        setUsers(all);
        // Build a varied sample of up to 200 users:
        // - sort by tx_count
        // - split into low / mid / high bands
        // - randomly sample from each band to balance high / medium / low spenders
        if (all.length <= 200) {
          setDisplayUsers(all);
        } else {
          const sorted = [...all].sort(
            (a, b) => (a.tx_count ?? 0) - (b.tx_count ?? 0)
          );
          const third = Math.floor(sorted.length / 3);
          const low = sorted.slice(0, third);
          const mid = sorted.slice(third, 2 * third);
          const high = sorted.slice(2 * third);

          const pickRandom = (arr: UserItem[], n: number) => {
            const copy = [...arr];
            const out: UserItem[] = [];
            while (copy.length && out.length < n) {
              const idx = Math.floor(Math.random() * copy.length);
              out.push(copy.splice(idx, 1)[0]);
            }
            return out;
          };

          const targetEach = Math.floor(200 / 3);
          let sample: UserItem[] = [
            ...pickRandom(low, targetEach),
            ...pickRandom(mid, targetEach),
            ...pickRandom(high, targetEach),
          ];

          if (sample.length < 200) {
            const inSample = new Set(sample.map((u) => u.card_id));
            const remaining = sorted.filter((u) => !inSample.has(u.card_id));
            sample = [...sample, ...pickRandom(remaining, 200 - sample.length)];
          }

          setDisplayUsers(sample);
        }
      }
      setLoading(false);
    });
  }, []);

  const filtered = search
    ? users.filter((u) => u.card_id.toLowerCase().includes(search.toLowerCase()))
    : displayUsers;

  if (loading) {
    return <p style={{ color: "var(--color-text-muted)" }}>Loading users…</p>;
  }
  if (error) {
    return <p style={{ color: "var(--color-risk-critical)" }} role="alert">{error}</p>;
  }
  if (users.length === 0) {
    return <p style={{ color: "var(--color-text-muted)" }}>No users in this dataset.</p>;
  }

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label htmlFor="user-search" style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
        Search by card ID
      </label>
      <input
        id="user-search"
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="e.g. C_ID_..."
        aria-label="Search users by card ID"
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "0.5rem 0.75rem",
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius)",
          color: "inherit",
          marginBottom: "0.75rem",
        }}
      />
      <ul style={{ listStyle: "none" }}>
        {filtered.map((u) => (
          <li key={u.card_id} style={{ marginBottom: "0.5rem" }}>
            <button
              type="button"
              onClick={() => onSelect(u.card_id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "0.6rem 0.75rem",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius)",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              <span style={{ fontWeight: 500 }}>{u.card_id}</span>
              {u.tx_count != null && (
                <span style={{ marginLeft: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                  {u.tx_count} tx
                  {u.date_range && ` · ${formatDateRange(u.date_range[0], u.date_range[1])}`}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {users.length > 200 && !search && (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>Showing first 200. Use search to find others.</p>
      )}
    </div>
  );
}
