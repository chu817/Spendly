import type { ChartSeries } from "@/lib/types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ChartsPanelProps {
  chartSeries: ChartSeries;
}

export default function ChartsPanel({ chartSeries }: ChartsPanelProps) {
  if (!chartSeries) {
    return (
      <div>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Evidence charts</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>No chart data.</p>
      </div>
    );
  }

  const dailySpend = chartSeries.daily_spend || [];
  const hourlyCounts = chartSeries.hourly_counts || [];
  const categoryDist = chartSeries.category_distribution || [];
  const eom = chartSeries.eom_comparison;

  const pieColors = [
    "var(--color-risk-low)",
    "var(--color-risk-medium)",
    "var(--color-risk-high)",
    "var(--color-risk-critical)",
    "var(--color-border)",
  ];

  return (
    <div>
      <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Evidence charts</h2>

      {dailySpend.length > 0 && (
        <section style={{ marginBottom: "2rem" }} aria-label="Daily spend over time">
          <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>
            Daily spend
          </h3>
          <div style={{ height: 260, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: "0.5rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySpend}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="date" hide />
                <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }} />
                <Line type="monotone" dataKey="value" stroke="var(--color-risk-low)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {hourlyCounts.length > 0 && (
        <section style={{ marginBottom: "2rem" }} aria-label="Transactions by hour">
          <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>
            Hour of day
          </h3>
          <div style={{ height: 240, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: "0.5rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyCounts}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }} />
                <Bar dataKey="count" fill="var(--color-border)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {categoryDist.length > 0 && (
        <section style={{ marginBottom: "2rem" }} aria-label="Category distribution">
          <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>
            Category distribution
          </h3>
          <div style={{ height: 260, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: "0.5rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryDist.slice(0, 8)} dataKey="share" nameKey="label" outerRadius={90} label>
                  {categoryDist.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {eom && (eom.last_5_days > 0 || eom.rest_of_month > 0) && (
        <section aria-label="End of month comparison">
          <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>
            Last 5 days of month vs rest
          </h3>
          <div style={{ height: 200, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius)", padding: "0.5rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { bucket: "Last 5 days", value: eom.last_5_days },
                  { bucket: "Rest of month", value: eom.rest_of_month },
                ]}
              >
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--color-text-muted)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }} />
                <Bar dataKey="value" fill="var(--color-risk-medium)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
