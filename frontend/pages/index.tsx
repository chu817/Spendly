import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import UploadCard from "@/components/UploadCard";

export default function Home() {
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    rows: number;
    users: number;
    dateRange: [string, string];
  } | null>(null);

  return (
    <>
      <Head>
        <title>Impulse Finance – Upload</title>
        <meta name="description" content="Detect financial impulse behaviour from transaction history" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <main style={{ minHeight: "100vh", padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>Impulse Finance</h1>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem" }}>
          Upload transaction data or use the demo dataset to analyse spending behaviour.
        </p>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
          This tool detects behavioural indicators of impulse spending from patterns only. It is not a medical or psychological diagnosis. Data is anonymized; amounts are not real currency.
        </p>
        <UploadCard
          onSuccess={(id, s) => {
            setDatasetId(id);
            setSummary(s);
          }}
        />
        {summary && datasetId && (
          <section style={{ marginTop: "2rem", padding: "1rem", background: "var(--color-surface)", borderRadius: "var(--radius)" }}>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Dataset loaded</h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              {summary.rows.toLocaleString()} rows, {summary.users.toLocaleString()} users. Date range: {summary.dateRange[0]} – {summary.dateRange[1]}
            </p>
            <Link
              href={`/dashboard?dataset_id=${encodeURIComponent(datasetId)}`}
              style={{
                display: "inline-block",
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                background: "var(--color-risk-low)",
                color: "#0f1419",
                borderRadius: "var(--radius)",
                fontWeight: 600,
              }}
            >
              Go to dashboard
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
