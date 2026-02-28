/**
 * API client for impulse finance backend. Base URL from NEXT_PUBLIC_API_URL.
 */

const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? "" : "http://localhost:5000");

async function request<T>(path: string, options?: RequestInit): Promise<{ data?: T; error?: { code: string; message: string } }> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: json?.error || { code: "UNKNOWN", message: res.statusText } };
  }
  if (json.error) return { error: json.error };
  return { data: json.data ?? json };
}

export async function uploadDataset(file: File): Promise<{ data?: { dataset_id: string; rows: number; users: number; date_range: [string, string] }; error?: { code: string; message: string } }> {
  const form = new FormData();
  form.append("file", file);
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/upload`, { method: "POST", body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { error: json?.error || { code: "UPLOAD_FAILED", message: res.statusText } };
  return { data: json.data ?? json };
}

export async function useDemoDataset(): Promise<{ data?: { dataset_id: string; rows: number; users: number; date_range: [string, string] }; error?: { code: string; message: string } }> {
  return request("/api/upload?demo=1", { method: "POST" });
}

export async function getUsers(datasetId: string): Promise<{ data?: { users: Array<{ card_id: string; tx_count?: number; date_range?: [string, string] }> }; error?: { code: string; message: string } }> {
  return request(`/api/users?dataset_id=${encodeURIComponent(datasetId)}`);
}

export async function analyze(datasetId: string, cardId: string): Promise<{ data?: import("./types").AnalyzeResponse; error?: { code: string; message: string } }> {
  return request(`/api/analyze?dataset_id=${encodeURIComponent(datasetId)}&card_id=${encodeURIComponent(cardId)}`);
}

export async function getNudges(analysisSummary: import("./types").AnalysisSummary): Promise<{ data?: { nudges: import("./types").Nudge[] }; error?: { code: string; message: string } }> {
  return request("/api/nudges", {
    method: "POST",
    body: JSON.stringify(analysisSummary),
  });
}
