import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ScanlinesOverlay from "@/app/components/ScanlinesOverlay";
import HUD from "@/app/components/HUD";
import PixelPanel from "@/app/components/PixelPanel";
import LaunchForm from "@/app/components/LaunchForm";
import PixelButton from "@/app/components/PixelButton";
import Link from "next/link";
import styles from "./launch-new.module.css";

export default async function LaunchNewPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/launch/new");
  }

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

        <PixelPanel label="NEW TOKEN" variant="default">
          <LaunchForm />
        </PixelPanel>

        <div className={styles.note}>
          <span className="hud-label">ℹ NOTES</span>
          <ul className={styles.noteList}>
            <li>No wallet required. Bankr deploys on your behalf.</li>
            <li>A FeeSplitter contract is deployed first to route fee splits.</li>
            <li>Max 3 launches per day per account.</li>
            <li>
              Bankr Agent API must be enabled at{" "}
              <a
                href="https://bankr.bot/settings"
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--primary)" }}
              >
                bankr.bot/settings
              </a>
              .
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
