"use client";

import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import styles from "./HUD.module.css";
import PixelButton from "./PixelButton";

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
  const { data: session, status } = useSession();

  return (
    <div className={styles.hud}>
      {/* LEFT: static star bar */}
      <div className={styles.starBar}>
        <span className={styles.starLabel}>ROAD TO 2.5K STARS</span>
        <div className={styles.starTrack}>
          <div className={styles.starFill} style={{ width: "97%" }} />
          <span className={styles.starCount}>2429 / 2500</span>
        </div>
      </div>

      {/* RIGHT: badges + auth */}
      <div className={styles.right}>
        <div className={styles.badges}>
          <HUDBadge label="DISCORD" value="105" color="primary" />
          <HUDBadge label="LIVE" value="252" color="success" />
          <HUDBadge label="★" value="2429" color="warning" />
        </div>

        <div className={styles.authZone}>
          {status === "loading" && (
            <span className={`${styles.authLoading} text-muted`}>···</span>
          )}

          {status === "unauthenticated" && (
            <PixelButton
              variant="primary"
              size="sm"
              onClick={() => signIn("github")}
            >
              ▶ SIGN IN
            </PixelButton>
          )}

          {status === "authenticated" && session.user && (
            <div className={styles.userChip}>
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "avatar"}
                  width={22}
                  height={22}
                  className={styles.avatar}
                  unoptimized
                />
              )}
              <span className={styles.username}>
                @{session.user.name ?? "user"}
              </span>
              <PixelButton
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
              >
                ✕
              </PixelButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
