"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./profile.module.css";

interface Launch {
  id: string;
  name: string;
  symbol: string;
  token_address: string | null;
  status: string;
  created_at: string;
}

interface Props {
  initialUser: Record<string, string | null> | null;
  githubUsername: string;
  avatarUrl: string;
  tokenCount: number;
  memberSince: string;
  launches: Launch[];
}

export default function ProfileEditor({
  initialUser, githubUsername, avatarUrl, tokenCount, memberSince, launches
}: Props) {
  const [form, setForm] = useState({
    twitter:   (initialUser?.twitter   ?? "") as string,
    farcaster: (initialUser?.farcaster ?? "") as string,
    website:   (initialUser?.website   ?? "") as string,
    bio:       (initialUser?.bio       ?? "") as string,
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState("");

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(f => ({ ...f, [field]: e.target.value }));
      setSaved(false);
    };
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Save failed");
      } else {
        setSaved(true);
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  function timeAgo(dateStr: string) {
    const diff  = Date.now() - new Date(dateStr).getTime();
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  return (
    <div className={styles.layout}>

      {/* LEFT — identity card */}
      <div className={styles.left}>
        <div className={styles.identityCard}>
          <div className={styles.avatarWrap}>
            {avatarUrl && (
              <Image src={avatarUrl} alt={githubUsername} width={80} height={80}
                className={styles.avatar} unoptimized />
            )}
            <div className={styles.onlineDot} />
          </div>

          <div className={styles.identity}>
            <span className={styles.username}>@{githubUsername}</span>
            <a
              href={`https://github.com/${githubUsername}`}
              target="_blank" rel="noreferrer"
              className={styles.githubLink}
            >
              ⎋ github.com/{githubUsername}
            </a>
          </div>

          {form.bio && <p className={styles.bioDisplay}>{form.bio}</p>}

          <div className={styles.socialLinks}>
            {form.twitter && (
              <a href={`https://x.com/${form.twitter}`} target="_blank" rel="noreferrer" className={styles.socialChip}>
                𝕏 @{form.twitter}
              </a>
            )}
            {form.farcaster && (
              <a href={`https://warpcast.com/${form.farcaster}`} target="_blank" rel="noreferrer" className={styles.socialChip}>
                🟣 @{form.farcaster}
              </a>
            )}
            {form.website && (
              <a href={form.website} target="_blank" rel="noreferrer" className={styles.socialChip}>
                🌐 {form.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>

          {/* Stats */}
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <span className={styles.statNum} style={{ color: "var(--primary)" }}>{tokenCount}</span>
              <span className={styles.statLbl}>TOKENS</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statNum} style={{ color: "var(--cyan)" }}>{memberSince}</span>
              <span className={styles.statLbl}>MEMBER SINCE</span>
            </div>
          </div>
        </div>

        {/* Token list */}
        {launches.length > 0 && (
          <div className={styles.tokenList}>
            <span className={styles.sectionLabel}>// MY TOKENS</span>
            {launches.map(l => (
              <div key={l.id} className={styles.tokenRow}>
                <div className={styles.tokenRowInfo}>
                  <span className={styles.tokenRowName}>{l.name}</span>
                  <span className={styles.tokenRowSymbol}>${l.symbol}</span>
                </div>
                <div className={styles.tokenRowRight}>
                  <span className={styles.tokenRowTime}>{timeAgo(l.created_at)}</span>
                  {l.token_address && (
                    <a
                      href={`https://app.doppler.lol/tokens/base/${l.token_address}`}
                      target="_blank" rel="noreferrer"
                      className={styles.tokenRowLink}
                    >
                      TRADE ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT — edit form */}
      <div className={styles.right}>
        <div className={styles.formCard}>
          <span className={styles.sectionLabel}>// EDIT PROFILE</span>

          <div className={styles.field}>
            <label className={styles.label}>BIO <span className={styles.hint}>(max 160 chars)</span></label>
            <textarea
              value={form.bio}
              onChange={set("bio")}
              placeholder="Builder, shipper, degen..."
              maxLength={160}
              rows={3}
              className={styles.textarea}
            />
            <span className={styles.charCount}>{form.bio.length}/160</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>TWITTER / X</label>
            <div className={styles.inputWrap}>
              <span className={styles.prefix}>@</span>
              <input
                type="text"
                value={form.twitter.replace(/^@/, "")}
                onChange={(e) => setForm(f => ({ ...f, twitter: e.target.value.replace(/^@/, "") }))}
                placeholder="yourhandle"
                maxLength={50}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>FARCASTER</label>
            <div className={styles.inputWrap}>
              <span className={styles.prefix}>@</span>
              <input
                type="text"
                value={form.farcaster.replace(/^@/, "")}
                onChange={(e) => setForm(f => ({ ...f, farcaster: e.target.value.replace(/^@/, "") }))}
                placeholder="yourhandle"
                maxLength={50}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>WEBSITE</label>
            <input
              type="url"
              value={form.website}
              onChange={set("website")}
              placeholder="https://..."
              maxLength={200}
              className={styles.input}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className={styles.saveBtn}
          >
            {saving ? "SAVING..." : saved ? "✓ SAVED" : "SAVE PROFILE"}
          </button>
        </div>

        <div className={styles.launchCta}>
          <span className={styles.ctaText}>Ready to launch another token?</span>
          <Link href="/launch/new">
            <button className={styles.launchBtn}>▶ LAUNCH TOKEN</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
