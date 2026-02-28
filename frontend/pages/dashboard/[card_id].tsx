import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { analyze, getNudges } from "@/lib/api";
import type { AnalyzeResponse, AnalysisSummary } from "@/lib/types";
import ScoreGauge from "@/components/ScoreGauge";
import ProfileBadge from "@/components/ProfileBadge";
import DriverBreakdown from "@/components/DriverBreakdown";
import NudgeCards from "@/components/NudgeCards";
import ChartsPanel from "@/components/ChartsPanel";

export default function UserDashboardPage() {
  const router = useRouter();
  const datasetId = typeof router.query.dataset_id === "string" ? router.query.dataset_id : null;
  const cardId = typeof router.query.card_id === "string" ? router.query.card_id : null;
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [nudgeList, setNudgeList] = useState<Array<{ title: string; message: string; why_this: string; action_step: string; confidence: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!datasetId || !cardId) return;
    setLoading(true);
    setError(null);
    analyze(datasetId, cardId).then((res) => {
      if (res.error) {
        setError(res.error.message);
        setLoading(false);
        return;
      }
      if (res.data) {
        setAnalysis(res.data);
        const summary: AnalysisSummary = {
          risk_score: res.data.risk_score,
          risk_band: res.data.risk_band,
          profile_label: res.data.profile.profile_label,
          top_drivers: res.data.top_drivers,
          metrics: res.data.score_breakdown as Record<string, number>,
        };
        getNudges(summary).then((nres) => {
          if (nres.data?.nudges) setNudgeList(nres.data.nudges);
        });
      }
      setLoading(false);
    });
  }, [datasetId, cardId]);

  if (loading) {
    return (
      <>
        <Head><title>Analysis – Impulse Finance</title></Head>
        <main style={{ minHeight: "100vh", padding: "2rem", maxWidth: 1000, margin: "0 auto" }}>
          <p style={{ color: "var(--color-text-muted)" }}>Loading analysis…</p>
        </main>
      </>
    );
  }
  if (error || !analysis) {
    return (
      <>
        <Head><title>Error – Impulse Finance</title></Head>
        <main style={{ minHeight: "100vh", padding: "2rem", maxWidth: 1000, margin: "0 auto" }}>
          <p style={{ color: "var(--color-risk-critical)" }}>{error || "Analysis failed."}</p>
          <Link href="/dashboard" style={{ display: "inline-block", marginTop: "1rem", color: "var(--color-text-muted)" }}>Back to dashboard</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{cardId} – Impulse Finance</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <main style={{ minHeight: "100vh", padding: "2rem", maxWidth: 1000, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Behaviour analysis</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>Card: {cardId}</p>

        <section style={{ marginBottom: "2rem" }} aria-label="Risk score">
          <ScoreGauge score={analysis.risk_score} riskBand={analysis.risk_band} />
        </section>

        <section style={{ marginBottom: "2rem" }} aria-label="Behaviour profile">
          <ProfileBadge profile={analysis.profile} />
        </section>

        <section style={{ marginBottom: "2rem" }} aria-label="Top drivers">
          <DriverBreakdown breakdown={analysis.score_breakdown} topDrivers={analysis.top_drivers} />
        </section>

        {analysis.evidence && analysis.evidence.length > 0 && (
          <section style={{ marginBottom: "2rem" }} aria-label="Evidence">
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Evidence</h2>
            <ul style={{ listStyle: "none", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              {analysis.evidence.map((line, i) => (
                <li key={i} style={{ marginBottom: "0.25rem" }}>{line}</li>
              ))}
            </ul>
          </section>
        )}

        <section style={{ marginBottom: "2rem" }} aria-label="Nudges">
          <NudgeCards nudges={nudgeList} />
        </section>

        <section style={{ marginBottom: "2rem" }} aria-label="Charts">
          <ChartsPanel chartSeries={analysis.chart_series} />
        </section>

        <Link href={`/dashboard?dataset_id=${encodeURIComponent(datasetId || "")}`} style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          Back to user list
        </Link>
      </main>
    </>
  );
}
