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
  const cardId = typeof router.query.card_id === "string" ? router.query.card_id : null;
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [nudgeList, setNudgeList] = useState<Array<{ title: string; message: string; why_this: string; action_step: string; confidence: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cardId) return;
    setLoading(true);
    setError(null);
    analyze(cardId).then((res) => {
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
  }, [cardId]);

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
        <title>{cardId} – Spendly</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <main className="appShell">
        <header className="appHeader">
          <div>
            <h1 className="appTitle">User profile</h1>
            <p className="appSubtitle">
              Card: <strong>{cardId}</strong> · Interpretable behavioural indicators (not a diagnosis)
            </p>
          </div>
          <Link href="/dashboard" className="pill">
            Back to users
          </Link>
        </header>

        <div className="appGrid" style={{ gridTemplateColumns: "1fr" }}>
          <section className="card panel" aria-label="Risk score">
            <ScoreGauge score={analysis.risk_score} riskBand={analysis.risk_band} />
          </section>

          <section className="card panel" aria-label="Behaviour profile">
            <ProfileBadge profile={analysis.profile} />
          </section>

          <section className="card panel" aria-label="Top drivers">
            <DriverBreakdown breakdown={analysis.score_breakdown} topDrivers={analysis.top_drivers} />
          </section>

          {analysis.evidence && analysis.evidence.length > 0 && (
            <section className="card panel" aria-label="Evidence">
              <h2 className="panelTitle">Evidence</h2>
              <ul style={{ listStyle: "none", color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                {analysis.evidence.map((line, i) => (
                  <li key={i} style={{ marginBottom: "0.35rem" }}>
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card panel" aria-label="Nudges">
            <NudgeCards nudges={nudgeList} />
          </section>

          <section className="card panel" aria-label="Charts">
            <ChartsPanel chartSeries={analysis.chart_series} />
          </section>
        </div>
      </main>
    </>
  );
}
