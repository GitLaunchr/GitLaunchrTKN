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

export default function LaunchForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INIT);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
    if (!form.twitterHandle.trim())
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
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Special: 403 usually means Bankr agent not enabled
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
    } catch (err) {
      setApiError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {/* Fee Info Panel */}
      <PixelPanel label="FEE STRUCTURE" variant="cyan">
        <div className={styles.feeGrid}>
          <div className={styles.feeRow}>
            <span className={styles.feeKey}>Swap fee on all trades</span>
            <span className={styles.feeVal} style={{ color: "var(--cyan)" }}>1.2%</span>
          </div>
          <div className={styles.feeRow}>
            <span className={styles.feeKey}>Your creator share</span>
            <span className={styles.feeVal} style={{ color: "var(--primary)" }}>57%</span>
          </div>
          <div className={`${styles.feeRow} ${styles.feeRowNet}`}>
            <span className={styles.feeKey}>Goes directly to your @twitter</span>
            <span className={styles.feeVal} style={{ color: "var(--success)" }}>claimable at bankr.bot</span>
          </div>
        </div>
      </PixelPanel>

      {/* Fields */}
      <div className={styles.group}>
        <label className="hud-label" htmlFor="name">TOKEN NAME *</label>
        <input
          id="name" type="text" value={form.name} onChange={set("name")}
          placeholder="e.g. BuildCity Token" maxLength={64} autoComplete="off"
        />
        {errors.name && <span className={styles.err}>{errors.name}</span>}
      </div>

      <div className={styles.group}>
        <label className="hud-label" htmlFor="symbol">SYMBOL * (2–8 uppercase letters)</label>
        <input
          id="symbol" type="text" value={form.symbol}
          onChange={(e) => set("symbol")({ ...e, target: { ...e.target, value: e.target.value.toUpperCase() } })}
          placeholder="e.g. BCT" maxLength={8} autoComplete="off"
        />
        {errors.symbol && <span className={styles.err}>{errors.symbol}</span>}
      </div>

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
        <span className={styles.hint}>
          Trading fees (57% creator share) go to your Twitter wallet on Bankr.
          Claim anytime at <a href="https://bankr.bot" target="_blank" rel="noreferrer">bankr.bot</a>
        </span>
        {errors.twitterHandle && <span className={styles.err}>{errors.twitterHandle}</span>}
      </div>

      <div className={styles.group}>
        <label className="hud-label" htmlFor="desc">DESCRIPTION (optional)</label>
        <textarea
          id="desc" value={form.description} onChange={set("description")}
          rows={3} placeholder="What is this token for?" maxLength={512}
        />
      </div>

      <div className={styles.group}>
        <label className="hud-label" htmlFor="website">WEBSITE (optional)</label>
        <input
          id="website" type="url" value={form.website} onChange={set("website")}
          placeholder="https://..."
        />
      </div>

      {apiError && (
        <div className={styles.apiError}>
          <span>⚠ {apiError}</span>
        </div>
      )}

      <PixelButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={submitting}
      >
        {submitting ? "LAUNCHING" : "▶ LAUNCH TOKEN ON BASE"}
      </PixelButton>
    </form>
  );
}
