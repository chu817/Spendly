import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getDefaultDataset } from "@/lib/api";
import type { GlobalInsights } from "@/lib/types";
import UserSelector from "@/components/UserSelector";

export default function DashboardPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ rows: number; users: number; dateRange: [string, string] } | null>(null);
  const [status, setStatus] = useState<"loading" | "training" | "ready" | "error">("loading");
  const [insights, setInsights] = useState<GlobalInsights | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const res = await getDefaultDataset();
      if (cancelled) return;
      if (res.error) {
        setStatus("error");
        setError(res.error.message);
        return;
      }
      const data = res.data;
      if (!data) return;
      if (data.status && data.status !== "ready") {
        setStatus(data.status as any);
        setTimeout(tick, 1500);
        return;
      }
      setStatus("ready");
      setSummary({ rows: data.rows, users: data.users, dateRange: data.date_range });
      if (data.global_insights) setInsights(data.global_insights);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelect = (cardId: string) => {
    router.push(`/dashboard/${encodeURIComponent(cardId)}`);
  };

  return (
    <>
      <Head>
        <title>Dashboard – Impulse Finance</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <main className="appShell">
        <header className="appHeader">
          <div>
            <h1 className="appTitle">Spendly</h1>
            <p className="appSubtitle">Impulse behaviour insights from transaction patterns (not a diagnosis).</p>
          </div>
          <div className="pill">Dataset: Elo historical_transactions.csv</div>
        </header>

        <div className="appGrid">
          <aside className="card panel">
            <h2 className="panelTitle">Select a user</h2>
            {summary && (
              <p className="muted" style={{ marginBottom: "0.75rem" }}>
                {summary.users.toLocaleString()} users · {summary.rows.toLocaleString()} rows · {summary.dateRange[0]} – {summary.dateRange[1]}
              </p>
            )}
            {status !== "ready" && !error && (
              <p className="muted" style={{ marginBottom: "0.75rem" }}>
                Preparing model… {status === "training" ? "training features" : "loading dataset"}
              </p>
            )}
            {error && (
              <p style={{ color: "var(--color-risk-critical)", marginBottom: "0.75rem" }} role="alert">
                {error}
              </p>
            )}
            {status === "ready" ? <UserSelector onSelect={handleSelect} /> : null}
          </aside>

          <section className="card panel">
            <h2 className="panelTitle">Overview</h2>
            {insights ? (
              <>
                <p className="muted" style={{ marginBottom: "0.75rem" }}>
                  Average impulse score <strong>{Math.round(insights.mean_score)}</strong> (p50 {Math.round(insights.p50_score)}, p75{" "}
                  {Math.round(insights.p75_score)}, p90 {Math.round(insights.p90_score)}).
                </p>
                <div style={{ display: "flex", gap: 8, marginBottom: "0.75rem", flexWrap: "wrap" }}>
                  {Object.entries(insights.band_counts).map(([band, count]) => (
                    <span key={band} className="pill">
                      {band}: {count}
                    </span>
                  ))}
                </div>
                <h3 className="panelTitle" style={{ marginTop: "0.5rem" }}>Personas in this dataset</h3>
                <ul style={{ listStyle: "none", marginTop: 4 }}>
                  {Object.entries(insights.cluster_counts).map(([label, count]) => (
                    <li key={label} className="muted" style={{ fontSize: "0.9rem", marginBottom: 2 }}>
                      <strong>{label}</strong> · {count} users
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="muted">
                The system computes dataset-wide indicators and personas from transaction patterns. Once ready, you can drill down into individual
                cards for personalised insights.
              </p>
            )}
            <div style={{ marginTop: "1rem" }}>
              <Link className="linkMuted" href="https://www.kaggle.com/c/elo-merchant-category-recommendation" target="_blank">
                Dataset reference
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
