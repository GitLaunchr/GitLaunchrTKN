import { redirect } from "next/navigation";
import { getSupabaseSession } from "@/lib/auth";
import ScanlinesOverlay from "@/app/components/ScanlinesOverlay";
import HUD from "@/app/components/HUD";
import PixelPanel from "@/app/components/PixelPanel";
import LaunchForm from "@/app/components/LaunchForm";
import PixelButton from "@/app/components/PixelButton";
import Link from "next/link";
import styles from "./launch-new.module.css";

export default async function LaunchNewPage() {
  const { user } = await getSupabaseSession();

  if (!user) {
    redirect("/auth/signin?next=/launch/new");
  }

  const username  = user.user_metadata?.user_name ?? user.email ?? "user";

  return (
    <div className={styles.root}>
      <ScanlinesOverlay />
      <HUD />
      <main className={styles.main}>
        <div className={styles.header}>
          <Link href="/">
            <PixelButton variant="ghost" size="sm">← BACK</PixelButton>
          </Link>
          <h1 className={`${styles.title} glow-primary`}>LAUNCH TOKEN</h1>
          <p className={styles.sub}>
            Base mainnet · Powered by{" "}
            <span style={{ color: "var(--cyan)" }}>Bankr Agent API</span>
          </p>
        </div>

        <div className={styles.content}>
          <LaunchForm />

          <div className={styles.notes}>
            <PixelPanel label="REQUIREMENTS" variant="default">
              <ul className={styles.notesList}>
                <li>✓ Signed in as <span style={{ color: "var(--cyan)" }}>@{username}</span></li>
                <li>✓ Bankr agent access enabled</li>
                <li>✓ Payout EVM address ready</li>
                <li>✓ Up to 3 launches per day</li>
              </ul>
            </PixelPanel>
          </div>
        </div>
      </main>
    </div>
  );
}