"use client";
import styles from "./PixelGif.module.css";

type Scene = "rocket" | "contract" | "token" | "split" | "github" | "live";

interface PixelGifProps {
  scene: Scene;
  size?: number;
}

// Each scene is a pure CSS pixel-art animation
export default function PixelGif({ scene, size = 80 }: PixelGifProps) {
  return (
    <div
      className={`${styles.wrap} ${styles[`scene--${scene}`]}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {scene === "rocket" && <RocketScene />}
      {scene === "contract" && <ContractScene />}
      {scene === "token" && <TokenScene />}
      {scene === "split" && <SplitScene />}
      {scene === "github" && <GithubScene />}
      {scene === "live" && <LiveScene />}
    </div>
  );
}

/* ── ROCKET ─────────────────────────────────────────────────── */
function RocketScene() {
  return (
    <div className={styles.rocketWrap}>
      <div className={styles.rocket}>
        {/* body */}
        <div className={styles.rocketBody} />
        {/* window */}
        <div className={styles.rocketWindow} />
        {/* flame */}
        <div className={styles.flame1} />
        <div className={styles.flame2} />
      </div>
      {/* stars */}
      <div className={styles.star1} />
      <div className={styles.star2} />
      <div className={styles.star3} />
    </div>
  );
}

/* ── CONTRACT ───────────────────────────────────────────────── */
function ContractScene() {
  return (
    <div className={styles.contractWrap}>
      <div className={styles.contractDoc}>
        <div className={styles.docLine} />
        <div className={styles.docLine} style={{ width: "70%" }} />
        <div className={styles.docLine} style={{ width: "85%" }} />
        <div className={styles.docLine} style={{ width: "50%" }} />
      </div>
      <div className={styles.checkmark} />
    </div>
  );
}

/* ── TOKEN ──────────────────────────────────────────────────── */
function TokenScene() {
  return (
    <div className={styles.tokenWrap}>
      <div className={styles.coin}>
        <span className={styles.coinText}>$</span>
      </div>
      <div className={styles.sparkle1} />
      <div className={styles.sparkle2} />
      <div className={styles.sparkle3} />
      <div className={styles.sparkle4} />
    </div>
  );
}

/* ── SPLIT ──────────────────────────────────────────────────── */
function SplitScene() {
  return (
    <div className={styles.splitWrap}>
      <div className={styles.splitCoin} />
      <div className={styles.splitArrowL} />
      <div className={styles.splitArrowR} />
      <div className={styles.splitWallet1} />
      <div className={styles.splitWallet2} />
    </div>
  );
}

/* ── GITHUB ─────────────────────────────────────────────────── */
function GithubScene() {
  return (
    <div className={styles.githubWrap}>
      <div className={styles.ghAvatar} />
      <div className={styles.ghDot} />
      <div className={styles.ghLine1} />
      <div className={styles.ghLine2} />
    </div>
  );
}

/* ── LIVE ───────────────────────────────────────────────────── */
function LiveScene() {
  return (
    <div className={styles.liveWrap}>
      <div className={styles.liveDot} />
      <div className={styles.liveRing1} />
      <div className={styles.liveRing2} />
      <div className={styles.liveText}>LIVE</div>
    </div>
  );
}
