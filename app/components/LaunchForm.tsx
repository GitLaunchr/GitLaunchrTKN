"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./LaunchForm.module.css";
import PixelButton from "./PixelButton";
import PixelPanel from "./PixelPanel";

function isValidSymbol(sym: string): boolean {
  return /^[A-Z]{2,8}$/.test(sym);
}

interface FormState {
  name: string;
  symbol: string;
  twitterHandle: string;
  description: string;
  website: string;
}

const INIT: FormState = {
  name: "",
  symbol: "",
  twitterHandle: "",
  description: "",
  website: "",
};

/* ── Flywheel panel ─────────────────────────────────────────── */
function FlywheelPanel() {
  const [feeTarget, setFeeTarget]           = useState<"self" | "other">("self");
  const [githubRecipient, setGithubRecipient] = useState("");

  const recipientLabel =
    feeTarget === "other" && githubRecipient.trim()
      ? `@${githubRecipient.trim()}`
      : "You (creator)";

  return (
    <div className={styles.flywheelPanel}>

      {/* header */}
      <span className={styles.flywheelTitle}>⚡ GITLAUNCHR FLYWHEEL</span>

      {/* explanation */}
      <p className={styles.flywheelDesc}>
        Your token pairs with{" "}
        <span className={styles.green}>$GITLAUNCHR</span> instead of ETH.
        Every trade creates demand for{" "}
        <span className={styles.green}>$GITLAUNCHR</span>, which is bullish
        for both tokens.
      </p>

      {/* fee recipient section */}
      <div className={styles.flywheelSection}>
        <span className={styles.flywheelSectionLabel}>FEE RECIPIENT</span>

        {/* self / other toggle */}
        <div className={styles.miniToggle}>
          {(["self", "other"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFeeTarget(opt)}
              className={`${styles.miniToggleBtn} ${feeTarget === opt ? styles.miniToggleBtnActive : ""}`}
            >
              <span className={styles.miniToggleBtnLabel}>
                {opt === "self" ? "Myself" : "Someone else"}
              </span>
              <span className={styles.miniToggleBtnSub}>
                {opt === "self" ? "my GitHub" : "any GitHub user"}
              </span>
            </button>
          ))}
        </div>

        {/* github input — only when "other" */}
        <div
          className={styles.slideDown}
          style={{ maxHeight: feeTarget === "other" ? 80 : 0, opacity: feeTarget === "other" ? 1 : 0 }}
        >
          <div className={styles.githubInput}>
            <span className={styles.githubIcon}>🐙</span>
            <span className={styles.githubBase}>github.com/</span>
            <input
              type="text"
              value={githubRecipient}
              onChange={(e) => setGithubRecipient(e.target.value.replace(/\s/g, ""))}
              placeholder="username"
              autoComplete="off"
              className={styles.githubInputField}
            />
          </div>
          <span className={styles.hint}>They'll receive 1% of all swap fees — forever.</span>
        </div>

        {/* self note */}
        <div
          className={styles.slideDown}
          style={{ maxHeight: feeTarget === "self" ? 24 : 0, opacity: feeTarget === "self" ? 1 : 0 }}
        >
          <span className={styles.hint}>Fees go to your GitHub account — claimable at bankr.bot.</span>
        </div>
      </div>

      {/* fee breakdown */}
      <div className={styles.flywheelSection}>
        <span className={styles.flywheelSectionLabel}>FEE SPLIT ON ALL TRADES</span>
        {([
          { label: recipientLabel, val: "1.0%", cls: styles.dotBlue },
          { label: "GitLaunchr",   val: "0.5%", cls: styles.dotGreen },
          { label: "Protocol",     val: "0.5%", cls: styles.dotMuted },
        ] as const).map(({ label, val, cls }) => (
          <div key={label} className={styles.feeRow}>
            <div className={styles.feeKey}>
              <span className={`${styles.dot} ${cls}`} />
              <span>{label}</span>
            </div>
            <span className={`${styles.feeVal} ${cls === styles.dotBlue ? styles.feeValBlue : cls === styles.dotGreen ? styles.feeValGreen : ""}`}>
              {val}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.flywheelNote}>
        ✦ Fees are claimable anytime on-chain — no middleman.
      </div>
    </div>
  );
}

/* ── Main form ──────────────────────────────────────────────── */
export default function LaunchForm() {
  const router   = useRouter();
  const [form, setForm]       = useState<FormState>(INIT);
  const [errors, setErrors]   = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError]     = useState<string | null>(null);
  const [pairing, setPairing]       = useState<"bankr" | "gitlaunchr">("bankr");

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function validate(): boolean {
    const newErrors: Partial<FormState> = {};
    if (!form.name.trim()) newErrors.name = "Required";
    if (!isValidSymbol(form.symbol))
      newErrors.symbol = "2-8 uppercase letters only";
    if (pairing === "bankr" && !form.twitterHandle.trim())
      newErrors.twitterHandle = "Required — your @twitter handle to receive fees";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError(null);

    try {
      const res = await fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          twitterHandle: form.twitterHandle.replace(/^@/, ""),
          pairing,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 || data?.code === "BANKR_AGENT_DISABLED") {
          setApiError(
            "Bankr Agent API access not enabled. Please enable it at https://bankr.bot/settings and try again."
          );
        } else {
          setApiError(data?.error ?? "Unknown error occurred.");
        }
        return;
      }

      router.push(`/launch/${data.id}`);
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>

      {/* Token name + symbol */}
      <div className={styles.row2}>
        <div className={styles.group}>
          <label className="hud-label" htmlFor="name">TOKEN NAME *</label>
          <input
            id="name" type="text" value={form.name} onChange={set("name")}
            placeholder="e.g. BuildCity Token" maxLength={64} autoComplete="off"
          />
          {errors.name && <span className={styles.err}>{errors.name}</span>}
        </div>
        <div className={styles.group}>
          <label className="hud-label" htmlFor="symbol">SYMBOL * (2–8 letters)</label>
          <input
            id="symbol" type="text" value={form.symbol}
            onChange={(e) => set("symbol")({ ...e, target: { ...e.target, value: e.target.value.toUpperCase() } })}
            placeholder="e.g. BCT" maxLength={8} autoComplete="off"
          />
          {errors.symbol && <span className={styles.err}>{errors.symbol}</span>}
        </div>
      </div>

      {/* Twitter — only visible in Bankr mode */}
      <div
        className={styles.slideDown}
        style={{ maxHeight: pairing === "bankr" ? 100 : 0, opacity: pairing === "bankr" ? 1 : 0 }}
      >
        <div className={styles.group}>
          <label className="hud-label" htmlFor="twitterHandle">
            TWITTER HANDLE * — fees land here, claim at bankr.bot
          </label>
          <div className={styles.inputPrefix}>
            <span className={styles.prefix}>@</span>
            <input
              id="twitterHandle" type="text"
              value={form.twitterHandle.replace(/^@/, "")}
              onChange={(e) => set("twitterHandle")({ ...e, target: { ...e.target, value: e.target.value.replace(/^@/, "") } })}
              placeholder="yourhandle"
              autoComplete="off"
            />
          </div>
          {errors.twitterHandle && <span className={styles.err}>{errors.twitterHandle}</span>}
        </div>
      </div>

      {/* Description */}
      <div className={styles.group}>
        <label className="hud-label" htmlFor="desc">DESCRIPTION (optional)</label>
        <textarea
          id="desc" value={form.description} onChange={set("description")}
          rows={3} placeholder="What is this token for?" maxLength={512}
        />
      </div>

      {/* Website */}
      <div className={styles.group}>
        <label className="hud-label" htmlFor="website">WEBSITE (optional)</label>
        <input
          id="website" type="url" value={form.website} onChange={set("website")}
          placeholder="https://..."
        />
      </div>

      {/* ── Pairing toggle ── */}
      <div className={styles.group}>
        <label className="hud-label">LIQUIDITY PAIRING</label>
        <div className={styles.pairingToggle}>
          {/* sliding highlight */}
          <div
            className={styles.pairingSlider}
            style={{
              left: pairing === "bankr" ? 0 : "50%",
              background: pairing === "bankr" ? "rgba(78,161,255,0.12)" : "rgba(44,255,183,0.10)",
              borderRight: pairing === "bankr" ? "2px solid var(--primary)" : "none",
              borderLeft: pairing === "gitlaunchr" ? "2px solid var(--success)" : "none",
            }}
          />
          {(["bankr", "gitlaunchr"] as const).map((opt) => {
            const active   = pairing === opt;
            const isBankr  = opt === "bankr";
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setPairing(opt)}
                className={`${styles.pairingBtn} ${active ? (isBankr ? styles.pairingBtnActiveBlue : styles.pairingBtnActiveGreen) : ""}`}
                style={{ borderRight: isBankr ? "1px solid var(--border)" : "none" }}
              >
                <span className={styles.pairingBtnLabel}>
                  {isBankr ? "via BANKR" : "via $GITLAUNCHR"}
                </span>
                <span className={styles.pairingBtnSub}>
                  {isBankr ? "default" : "flywheel ⚡"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bankr fee info */}
      <div
        className={styles.slideDown}
        style={{ maxHeight: pairing === "bankr" ? 120 : 0, opacity: pairing === "bankr" ? 1 : 0 }}
      >
        <PixelPanel label="FEE STRUCTURE" variant="cyan">
          <div className={styles.feeGrid}>
            <div className={styles.feeRow}>
              <span className={styles.feeKey}><span className={styles.dot} /> Swap fee on all trades</span>
              <span className={styles.feeVal} style={{ color: "var(--cyan)" }}>1.2%</span>
            </div>
            <div className={styles.feeRow}>
              <span className={styles.feeKey}><span className={styles.dot} /> Your creator share</span>
              <span className={styles.feeVal} style={{ color: "var(--primary)" }}>57%</span>
            </div>
            <div className={`${styles.feeRow} ${styles.feeRowNet}`}>
              <span className={styles.feeKey}>Goes directly to your @twitter</span>
              <span className={styles.feeVal} style={{ color: "var(--success)" }}>claimable at bankr.bot</span>
            </div>
          </div>
        </PixelPanel>
      </div>

      {/* Flywheel panel */}
      <div
        className={styles.slideDown}
        style={{ maxHeight: pairing === "gitlaunchr" ? 600 : 0, opacity: pairing === "gitlaunchr" ? 1 : 0 }}
      >
        <FlywheelPanel />
      </div>

      {apiError && (
        <div className={styles.apiError}>
          <span>⚠ {apiError}</span>
        </div>
      )}

      <PixelButton
        type="submit"
        variant={pairing === "gitlaunchr" ? "success" : "primary"}
        size="lg"
        fullWidth
        loading={submitting}
      >
        {submitting
          ? "LAUNCHING..."
          : pairing === "gitlaunchr"
          ? "⚡ LAUNCH WITH $GITLAUNCHR"
          : "▶ LAUNCH TOKEN ON BASE"}
      </PixelButton>

    </form>
  );
}
