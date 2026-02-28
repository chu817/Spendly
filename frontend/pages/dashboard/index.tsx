import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getDefaultDataset } from "@/lib/api";
import UserSelector from "@/components/UserSelector";

export default function DashboardPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ rows: number; users: number; dateRange: [string, string] } | null>(null);
  const [status, setStatus] = useState<"loading" | "training" | "ready" | "error">("loading");

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
      if (!res.data) return;
      if ((res.data as any).status && (res.data as any).status !== "ready") {
        setStatus((res.data as any).status);
        setTimeout(tick, 1500);
        return;
      }
      setStatus("ready");
      setSummary({ rows: res.data.rows, users: res.data.users, dateRange: res.data.date_range });
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
            <h2 className="panelTitle">How this works</h2>
            <p className="muted" style={{ marginTop: "0.25rem" }}>
              Choose a <strong>card_id</strong> to view an impulse risk score (0–100), a cluster-based persona, top drivers, nudges, and evidence charts.
              The system uses interpretable indicators like spikes, bursts, end-of-month surges, and timing triggers.
            </p>
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
