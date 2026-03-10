import { useEffect, useState } from "react";
import styles from "./StatusTimeline.module.css";

export type TimelineStatus =
  | "pending"
  | "splitter_deployed"
  | "bankr_created"
  | "deploying"
  | "done"
  | "failed";

/* ── Bankr steps (existing) ─────────────────────────── */
interface Step {
  key: string;
  label: string;
  sub?: string;
  activeFrom: TimelineStatus[];
  doneFrom:   TimelineStatus[];
}

const BANKR_STEPS: Step[] = [
  {
    key: "bankr_created",
    label: "Bankr job created",
    activeFrom: ["bankr_created"],
    doneFrom:   ["deploying", "done"],
  },
  {
    key: "deploying",
    label: "Deploy in progress",
    sub: "Bankr is deploying your token on Base",
    activeFrom: ["deploying"],
    doneFrom:   ["done"],
  },
  {
    key: "done",
    label: "Token live on Base",
    activeFrom: [],
    doneFrom:   ["done"],
  },
];

/* ── Flywheel steps ─────────────────────────────────── */
export type FlywheelStep =
  | "validating"
  | "submitting"
  | "deploying"
  | "pool"
  | "fees"
  | "done"
  | "failed";

const FLYWHEEL_STEPS = [
  { key: "validating", label: "Validating $GITLAUNCHR balance",  sub: "Checking your wallet holds $GITLAUNCHR" },
  { key: "submitting", label: "Submitting to Doppler",            sub: "Configuring TOKEN / $GITLAUNCHR pool" },
  { key: "deploying",  label: "Deploying token contract",         sub: "Broadcasting to Base mainnet" },
  { key: "pool",       label: "Creating liquidity pool",          sub: "Pairing with $GITLAUNCHR on Uniswap v4" },
  { key: "fees",       label: "Setting fee recipients",           sub: "1% creator · 0.5% GitLaunchr" },
  { key: "done",       label: "Token live on Base",               sub: "" },
];

function flywheelStepState(
  stepIdx: number,
  activeIdx: number,
  failed: boolean
): "done" | "active" | "pending" | "failed" {
  if (failed) {
    if (stepIdx <= activeIdx) return "failed";
    return "pending";
  }
  if (stepIdx < activeIdx) return "done";
  if (stepIdx === activeIdx) return "active";
  return "pending";
}

function bankrStepState(
  step: Step,
  current: TimelineStatus
): "done" | "active" | "pending" | "failed" {
  if (current === "failed") {
    if (step.key === "done") return "pending";
    return "failed";
  }
  if (step.doneFrom.includes(current))   return "done";
  if (step.activeFrom.includes(current)) return "active";
  return "pending";
}

/* ── Shared sub-components ──────────────────────────── */
function BlinkCursor() {
  const [vis, setVis] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setVis(v => !v), 600);
    return () => clearInterval(t);
  }, []);
  return <span className={styles.blink} style={{ opacity: vis ? 1 : 0 }}>▶</span>;
}

function ProgressBar({ pct, failed }: { pct: number; failed: boolean }) {
  return (
    <div className={styles.progressTrack}>
      <div
        className={styles.progressFill}
        style={{
          width: `${pct}%`,
          background: failed
            ? "var(--error)"
            : "linear-gradient(90deg, var(--primary), var(--success))",
        }}
      />
    </div>
  );
}

/* ── Flywheel Timeline ──────────────────────────────── */
interface FlywheelTimelineProps {
  activeStep: number;
  failed:     boolean;
  elapsed:    number;
  tokenAddress?: string | null;
}

