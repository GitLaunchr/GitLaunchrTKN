"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowser } from "@/lib/supabase";
import styles from "./HUD.module.css";
import PixelButton from "./PixelButton";
import { GithubIcon, XIcon } from "./Icons";

interface HUDBadgeProps {
  label: string;
  value: string | number;
  color?: "primary" | "cyan" | "warning" | "success";
}

function HUDBadge({ label, value, color = "primary" }: HUDBadgeProps) {
  return (
    <div className={`${styles.badge} ${styles[`badge--${color}`]}`}>
      <span className={styles.badgeLabel}>{label}</span>
      <span className={styles.badgeValue}>{value}</span>
    </div>
  );
}

export default function HUD() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    // Get current session
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/launch/new`,
      },
    });
  };

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    setUser(null);
  };

  const username   = user?.user_metadata?.user_name ?? user?.email ?? "user";
  const avatarUrl  = user?.user_metadata?.avatar_url;

  return (
    <div className={styles.hud}>
      <div className={styles.starBar}>
        <span className={styles.starLabel}>ROAD TO 2.5K STARS</span>
        <div className={styles.starTrack}>
          <div className={styles.starFill} style={{ width: "97%" }} />
          <span className={styles.starCount}>2429 / 2500</span>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.hudSocials}>
          <a href="https://github.com/GitLaunchr" target="_blank" rel="noreferrer" className={styles.hudSocialLink} aria-label="GitHub">
            <GithubIcon size={14} color="var(--muted)" />
          </a>
          <a href="https://x.com/GitLaunchr" target="_blank" rel="noreferrer" className={styles.hudSocialLink} aria-label="X">
            <XIcon size={14} color="var(--muted)" />
          </a>
        </div>

        <div className={styles.badges}>
          <HUDBadge label="LIVE"    value="252" color="success" />
          <HUDBadge label="★"       value="2429" color="warning" />
        </div>

        <div className={styles.authZone}>
          {loading && <span className={`${styles.authLoading} text-muted`}>···</span>}

          {!loading && !user && (
            <PixelButton variant="primary" size="sm" onClick={handleSignIn}>
              <GithubIcon size={12} color="white" />
              SIGN IN
            </PixelButton>
          )}

          {!loading && user && (
            <div className={styles.userChip}>
              {avatarUrl && (
                <Image
                  src={avatarUrl}
                  alt={username}
                  width={22}
                  height={22}
                  className={styles.avatar}
                  unoptimized
                />
              )}
              <span className={styles.username}>@{username}</span>
              <PixelButton variant="ghost" size="sm" onClick={handleSignOut}>✕</PixelButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
