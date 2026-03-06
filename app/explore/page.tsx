import Link from "next/link";
import Image from "next/image";
import ScanlinesOverlay from "@/app/components/ScanlinesOverlay";
import HUD from "@/app/components/HUD";
import PixelPanel from "@/app/components/PixelPanel";
import PixelButton from "@/app/components/PixelButton";
import { GithubIcon } from "@/app/components/Icons";
import { supabaseAdmin } from "@/lib/supabase";
import styles from "./explore.module.css";

interface TokenRow {
  id: string;
  name: string;
  symbol: string;
  token_address: string | null;
  splitter_address: string | null;
  creator_payout: string;
  status: string;
  created_at: string;
  users: {
    username: string;
    avatar_url: string;
  } | null;
}

async function getLiveTokens(): Promise<TokenRow[]> {
  const { data, error } = await supabaseAdmin
    .from("launch_requests")
    .select("id, name, symbol, token_address, splitter_address, creator_payout, status, created_at, users(username, avatar_url)")
    .eq("status", "done")
    .not("token_address", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[explore] fetch error:", error);
    return [];
  }

  return (data ?? []).map((row) => ({ ...row, users: Array.isArray(row.users) ? row.users[0] ?? null : row.users })) as TokenRow[];
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export const revalidate = 30; // revalidate every 30s

export default async function ExplorePage() {
  const tokens = await getLiveTokens();

  return (
    <div className={styles.root}>
      <ScanlinesOverlay />
      <HUD />
      <main className={styles.main}>

        {/* HEADER */}
        <div className={styles.header}>
          <div>
            <span className={styles.tag}>// EXPLORE CITY</span>
            <h1 className={styles.title}>Tokens on GitLaunchr</h1>
            <p className={styles.sub}>
              Launched by GitHub builders via GitLaunchr · Powered by Bankr
            </p>
          </div>
          <Link href="/launch/new">
            <PixelButton variant="primary" size="md">▶ LAUNCH YOURS</PixelButton>
          </Link>
        </div>

        {/* STATS BAR */}
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statVal} style={{ color: "var(--success)" }}>{tokens.length}</span>
            <span className={styles.statLabel}>LIVE TOKENS</span>
          </div>
          <div className={styles.statDiv} />
          <div className={styles.stat}>
            <span className={styles.statVal} style={{ color: "var(--primary)" }}>BASE</span>
            <span className={styles.statLabel}>NETWORK</span>
          </div>
          <div className={styles.statDiv} />
          <div className={styles.stat}>
            <span className={styles.statVal} style={{ color: "var(--cyan)" }}>1.2%</span>
            <span className={styles.statLabel}>SWAP FEE</span>
          </div>
        </div>

        {/* TOKEN GRID */}
        {tokens.length === 0 ? (
          <PixelPanel variant="cyan" label="NO TOKENS YET">
            <div className={styles.empty}>
              <p>Launch a token on GitLaunchr.</p>
              <Link href="/launch/new">
                <PixelButton variant="primary" size="md">▶ LAUNCH NOW</PixelButton>
              </Link>
            </div>
          </PixelPanel>
        ) : (
          <div className={styles.grid}>
            {tokens.map((token) => {
              const username   = token.users?.username ?? "unknown";
              const avatarUrl  = token.users?.avatar_url ?? "";
              const dopplerUrl = token.token_address
                ? `https://app.doppler.lol/tokens/base/${token.token_address}`
                : null;
              const basescanUrl = token.token_address
                ? `https://basescan.org/address/${token.token_address}`
                : null;

              return (
                <div key={token.id} className={styles.card}>
                  {/* TOP: name + symbol + time */}
                  <div className={styles.cardTop}>
                    <div className={styles.cardName}>
                      <span className={styles.tokenName}>{token.name}</span>
                      <span className={styles.tokenSymbol}>${token.symbol}</span>
                    </div>
                    <span className={styles.cardTime}>{timeAgo(token.created_at)}</span>
                  </div>

                  {/* CREATOR */}
                  <div className={styles.creator}>
                    {avatarUrl && (
                      <Image
                        src={avatarUrl}
                        alt={username}
                        width={20}
                        height={20}
                        className={styles.avatar}
                        unoptimized
                      />
                    )}
                    <a
                      href={`https://github.com/${username}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.creatorLink}
                    >
                      <GithubIcon size={11} color="var(--muted)" />
                      <span>@{username}</span>
                    </a>
                  </div>

                  {/* CA */}
                  {token.token_address && (
                    <div className={styles.caRow}>
                      <span className={styles.caLabel}>CA</span>
                      <a
                        href={basescanUrl!}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.caAddr}
                        title={token.token_address}
                      >
                        {shortAddr(token.token_address)}
                      </a>
                      <button
                        className={styles.copyBtn}
                        onClick={undefined}
                        data-copy={token.token_address}
                        title="Copy address"
                      >
                        ⧉
                      </button>
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className={styles.actions}>
                    {dopplerUrl && (
                      <a href={dopplerUrl} target="_blank" rel="noreferrer" className={styles.actionBtn}>
                        🔀 TRADE ON DOPPLER
                      </a>
                    )}
                    {basescanUrl && (
                      <a href={basescanUrl} target="_blank" rel="noreferrer" className={styles.actionBtnSecondary}>
                        ↗ BASESCAN
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}