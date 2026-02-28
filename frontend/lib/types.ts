/** Shared types for API responses and payloads */

export interface UploadResponse {
  dataset_id: string;
  rows: number;
  users: number;
  date_range: [string, string];
}

export interface UserSummary {
  card_id: string;
  tx_count?: number;
  date_range?: [string, string];
}

export interface ScoreBreakdown {
  spike?: number;
  burst?: number;
  eom?: number;
  timing?: number;
  category?: number;
}

export interface BehaviorProfile {
  cluster_id: number;
  profile_label: string;
  interpretation: string;
  key_stats?: Record<string, number>;
}

export interface ChartSeries {
  daily_spend?: Array<{ date: string; value: number; is_spike?: boolean }>;
  hourly_counts?: Array<{ hour: number; count: number }>;
  category_distribution?: Array<{ category: string; share: number }>;
  eom_comparison?: { last_5_days: number; rest_of_month: number };
}

export interface AnalyzeResponse {
  risk_score: number;
  risk_band: string;
  score_breakdown: ScoreBreakdown;
  top_drivers: string[];
  profile: BehaviorProfile;
  chart_series: ChartSeries;
  evidence?: string[];
}

export interface Nudge {
  title: string;
  message: string;
  why_this: string;
  action_step: string;
  confidence: number;
}

export interface AnalysisSummary {
  risk_score: number;
  risk_band: string;
  profile_label: string;
  top_drivers: string[];
  metrics?: Record<string, number>;
}
