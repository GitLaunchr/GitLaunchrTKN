"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ScanlinesOverlay from "@/app/components/ScanlinesOverlay";
import HUD from "@/app/components/HUD";
import PixelPanel from "@/app/components/PixelPanel";
import PixelButton from "@/app/components/PixelButton";
import StatusTimeline, {
  type TimelineStatus,
} from "@/app/components/StatusTimeline";
import styles from "./launch-status.module.css";

interface LaunchData {
  id: string;
  name: string;
  symbol: string;
  status: TimelineStatus;
  splitter_address: string | null;
  bankr_job_id: string | null;
  token_address: string | null;
  created_at: string;
}

const POLL_INTERVAL_MS = 2500;
const DONE_STATUSES: TimelineStatus[] = ["done", "failed"];

export default function LaunchStatusPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<LaunchData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let timer: ReturnType<typeof setInterval>;

    async function poll() {
      try {
        const res = await fetch(`/api/launch/${id}/status`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body?.error ?? "Failed to load launch.");
          clearInterval(timer);
          return;
        }
        const json: LaunchData = await res.json();
        setData(json);

        if (DONE_STATUSES.includes(json.status)) {
          clearInterval(timer);
        }
      } catch {
        setError("Network error.");
        clearInterval(timer);
      }
    }

    poll();
    timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [id]);

  const isDone = data && DONE_STATUSES.includes(data.status);

  return (
    <div className={styles.root}>
      <ScanlinesOverlay />
      <HUD />
      <main className={styles.main}>
        <div className={styles.header}>
          <Link href="/">
            <PixelButton variant="ghost" size="sm">← HOME</PixelButton>
          </Link>
          <h1 className={`${styles.title} glow-primary`}>LAUNCH STATUS</h1>
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
            <PixelPanel label="TOKEN INFO" variant="default">
              <div className={styles.tokenInfo}>
                <div className={styles.infoRow}>
                  <span className="hud-label">NAME</span>
                  <span className={styles.infoVal}>{data.name}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className="hud-label">SYMBOL</span>
                  <span className={`${styles.infoVal} text-cyan`}>
                    {data.symbol}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className="hud-label">STATUS</span>
                  <span
                    className={`${styles.infoVal} ${
                      data.status === "done"
                        ? "text-success"
                        : data.status === "failed"
                        ? "text-error"
                        : "text-primary"
                    }`}
                  >
                    {data.status.toUpperCase()}
                    {!isDone && (
                      <span className="blink" style={{ marginLeft: 6 }}>
                        ▌
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </PixelPanel>

            {/* Timeline */}
            <PixelPanel label="DEPLOYMENT PROGRESS" variant="cyan">
              <StatusTimeline
                status={data.status}
                splitterAddress={data.splitter_address}
                tokenAddress={data.token_address}
                bankrJobId={data.bankr_job_id}
              />
            </PixelPanel>

            {/* Done CTA */}
            {data.status === "done" && data.token_address && (
              <PixelPanel variant="success" label="LIVE ON BASE">
                <div className={styles.donePanelInner}>
                  <p className={styles.doneTitle}>
                    🎉 Token launched successfully!
                  </p>
                  <a
                    href={`https://basescan.org/address/${data.token_address}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <PixelButton variant="success" size="md">
                      VIEW ON BASESCAN ↗
                    </PixelButton>
                  </a>
                  <Link href="/launch/new">
                    <PixelButton variant="secondary" size="sm">
                      LAUNCH ANOTHER
                    </PixelButton>
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
