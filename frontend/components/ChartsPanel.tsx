import type { ChartSeries } from "@/lib/types";

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

  return (
    <div>
      <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Evidence charts</h2>

      {dailySpend.length > 0 && (
        <section style={{ marginBottom: "2rem" }} aria-label="Daily spend over time">
          <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>
            Daily spend
          </h3>
          <div style={{ height: 200, overflowX: "auto" }}>
            <svg width={Math.max(600, dailySpend.length * 8)} height={200} style={{ minWidth: "100%" }}>
              {(() => {
                const values = dailySpend.map((d) => d.value);
                const maxV = Math.max(...values, 1);
                const w = Math.max(4, 600 / dailySpend.length);
                return dailySpend.map((d, i) => (
                  <g key={i}>
                    <rect
                      x={i * w}
                      y={200 - (d.value / maxV) * 180}
                      width={w - 1}
                      height={(d.value / maxV) * 180}
                      fill={d.is_spike ? "var(--color-risk-high)" : "var(--color-border)"}
                      rx={2}
                    />
                  </g>
                ));
              })()}
            </svg>
          </div>
        </section>
      )}

      {hourlyCounts.length > 0 && (
        <section style={{ marginBottom: "2rem" }} aria-label="Transactions by hour">
          <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>
            Hour of day
          </h3>
          <div style={{ height: 180, overflowX: "auto" }}>
            <svg width={600} height={180} viewBox="0 0 600 180" preserveAspectRatio="none">
              {(() => {
                const maxC = Math.max(...hourlyCounts.map((h) => h.count), 1);
                const barW = 600 / 24;
                return Array.from({ length: 24 }, (_, h) => {
                  const item = hourlyCounts.find((x) => x.hour === h);
                  const count = item?.count ?? 0;
                  return (
                    <rect
                      key={h}
                      x={(h / 24) * 600}
                      y={180 - (count / maxC) * 160}
                      width={barW - 2}
                      height={(count / maxC) * 160}
                      fill="var(--color-border)"
                      rx={2}
                    />
                  );
                });
              })()}
            </svg>
          </div>
        </section>
      )}

      {categoryDist.length > 0 && (
        <section style={{ marginBottom: "2rem" }} aria-label="Category distribution">
          <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>
            Category distribution
          </h3>
          <ul style={{ listStyle: "none", fontSize: "0.9rem" }}>
            {categoryDist.slice(0, 10).map((c, i) => (
              <li key={i} style={{ marginBottom: "0.25rem" }}>
                <span style={{ marginRight: "0.5rem" }}>{c.category}</span>
                <span style={{ color: "var(--color-text-muted)" }}>{Math.round(c.share * 100)}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {eom && (eom.last_5_days > 0 || eom.rest_of_month > 0) && (
        <section aria-label="End of month comparison">
          <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>
            Last 5 days of month vs rest
          </h3>
          <p style={{ fontSize: "0.9rem" }}>
            Last 5 days: <strong>{eom.last_5_days.toFixed(1)}</strong> · Rest of month:{" "}
            <strong>{eom.rest_of_month.toFixed(1)}</strong>
          </p>
        </section>
      )}
    </div>
  );
}
