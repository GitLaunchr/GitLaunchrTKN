"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ScanlinesOverlay from "@/app/components/ScanlinesOverlay";
import HUD from "@/app/components/HUD";
import PixelPanel from "@/app/components/PixelPanel";
import PixelButton from "@/app/components/PixelButton";
import StatusTimeline, { FlywheelTimeline, type TimelineStatus } from "@/app/components/StatusTimeline";
import styles from "./launch-status.module.css";

interface LaunchData {
  id:               string;
  name:             string;
  symbol:           string;
  status:           TimelineStatus;
  pairing?:         "bankr" | "gitlaunchr";
  splitter_address: string | null;
  bankr_job_id:     string | null;
  token_address:    string | null;
  created_at:       string;
}

const POLL_INTERVAL_MS = 2500;
const DONE_STATUSES: TimelineStatus[] = ["done", "failed"];

// Flywheel step durations (ms) — how long each step takes in progress simulation
const FW_STEP_DURATIONS = [1500, 2500, 6000, 5000, 4000];
const FW_FAIL_TIMEOUT   = 30000;

export default function LaunchStatusPage() {
  const params = useParams();
  const id     = params?.id as string;

  const [data,     setData]     = useState<LaunchData | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [retries,  setRetries]  = useState(0);

  // Flywheel simulation state
  const [fwStep,    setFwStep]    = useState(0);
  const [fwFailed,  setFwFailed]  = useState(false);
  const [fwElapsed, setFwElapsed] = useState(0);

  const fwTimers   = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fwInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const fwStart    = useRef<number>(0);
  const pollTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Poll Supabase status ──────────────────────────────
  const startPolling = useCallback(() => {
    if (!id) return;
    if (pollTimer.current) clearInterval(pollTimer.current);

    async function poll() {
      try {
        const res  = await fetch(`/api/launch/${id}/status`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body?.error ?? "Failed to load launch.");
          clearInterval(pollTimer.current!);
          return;
        }
        const json: LaunchData = await res.json();
        setData(json);
        if (DONE_STATUSES.includes(json.status)) {
          clearInterval(pollTimer.current!);
          // If real deploy succeeded, mark flywheel done too
          if (json.status === "done") setFwStep(6);
          if (json.status === "failed") setFwFailed(true);
        }
      } catch {
        setError("Network error.");
        clearInterval(pollTimer.current!);
      }
    }

    poll();
    pollTimer.current = setInterval(poll, POLL_INTERVAL_MS);
  }, [id]);

  // ── Flywheel progress simulation ─────────────────────
  const startFlywheelSim = useCallback(() => {
    // clear previous timers
    fwTimers.current.forEach(clearTimeout);
    fwTimers.current = [];
    if (fwInterval.current) clearInterval(fwInterval.current);

    setFwStep(0);
    setFwFailed(false);
    setFwElapsed(0);
    fwStart.current = Date.now();

    // elapsed ticker
    fwInterval.current = setInterval(() => {
      setFwElapsed(Math.floor((Date.now() - fwStart.current) / 1000));
    }, 500);

    // step progression
    let cumulative = 0;
    FW_STEP_DURATIONS.forEach((dur, i) => {
      cumulative += dur;
      const t = setTimeout(() => setFwStep(i + 1), cumulative);
      fwTimers.current.push(t);
    });

    // fail at 30s if real status not done yet
    const failT = setTimeout(() => {
      setData(prev => {
        if (prev && DONE_STATUSES.includes(prev.status)) return prev; // real done, don't fake-fail
        setFwFailed(true);
        if (fwInterval.current) clearInterval(fwInterval.current);
        return prev;
      });
    }, FW_FAIL_TIMEOUT);
    fwTimers.current.push(failT);
  }, []);

  // ── Init ─────────────────────────────────────────────
  useEffect(() => {
    startPolling();
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [startPolling]);

  // Start flywheel sim once we know it's a flywheel deploy
  useEffect(() => {
    if (data?.pairing === "gitlaunchr" && fwStep === 0 && !fwFailed) {
      startFlywheelSim();
    }
  }, [data?.pairing]);

  // Cleanup on unmount
  useEffect(() => () => {
    fwTimers.current.forEach(clearTimeout);
    if (fwInterval.current) clearInterval(fwInterval.current);
  }, []);

  // ── Retry handler ─────────────────────────────────────
  function handleRetry() {
    setRetries(r => r + 1);
    setError(null);
    setData(null);
    startPolling();
    if (data?.pairing === "gitlaunchr") startFlywheelSim();
  }

  const isFlywheel = data?.pairing === "gitlaunchr";
  const isDone     = data?.status === "done";
  const isRealFail = data?.status === "failed";

  return (
    <div className={styles.root}>
      <ScanlinesOverlay />
      <HUD />
      <main className={styles.main}>

        <div className={styles.header}>
          <Link href="/"><PixelButton variant="ghost" size="sm">← HOME</PixelButton></Link>
          <h1 className={`${styles.title} ${isFlywheel ? styles.titleFlywheel : "glow-primary"}`}>
            {isFlywheel ? "⚡ FLYWHEEL DEPLOY" : "LAUNCH STATUS"}
          </h1>
        </div>

        {error && (
          <PixelPanel variant="error" label="ERROR">
            <p className={styles.errMsg}>{error}</p>
          </PixelPanel>
        )}

        {!data && !error && (
          <div className={styles.loading}>
            <span className="blink text-cyan">LOADING</span>
            <span className={styles.dots}>...</span>
          </div>
        )}

        {data && (
          <>
            {/* Token info */}
            <PixelPanel label="TOKEN INFO" variant={isFlywheel ? "success" : "default"}>
              <div className={styles.tokenInfo}>
                <div className={styles.infoRow}>
                  <span className="hud-label">NAME</span>
                  <span className={styles.infoVal}>{data.name}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className="hud-label">SYMBOL</span>
                  <span className={`${styles.infoVal} text-cyan`}>{data.symbol}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className="hud-label">PAIRING</span>
                  <span className={`${styles.infoVal} ${isFlywheel ? "text-success" : "text-primary"}`}>
                    {isFlywheel ? "$GITLAUNCHR ⚡" : "ETH (via Bankr)"}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className="hud-label">STATUS</span>
                  <span className={`${styles.infoVal} ${
                    isDone      ? "text-success" :
                    isRealFail  ? "text-error"   : "text-primary"
                  }`}>
                    {data.status.toUpperCase()}
                    {!isDone && !isRealFail && (
                      <span className="blink" style={{ marginLeft: 6 }}>▌</span>
                    )}
                  </span>
                </div>
              </div>
            </PixelPanel>

            {/* Timeline */}
            <PixelPanel
              label="DEPLOYMENT PROGRESS"
              variant={isFlywheel ? "success" : "cyan"}
            >
              {isFlywheel ? (
                <FlywheelTimeline
                  activeStep={fwStep}
                  failed={fwFailed}
                  elapsed={fwElapsed}
                  tokenAddress={data.token_address}
                />
              ) : (
                <StatusTimeline
                  status={data.status}
                  splitterAddress={data.splitter_address}
                  tokenAddress={data.token_address}
                  bankrJobId={data.bankr_job_id}
                />
              )}
            </PixelPanel>

            {/* Flywheel timeout/fail panel */}
            {isFlywheel && (fwFailed || isRealFail) && (
              <PixelPanel variant="error" label="DEPLOY FAILED">
                <div className={styles.failPanel}>
                  <p className={styles.errMsg}>
                    The deployment timed out after 30 seconds. This can happen due to
                    network congestion or insufficient $GITLAUNCHR balance.
                    {retries > 0 && ` (attempt ${retries + 1})`}
                  </p>
                  <div className={styles.failActions}>
                    <PixelButton variant="primary" size="md" onClick={handleRetry}>
                      ↺ TRY AGAIN
                    </PixelButton>
                    <Link href="/launch/new">
                      <PixelButton variant="ghost" size="md">← BACK TO FORM</PixelButton>
                    </Link>
                  </div>
                </div>
              </PixelPanel>
            )}

            {/* Bankr fail panel */}
            {!isFlywheel && isRealFail && (
              <PixelPanel variant="error" label="DEPLOY FAILED">
                <div className={styles.failPanel}>
                  <p className={styles.errMsg}>Deployment failed. Please try again.</p>
                  <div className={styles.failActions}>
                    <PixelButton variant="primary" size="md" onClick={handleRetry}>
                      ↺ TRY AGAIN
                    </PixelButton>
                    <Link href="/launch/new">
                      <PixelButton variant="ghost" size="md">← BACK TO FORM</PixelButton>
                    </Link>
                  </div>
                </div>
              </PixelPanel>
            )}

            {/* Success CTA */}
            {isDone && data.token_address && (
              <PixelPanel variant="success" label="LIVE ON BASE">
                <div className={styles.donePanelInner}>
                  <p className={styles.doneTitle}>
                    {isFlywheel ? "⚡ Token live with $GITLAUNCHR pairing!" : "🎉 Token launched successfully!"}
                  </p>
                  <a href={`https://basescan.org/address/${data.token_address}`} target="_blank" rel="noreferrer">
                    <PixelButton variant="success" size="md">VIEW ON BASESCAN ↗</PixelButton>
                  </a>
                  {isFlywheel && (
                    <a href={`https://app.doppler.lol/tokens/base/${data.token_address}`} target="_blank" rel="noreferrer">
                      <PixelButton variant="cyan" size="md">TRADE ON DOPPLER ↗</PixelButton>
                    </a>
                  )}
                  <Link href="/launch/new">
                    <PixelButton variant="secondary" size="sm">LAUNCH ANOTHER</PixelButton>
                  </Link>
                </div>
              </PixelPanel>
            )}
          </>
        )}
      </main>
    </div>
  );
}
