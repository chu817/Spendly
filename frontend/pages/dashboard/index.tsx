import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getDefaultDataset } from "@/lib/api";
import type { GlobalInsights } from "@/lib/types";
import Layout from "@/components/Layout";
import UserSelector from "@/components/UserSelector";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Legend,
  ReferenceLine,
} from "recharts";

const BAND_COLORS: Record<string, string> = {
  Low: "var(--color-risk-low)",
  Medium: "var(--color-risk-medium)",
  High: "var(--color-risk-high)",
  Critical: "var(--color-risk-critical)",
};

const SCORE_COMPONENTS = [
  { key: "spike", label: "Spending spikes", weight: "25%", desc: "Unusual daily spend or transaction count vs. the user's own baseline." },
  { key: "burst", label: "Burst buying", weight: "25%", desc: "Many transactions in a short window (e.g. 30 min) or high max transactions in 2 hours." },
  { key: "eom", label: "End-of-month surge", weight: "20%", desc: "Higher spend or activity in the last 5 days of the month." },
  { key: "timing", label: "Timing triggers", weight: "15%", desc: "Late-night or weekend-heavy spending; low entropy in hour-of-day distribution." },
  { key: "category", label: "Category concentration", weight: "15%", desc: "Spend concentrated in few categories with low diversity." },
];