export function FlywheelTimeline({
  activeStep, failed, elapsed, tokenAddress,
}: FlywheelTimelineProps) {
  const isDone = !failed && activeStep >= FLYWHEEL_STEPS.length;
  const pct    = Math.min((activeStep / FLYWHEEL_STEPS.length) * 100, 100);

  return (
    <div className={styles.timeline}>
      {/* progress bar */}
      <div className={styles.progressWrap}>
        <ProgressBar pct={isDone ? 100 : pct} failed={failed} />
        <span className={styles.progressLabel}>
          {failed ? "✕ FAILED" : isDone ? "✓ DONE" : `${elapsed}s elapsed`}
        </span>
      </div>

      {/* steps */}
      {FLYWHEEL_STEPS.map((step, i) => {
        const state   = activeStep === 0 && !failed
          ? "pending"
          : flywheelStepState(i, activeStep, failed);
        const isLast  = i === FLYWHEEL_STEPS.length - 1;

        return (
          <div key={step.key} className={styles.row}>
            {i > 0 && (
              <div
                className={`${styles.connector} ${
                  state === "done" || state === "active" ? styles["connector--lit"] : ""
                } ${state === "failed" ? styles["connector--failed"] : ""}`}
              />
            )}

            <div className={`${styles.step} ${styles[`step--${state}`]}`}>
              <div className={`${styles.dot} ${styles[`dot--${state}`]}`}>
                {state === "done"    && "✓"}
                {state === "active"  && <BlinkCursor />}
                {state === "pending" && "○"}
                {state === "failed"  && "✕"}
              </div>

              <div className={styles.info}>
                <span className={styles.stepLabel}>{step.label}</span>
                {(state === "active" || state === "done") && step.sub && (
                  <span className={styles.addr}>{step.sub}</span>
                )}
                {state === "active" && (
                  <span className={styles.activeDots}>
                    <BlinkDots />
                  </span>
                )}
                {step.key === "done" && state === "done" && tokenAddress && (
                  <a
                    href={`https://basescan.org/address/${tokenAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.tokenLink}
                  >
                    {tokenAddress.slice(0, 12)}…{tokenAddress.slice(-8)} ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BlinkDots() {
  const [dots, setDots] = useState("·");
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "·" : d + "·"), 400);
    return () => clearInterval(t);
  }, []);
  return <span style={{ color: "var(--muted)", fontSize: 8 }}>{dots}</span>;
}

/* ── Bankr Timeline (original, preserved) ───────────── */
interface StatusTimelineProps {
  status:           TimelineStatus;
  splitterAddress?: string | null;
  tokenAddress?:    string | null;
  bankrJobId?:      string | null;
}

export default function StatusTimeline({
  status, splitterAddress, tokenAddress, bankrJobId,
}: StatusTimelineProps) {
  return (
    <div className={styles.timeline}>
      {BANKR_STEPS.map((step, i) => {
        const state = bankrStepState(step, status);
        return (
          <div key={step.key} className={styles.row}>
            {i > 0 && (
              <div
                className={`${styles.connector} ${
                  state === "done" || state === "active" ? styles["connector--lit"] : ""
                }`}
              />
            )}
            <div className={`${styles.step} ${styles[`step--${state}`]}`}>
              <div className={`${styles.dot} ${styles[`dot--${state}`]}`}>
                {state === "done"    && "✓"}
                {state === "active"  && <span className="pulse blink">▶</span>}
                {state === "pending" && "○"}
                {state === "failed"  && "✕"}
              </div>
              <div className={styles.info}>
                <span className={styles.stepLabel}>{step.label}</span>
                {step.key === "bankr_created" && bankrJobId && (
                  <span className={styles.addr}>job: {bankrJobId.slice(0, 12)}…</span>
                )}
                {step.key === "done" && tokenAddress && (
                  <a
                    href={`https://basescan.org/address/${tokenAddress}`}
                    target="_blank" rel="noreferrer"
                    className={styles.tokenLink}
                  >
                    {tokenAddress.slice(0, 12)}…{tokenAddress.slice(-8)} ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {status === "failed" && (
        <p className={styles.errorMsg}>✕ Deployment failed. Check logs or retry.</p>
      )}
    </div>
  );
}
