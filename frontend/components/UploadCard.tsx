import { useState } from "react";
import { uploadDataset, useDemoDataset } from "@/lib/api";

interface UploadCardProps {
  onSuccess: (
    datasetId: string,
    summary: { rows: number; users: number; dateRange: [string, string] }
  ) => void;
}

export default function UploadCard({ onSuccess }: UploadCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    const result = await uploadDataset(file);
    setLoading(false);
    if (result.error) {
      setError(result.error.message || "Upload failed");
      return;
    }
    const d = result.data;
    if (d) onSuccess(d.dataset_id, { rows: d.rows, users: d.users, dateRange: d.date_range });
  };

  const handleDemo = async () => {
    setError(null);
    setLoading(true);
    const result = await useDemoDataset();
    setLoading(false);
    if (result.error) {
      setError(result.error.message || "Demo load failed");
      return;
    }
    const d = result.data;
    if (d) onSuccess(d.dataset_id, { rows: d.rows, users: d.users, dateRange: d.date_range });
  };

  return (
    <div
      style={{
        padding: "1.5rem",
        background: "var(--color-surface)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="csv-upload"
          style={{
            display: "inline-block",
            padding: "0.5rem 1rem",
            background: "var(--color-border)",
            borderRadius: "var(--radius)",
            cursor: "pointer",
          }}
        >
          {loading ? "Loading…" : "Upload CSV"}
        </label>
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleFile}
          disabled={loading}
          style={{ display: "none" }}
          aria-label="Choose CSV file"
        />
        <button
          type="button"
          onClick={handleDemo}
          disabled={loading}
          style={{
            marginLeft: "0.5rem",
            padding: "0.5rem 1rem",
            background: "var(--color-border)",
            border: "none",
            borderRadius: "var(--radius)",
            color: "inherit",
          }}
        >
          Use demo dataset
        </button>
      </div>
      {error && (
        <p style={{ color: "var(--color-risk-critical)", fontSize: "0.9rem" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
