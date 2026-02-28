import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { getUsers } from "@/lib/api";
import { formatDateRange } from "@/lib/utils";

interface UserSelectorProps {
  onSelect?: (cardId: string) => void;
}

interface UserItem {
  card_id: string;
  tx_count?: number;
  date_range?: [string, string];
}

type TxCountFilter = "all" | "low" | "medium" | "high";

function getTxCountBand(
  txCount: number,
  p33: number,
  p66: number
): "low" | "medium" | "high" {
  if (txCount <= p33) return "low";
  if (txCount <= p66) return "medium";
  return "high";
}

export default function UserSelector({ onSelect: onSelectProp }: UserSelectorProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [displayUsers, setDisplayUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [txCountFilter, setTxCountFilter] = useState<TxCountFilter>("all");

  useEffect(() => {
    getUsers().then((res) => {
      if (res.error) {
        setError(res.error.message);
        setUsers([]);
        setDisplayUsers([]);
      } else if (res.data?.users) {
        const all = res.data.users;
        setUsers(all);
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

  const { p33, p66 } = useMemo(() => {
    const counts = users
      .map((u) => u.tx_count ?? 0)
      .filter((c) => c > 0)
      .sort((a, b) => a - b);
    if (counts.length === 0) return { p33: 0, p66: 0 };
    const i33 = Math.floor(counts.length * 0.33);
    const i66 = Math.floor(counts.length * 0.66);
    return {
      p33: counts[i33] ?? 0,
      p66: counts[i66] ?? 0,
    };
  }, [users]);

  const filtered = useMemo(() => {
    let result = search
      ? users.filter((u) =>
          u.card_id.toLowerCase().includes(search.toLowerCase())
        )
      : displayUsers;

    if (txCountFilter !== "all") {
      result = result.filter((u) => {
        const count = u.tx_count ?? 0;
        const band = getTxCountBand(count, p33, p66);
        return band === txCountFilter;
      });
    }

    return result;
  }, [search, users, displayUsers, txCountFilter, p33, p66]);

  const handleResetFilters = () => {
    setSearch("");
    setTxCountFilter("all");
  };

  if (loading) {
    return (
      <div className="dataTableCard" style={{ padding: 24 }}>
        <p style={{ color: "var(--color-text-muted)" }}>Loading users…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="dataTableCard" style={{ padding: 24 }}>
        <p style={{ color: "var(--color-risk-critical)", fontSize: "0.9rem" }} role="alert">
          {error === "Not found" || error === "Not Found"
            ? "Backend or dataset not available. Ensure the Flask server is running and the dataset has loaded."
            : error}
        </p>
      </div>
    );
  }
  if (users.length === 0) {
    return (
      <div className="dataTableCard" style={{ padding: 24 }}>
        <p style={{ color: "var(--color-text-muted)" }}>No users in this dataset.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="searchFilterBar">
        <div className="searchBar">
          <span style={{ color: "var(--color-text-muted)" }} aria-hidden>⌕</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by card ID..."
            aria-label="Search users by card ID"
          />
        </div>
        <select
          className="filterSelect"
          disabled
          aria-label="Filter by risk band (placeholder)"
        >
          <option>All Risk Bands</option>
        </select>
        <select
          className="filterSelect"
          disabled
          aria-label="Filter by persona (placeholder)"
        >
          <option>All Personas</option>
        </select>
        <select
          className="filterSelect"
          value={txCountFilter}
          onChange={(e) => setTxCountFilter(e.target.value as TxCountFilter)}
          aria-label="Filter by transaction count"
        >
          <option value="all">All Tx Count</option>
          <option value="low">Low activity</option>
          <option value="medium">Medium activity</option>
          <option value="high">High activity</option>
        </select>
        <button
          type="button"
          className="filterReset"
          onClick={handleResetFilters}
          aria-label="Reset filters"
        >
          <span aria-hidden>↻</span>
          Reset Filters
        </button>
        <p className="muted" style={{ fontSize: 12, width: "100%", margin: 0 }}>
          Dataset loads at startup. Training may take a minute.
        </p>
      </div>

      <div className="dataTableCard">
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          <table className="dataTable">
            <thead>
              <tr>
                <th>Card ID</th>
                <th>Tx Count</th>
                <th>Date Range</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.card_id} className="dataRow">
                  <td>
                    <span style={{ fontWeight: 500 }}>{u.card_id}</span>
                  </td>
                  <td>{u.tx_count != null ? u.tx_count.toLocaleString() : "—"}</td>
                  <td className="muted">
                    {u.date_range
                      ? formatDateRange(u.date_range[0], u.date_range[1])
                      : "—"}
                  </td>
                  <td>
                    <Link
                      href={`/dashboard/${encodeURIComponent(u.card_id)}`}
                      className="btnViewProfile"
                    >
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length > 200 && !search && (
          <p
            className="muted"
            style={{
              fontSize: "0.85rem",
              padding: "12px 16px",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            Showing sample of 200. Use search to find others.
          </p>
        )}
      </div>
    </div>
  );
}
