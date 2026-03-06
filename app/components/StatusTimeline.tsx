import styles from "./StatusTimeline.module.css";

export type TimelineStatus =
  | "pending"
  | "splitter_deployed"
  | "bankr_created"
  | "deploying"
  | "done"
  | "failed";

interface Step {
  key: TimelineStatus;
  label: string;
  activeFrom: TimelineStatus[];
  doneFrom: TimelineStatus[];
}

const STEPS: Step[] = [
  {
    key: "splitter_deployed",
    label: "FeeSplitter deployed",
    activeFrom: ["splitter_deployed"],
    doneFrom: ["bankr_created", "deploying", "done"],
  },
  {
    key: "bankr_created",
    label: "Bankr job created",
    activeFrom: ["bankr_created"],
    doneFrom: ["deploying", "done"],
  },
  {
    key: "deploying",
    label: "Deploy in progress",
    activeFrom: ["deploying"],
    doneFrom: ["done"],
  },
  {
    key: "done",
    label: "Token live on Base",
    activeFrom: [],
    doneFrom: ["done"],
  },
];

function stepState(
  step: Step,
  current: TimelineStatus
): "done" | "active" | "pending" | "failed" {
  if (current === "failed") {
    // Show everything before done as failed
    if (step.doneFrom.includes("done") && step.key === "done") return "pending";
    return "failed";
  }
  if (step.doneFrom.includes(current)) return "done";
  if (step.activeFrom.includes(current)) return "active";
  return "pending";
}

interface StatusTimelineProps {
  status: TimelineStatus;
  splitterAddress?: string | null;
  tokenAddress?: string | null;
  bankrJobId?: string | null;
}

export default function StatusTimeline({
  status,
  splitterAddress,
  tokenAddress,
  bankrJobId,
}: StatusTimelineProps) {
  return (
    <div className={styles.timeline}>
      {STEPS.map((step, i) => {
        const state = stepState(step, status);
        return (
          <div key={step.key} className={styles.row}>
            {/* Connector */}
            {i > 0 && (
              <div
                className={`${styles.connector} ${
                  state === "done" || state === "active"
                    ? styles["connector--lit"]
                    : ""
                }`}
              />
            )}

            <div className={`${styles.step} ${styles[`step--${state}`]}`}>
              {/* Dot */}
              <div className={`${styles.dot} ${styles[`dot--${state}`]}`}>
                {state === "done" && "✓"}
                {state === "active" && (
                  <span className="pulse blink">▶</span>
                )}
                {state === "pending" && "○"}
                {state === "failed" && "✕"}
              </div>

              {/* Label */}
              <div className={styles.info}>
                <span className={styles.stepLabel}>{step.label}</span>

                {/* Extra info per step */}
                {step.key === "splitter_deployed" && splitterAddress && (
                  <span className={styles.addr}>
                    {splitterAddress.slice(0, 10)}…
                    {splitterAddress.slice(-8)}
                  </span>
                )}
                {step.key === "bankr_created" && bankrJobId && (
                  <span className={styles.addr}>job: {bankrJobId.slice(0, 12)}…</span>
                )}
                {step.key === "done" && tokenAddress && (
                  <a
                    href={`https://basescan.org/address/${tokenAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.tokenLink}
                  >
                    {tokenAddress.slice(0, 12)}…
                    {tokenAddress.slice(-8)} ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {status === "failed" && (
        <p className={styles.errorMsg}>
          ✕ Deployment failed. Check logs or retry.
        </p>
      )}
    </div>
  );
}
