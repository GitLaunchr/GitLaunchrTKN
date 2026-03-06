-- ============================================================
-- GitLaunchr — Supabase Postgres Migration
-- Run in Supabase SQL Editor (or psql)
-- ============================================================

-- ── Enable UUID extension (usually already enabled in Supabase) ──
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── USERS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id   TEXT        UNIQUE NOT NULL,
  username    TEXT        NOT NULL,
  avatar_url  TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by github_id (used on sign-in)
CREATE INDEX IF NOT EXISTS users_github_id_idx ON users (github_id);

-- ── LAUNCH REQUESTS ──────────────────────────────────────────────
CREATE TYPE launch_status AS ENUM (
  'pending',
  'splitter_deployed',
  'bankr_created',
  'deploying',
  'done',
  'failed'
);

CREATE TABLE IF NOT EXISTS launch_requests (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Token info
  name              TEXT          NOT NULL,
  symbol            TEXT          NOT NULL,
  creator_payout    TEXT          NOT NULL,  -- EVM address
  description       TEXT,
  website           TEXT,
  twitter           TEXT,

  -- Deployment tracking
  splitter_address  TEXT,                    -- deployed FeeSplitter EVM address
  bankr_job_id      TEXT,                    -- Bankr job UUID
  token_address     TEXT,                    -- deployed token EVM address (filled when done)
  status            launch_status NOT NULL DEFAULT 'pending',

  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS launch_requests_user_id_idx      ON launch_requests (user_id);
CREATE INDEX IF NOT EXISTS launch_requests_status_idx       ON launch_requests (status);
CREATE INDEX IF NOT EXISTS launch_requests_bankr_job_id_idx ON launch_requests (bankr_job_id);

-- Auto-update updated_at via trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_launch_updated_at ON launch_requests;
CREATE TRIGGER set_launch_updated_at
  BEFORE UPDATE ON launch_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── ROW LEVEL SECURITY (optional but recommended) ────────────────
-- Enable RLS and lock down direct client access.
-- The app uses service role key (bypasses RLS) — this protects
-- against accidental public exposure.

ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_requests ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically.
-- No policies needed for server-side access.
-- Add policies here if you ever use anon/public Supabase client.
