// types/index.ts

export type LaunchStatus =
  | "pending"
  | "splitter_deployed"
  | "bankr_created"
  | "deploying"
  | "done"
  | "failed";

export interface User {
  id: string;
  github_id: string;
  username: string;
  avatar_url: string;
  created_at: string;
}

export interface LaunchRequest {
  id: string;
  user_id: string;
  name: string;
  symbol: string;
  creator_payout: string;
  splitter_address: string | null;
  bankr_job_id: string | null;
  token_address: string | null;
  status: LaunchStatus;
  description: string | null;
  website: string | null;
  twitter: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankrJobResponse {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  output?: string;
  error?: string;
}

export interface CreateLaunchBody {
  name: string;
  symbol: string;
  creatorPayout: string;
  description?: string;
  website?: string;
  twitter?: string;
}
