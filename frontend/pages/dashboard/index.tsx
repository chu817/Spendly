import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getUsers } from "@/lib/api";
import UserSelector from "@/components/UserSelector";

export default function DashboardPage() {
  const router = useRouter();
  const datasetId = typeof router.query.dataset_id === "string" ? router.query.dataset_id : null;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!datasetId) return;
    getUsers(datasetId).then((res) => {
      if (res.error) setError(res.error.message);
    });
  }, [datasetId]);

  const handleSelect = (cardId: string) => {
    if (datasetId) router.push(`/dashboard/${encodeURIComponent(cardId)}?dataset_id=${encodeURIComponent(datasetId)}`);
  };

  return (
    <>
      <Head>
        <title>Dashboard – Impulse Finance</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <main style={{ minHeight: "100vh", padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>Dashboard</h1>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          Select a user to view impulse risk score, behaviour profile, and nudges.
        </p>
        {!datasetId ? (
          <p style={{ color: "var(--color-text-muted)" }}>Missing dataset. Go back to upload.</p>
        ) : (
          <>
            {error && <p style={{ color: "var(--color-risk-critical)", marginBottom: "1rem" }} role="alert">{error}</p>}
            <UserSelector datasetId={datasetId} onSelect={handleSelect} />
          </>
        )}
        <Link href="/" style={{ display: "inline-block", marginTop: "1.5rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          Back to upload
        </Link>
      </main>
    </>
  );
}