const RISK_BAND_THRESHOLDS = [
  { band: "Low", range: "0 – 25", color: "var(--color-risk-low)" },
  { band: "Medium", range: "26 – 50", color: "var(--color-risk-medium)" },
  { band: "High", range: "51 – 75", color: "var(--color-risk-high)" },
  { band: "Critical", range: "76 – 100", color: "var(--color-risk-critical)" },
];

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
        setStatus(data.status as "loading" | "training");
        setTimeout(tick, 1500);
        return;
      }
      setStatus("ready");
      setSummary({
        rows: data.rows ?? 0,
        users: data.users ?? 0,
        dateRange: Array.isArray(data.date_range) && data.date_range.length >= 2 ? data.date_range : ["—", "—"],
      });
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

  const bandData =
    insights && insights.band_counts
      ? Object.entries(insights.band_counts)
          .map(([band, count]) => ({ band, count }))
          .sort((a, b) => {
            const order = ["Low", "Medium", "High", "Critical"];
            return order.indexOf(a.band) - order.indexOf(b.band);
          })
      : [];

  const totalUsers = bandData.reduce((s, d) => s + d.count, 0);
  const bandDataWithPct = bandData.map((d) => ({
    ...d,
    pct: totalUsers ? Math.round((d.count / totalUsers) * 100) : 0,
  }));

  const personaData =
    insights && insights.cluster_counts
      ? Object.entries(insights.cluster_counts).map(([label, count]) => ({ label, count }))
      : [];

  const pieColors = [
    "var(--color-risk-low)",
    "var(--color-risk-medium)",
    "var(--color-risk-high)",
    "var(--color-risk-critical)",
    "var(--color-text-muted)",
    "var(--color-border)",
  ];

  const percentileChartData =
    insights && typeof insights.mean_score === "number"
      ? [
          { name: "Mean", value: Math.round(insights.mean_score ?? 0), fill: "var(--color-text)" },
          { name: "Median (p50)", value: Math.round(insights.p50_score ?? 0), fill: "var(--color-text-muted)" },
          { name: "p75", value: Math.round(insights.p75_score ?? 0), fill: "var(--color-risk-medium)" },
          { name: "p90", value: Math.round(insights.p90_score ?? 0), fill: "var(--color-risk-high)" },
        ]
      : [];

  return (
    <>
      <Head>
        <title>Dashboard – Impulse Finance</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <Layout datasetLabel="Elo historical_transactions.csv">
        <header className="dashboardHero">
          <div>
            <h1 className="dashboardHeroTitle">Impulse Behaviour Analytics</h1>
            <p className="dashboardHeroSub">
              Model outcomes and dataset-wide insights. Explore how the impulse score is built and how your portfolio distributes across risk bands and personas.
            </p>
          </div>
          <span className="dashboardHeroPill">Dataset: Elo historical_transactions.csv</span>
        </header>

        {status !== "ready" && !error && (
          <div className="insightCard" style={{ borderLeftColor: "var(--color-text-muted)" }}>
            <p className="muted" style={{ margin: 0 }}>
              Preparing model… {status === "training" ? "training features" : "loading dataset"}
            </p>
          </div>
        )}

        {error && (
          <div className="insightCard" style={{ borderLeftColor: "var(--color-risk-critical)" }}>
            <p style={{ color: "var(--color-risk-critical)", margin: 0 }} role="alert">
              {error}
            </p>
          </div>
        )}

        {status === "ready" && (
          <>
            {/* ——— Analytics first ——— */}
            <section className="analyticsCard">
              <div className="sectionHead">
                <div className="sectionHeadLine" />
                <h2 className="sectionHeadTitle">Model analytics</h2>
              </div>
              <p className="muted" style={{ fontSize: 13, marginBottom: 24 }}>
                How the impulse model works and dataset-wide results.
              </p>

              {insights ? (
                <>
                  <div className="insightCard">
                    <h3>Model overview</h3>
                    <p>
                      The impulse score (0–100) is a weighted composite of five behavioural indicators computed per user.
                      Each component is normalized using dataset percentiles (e.g. 95th) so scores are comparable. Risk
                      bands segment users into Low, Medium, High, and Critical. Personas are behavioural clusters from
                      KMeans on the same features (e.g. steady spender, late-night spender, burst buyer). This is
                      unsupervised: the dataset has no impulse labels.
                    </p>
                  </div>

                  <div className="insightCard">
                    <h3>How the score is computed</h3>
                    <p style={{ marginBottom: 12 }}>
                      The final score is a weighted sum of five components (each normalized 0–1, then scaled to 0–100):
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {SCORE_COMPONENTS.map((c) => (
                        <li
                          key={c.key}
                          style={{
                            padding: "10px 12px",
                            marginBottom: 8,
                            background: "var(--color-bg)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius)",
                            fontSize: 13,
                          }}
                        >
                          <strong style={{ color: "var(--color-text)" }}>{c.label}</strong>{" "}
                          <span style={{ color: "var(--color-text-muted)" }}>({c.weight})</span> — {c.desc}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="insightCard">
                    <h3>Risk band thresholds</h3>
                    <p style={{ marginBottom: 12 }}>
                      Users are assigned a risk band from their impulse score:
                    </p>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--color-text-muted)", fontWeight: 600 }}>Band</th>
                          <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--color-text-muted)", fontWeight: 600 }}>Score range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {RISK_BAND_THRESHOLDS.map((r) => (
                          <tr key={r.band} style={{ borderTop: "1px solid var(--color-border)" }}>
                            <td style={{ padding: "8px 12px" }}>
                              <span style={{ color: r.color, fontWeight: 600 }}>{r.band}</span>
                            </td>
                            <td style={{ padding: "8px 12px", color: "var(--color-text-muted)" }}>{r.range}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="kpiGrid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                    <div className="kpiCardElevated">
                      <div className="kpiCardLabel">Mean score</div>
                      <div className="kpiCardValue">{Math.round(insights.mean_score ?? 0)}</div>
                      <div className="kpiCardSub">Average impulse</div>
                    </div>
                    <div className="kpiCardElevated">
                      <div className="kpiCardLabel">Median (p50)</div>
                      <div className="kpiCardValue">{Math.round(insights.p50_score ?? 0)}</div>
                      <div className="kpiCardSub">Typical user</div>
                    </div>
                    <div className="kpiCardElevated">
                      <div className="kpiCardLabel">p75</div>
                      <div className="kpiCardValue">{Math.round(insights.p75_score ?? 0)}</div>
                      <div className="kpiCardSub">Upper-mid range</div>
                    </div>
                    <div className="kpiCardElevated">
                      <div className="kpiCardLabel">p90</div>
                      <div className="kpiCardValue">{Math.round(insights.p90_score ?? 0)}</div>
                      <div className="kpiCardSub">High-impulse tail</div>
                    </div>
                  </div>

                  <div className="insightCard">
                    <h3>What the percentiles mean</h3>
                    <p>
                      <strong>Mean</strong> is the average impulse score across users. <strong>Median (p50)</strong> is
                      the middle of the distribution—half of users score below this. <strong>p75</strong> and{" "}
                      <strong>p90</strong> describe the upper tail: 25% of users score above p75, and 10% above p90. A
                      high p90 relative to the median indicates a long upper tail of higher-impulse users.
                    </p>
                  </div>

                  {bandDataWithPct.length > 0 && (
                    <div className="insightCard">
                      <h3>Portfolio summary</h3>
                      <p style={{ marginBottom: 8 }}>
                        Share of users in each risk band (from {totalUsers.toLocaleString()} scored users):
                      </p>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: 12 }}>
                        {bandDataWithPct.map((d) => (
                          <li
                            key={d.band}
                            style={{
                              padding: "8px 14px",
                              background: "var(--color-bg)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "var(--radius)",
                              fontSize: 13,
                            }}
                          >
                            <span style={{ color: BAND_COLORS[d.band], fontWeight: 600 }}>{d.band}</span>:{" "}
                            {d.count.toLocaleString()} users ({d.pct}%)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                    <div className="vizCard">
                      <div className="vizCardTitle">Score distribution (percentiles)</div>
                      <div className="vizCardDesc">
                        Mean, median, p75 and p90 on the 0–100 impulse scale. Dashed lines: band boundaries (25, 50, 75).
                      </div>
                      {percentileChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart
                            data={percentileChartData}
                            layout="vertical"
                            margin={{ top: 0, right: 16, left: 60, bottom: 0 }}
                          >
                            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                            <YAxis type="category" dataKey="name" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} width={55} />
                            <Tooltip
                              contentStyle={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                              formatter={(value: number) => [value, "Score"]}
                            />
                            <ReferenceLine x={25} stroke="var(--color-risk-low)" strokeDasharray="2 2" />
                            <ReferenceLine x={50} stroke="var(--color-risk-medium)" strokeDasharray="2 2" />
                            <ReferenceLine x={75} stroke="var(--color-risk-high)" strokeDasharray="2 2" />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                              {percentileChartData.map((_, i) => (
                                <Cell key={i} fill={percentileChartData[i].fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="muted" style={{ fontSize: 13 }}>No score data yet.</p>
                      )}
                    </div>

                    <div className="vizCard">
                      <div className="vizCardTitle">Risk band share</div>
                      <div className="vizCardDesc">
                        Number and share of users in each impulse risk band.
                      </div>
                      {bandDataWithPct.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={bandDataWithPct} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                            <XAxis dataKey="band" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                            <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                              formatter={(value: number, _name: string, props: { payload?: Array<{ payload?: { pct?: number }; pct?: number }> }) => {
                                const item = props.payload?.[0];
                                const pct = item?.payload?.pct ?? item?.pct;
                                return [pct != null ? `${value} users (${pct}%)` : value, "Count"];
                              }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {bandDataWithPct.map((d, i) => (
                                <Cell key={i} fill={BAND_COLORS[d.band] ?? "var(--color-border)"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="muted" style={{ fontSize: 13 }}>Band distribution will appear once training completes.</p>
                      )}
                    </div>
                  </div>

                  <div className="vizCard" style={{ minHeight: 340 }}>
                    <div className="vizCardTitle">Behavioural personas</div>
                    <div className="vizCardDesc">
                      KMeans clusters on behavioural features (e.g. steady spender, late-night spender, burst buyer, end-of-month splurger).
                    </div>
                    {personaData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                          <Pie
                            data={personaData}
                            dataKey="count"
                            nameKey="label"
                            outerRadius={110}
                            innerRadius={40}
                            paddingAngle={2}
                            label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                            labelLine={{ stroke: "var(--color-border)", strokeWidth: 1 }}
                          >
                            {personaData.map((_, i) => (
                              <Cell key={i} fill={pieColors[i % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                            formatter={(value: number, name: string, props: { payload?: Array<{ payload?: { label?: string }; label?: string }> }) => [
                              `${value} users`,
                              props.payload?.[0]?.payload?.label ?? props.payload?.[0]?.label ?? name,
                            ]}
                          />
                          <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ paddingTop: 16 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="muted" style={{ fontSize: "0.85rem", marginTop: 8 }}>
                        Persona distribution will appear once training completes.
                      </p>
                    )}
                  </div>

                  <div style={{ marginTop: "1rem" }}>
                    <Link className="linkMuted" href="https://www.kaggle.com/c/elo-merchant-category-recommendation" target="_blank">
                      Dataset reference
                    </Link>
                  </div>
                </>
              ) : (
                <p className="muted">
                  The system computes dataset-wide indicators and personas from transaction patterns. Once ready, model
                  analytics and charts will appear above; you can then drill down into individual cards below.
                </p>
              )}
            </section>

            {/* ——— Card-based search second ——— */}
            <section className="exploreSection">
              <div className="sectionHead">
                <div className="sectionHeadLine" />
                <h2 className="sectionHeadTitle">Explore individual cards</h2>
              </div>
              {summary && (
                <p className="muted" style={{ marginBottom: "1rem", fontSize: 14 }}>
                  {summary.users.toLocaleString()} users · {summary.rows.toLocaleString()} rows · {summary.dateRange[0]} – {summary.dateRange[1]}
                </p>
              )}
              <UserSelector onSelect={handleSelect} />
            </section>
          </>
        )}
      </Layout>
    </>
  );
}
