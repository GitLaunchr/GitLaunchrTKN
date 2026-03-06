import Link from "next/link";
import ScanlinesOverlay from "@/app/components/ScanlinesOverlay";
import HUD from "@/app/components/HUD";
import PixelPanel from "@/app/components/PixelPanel";
import PixelButton from "@/app/components/PixelButton";
import styles from "./explore.module.css";

export default function ExplorePage() {
  return (
    <div className={styles.root}>
      <ScanlinesOverlay />
      <HUD />
      <main className={styles.main}>
        <PixelPanel label="EXPLORE CITY" variant="cyan">
          <div className={styles.inner}>
            <p className={styles.label}>COMING SOON</p>
            <p className={styles.sub}>
              Browse GitHub builders and their tokens on Base.
            </p>
            <Link href="/">
              <PixelButton variant="secondary" size="md">
                ← BACK TO CITY
              </PixelButton>
            </Link>
          </div>
        </PixelPanel>
      </main>
    </div>
  );
}
