"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./LaunchForm.module.css";
import PixelButton from "./PixelButton";
import PixelPanel from "./PixelPanel";

function isValidEVMAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

function isValidSymbol(sym: string): boolean {
  return /^[A-Z]{2,8}$/.test(sym);
}

interface FormState {
  name: string;
  symbol: string;
  creatorPayout: string;
  description: string;
  website: string;
  twitter: string;
}

const INIT: FormState = {
  name: "",
  symbol: "",
  creatorPayout: "",
  description: "",
  website: "",
  twitter: "",
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
    if (!isValidEVMAddress(form.creatorPayout))
      newErrors.creatorPayout = "Must be a valid 0x address";
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
        body: JSON.stringify(form),
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
            <span className={styles.feeKey}>Bankr creator share</span>
            <span className={styles.feeVal} style={{ color: "var(--primary)" }}>
              57% of fees
            </span>
          </div>
          <div className={styles.feeRow}>
            <span className={styles.feeKey}>Platform cut (10% of creator share)</span>
            <span className={styles.feeVal} style={{ color: "var(--warning)" }}>
              −5.7%
            </span>
          </div>
          <div className={`${styles.feeRow} ${styles.feeRowNet}`}>
            <span className={styles.feeKey}>Net to you</span>
            <span className={styles.feeVal} style={{ color: "var(--success)" }}>
              51.3% of total fees
            </span>
          </div>
        </div>
      </PixelPanel>

      {/* Fields */}
      <div className={styles.group}>
        <label className="hud-label" htmlFor="name">
          TOKEN NAME *
        </label>
        <input
          id="name"
          type="text"
          value={form.name}
          onChange={set("name")}
          placeholder="e.g. BuildCity Token"
          maxLength={64}
          autoComplete="off"
        />
        {errors.name && <span className={styles.err}>{errors.name}</span>}
      </div>

      <div className={styles.group}>
        <label className="hud-label" htmlFor="symbol">
          SYMBOL * (2–8 uppercase letters)
        </label>
        <input
          id="symbol"
          type="text"
          value={form.symbol}
          onChange={(e) =>
            set("symbol")({
              ...e,
              target: { ...e.target, value: e.target.value.toUpperCase() },
            })
          }
          placeholder="e.g. BCT"
          maxLength={8}
          autoComplete="off"
        />
        {errors.symbol && (
          <span className={styles.err}>{errors.symbol}</span>
        )}
      </div>

      <div className={styles.group}>
        <label className="hud-label" htmlFor="payout">
          CREATOR PAYOUT ADDRESS * (EVM)
        </label>
        <input
          id="payout"
          type="text"
          value={form.creatorPayout}
          onChange={set("creatorPayout")}
          placeholder="0x..."
          autoComplete="off"
        />
        {errors.creatorPayout && (
          <span className={styles.err}>{errors.creatorPayout}</span>
        )}
      </div>

      <div className={styles.group}>
        <label className="hud-label" htmlFor="desc">
          DESCRIPTION (optional)
        </label>
        <textarea
          id="desc"
          value={form.description}
          onChange={set("description")}
          rows={3}
          placeholder="What is this token for?"
          maxLength={512}
        />
      </div>

      <div className={styles.row2}>
        <div className={styles.group}>
          <label className="hud-label" htmlFor="website">
            WEBSITE
          </label>
          <input
            id="website"
            type="url"
            value={form.website}
            onChange={set("website")}
            placeholder="https://..."
          />
        </div>
        <div className={styles.group}>
          <label className="hud-label" htmlFor="twitter">
            TWITTER
          </label>
          <input
            id="twitter"
            type="text"
            value={form.twitter}
            onChange={set("twitter")}
            placeholder="@handle"
          />
        </div>
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
