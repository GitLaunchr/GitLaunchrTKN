import Link from "next/link";
import ScanlinesOverlay from "@/app/components/ScanlinesOverlay";
import SkylineCanvas from "@/app/components/SkylineCanvas";
import HUD from "@/app/components/HUD";
import PixelPanel from "@/app/components/PixelPanel";
import PixelButton from "@/app/components/PixelButton";
import PixelGif from "@/app/components/PixelGif";
import FaqAccordion from "@/app/components/FaqAccordion";
import { GithubIcon, XIcon, BaseIcon, DiscordIcon } from "@/app/components/Icons";
import styles from "./landing.module.css";

/* ── DATA ─────────────────────────────────────────────────── */
const HOW_STEPS = [
  {
    num: "01",
    scene: "github"   as const,
    color: "var(--primary)",
    title: "Sign in with GitHub",
    desc:  "One click. Your GitHub identity is all you need. No seed phrases, no wallet setup, no gas management.",
    badge: "OAUTH 2.0",
  },
  {
    num: "02",
    scene: "contract" as const,
    color: "var(--cyan)",
    title: "FeeSplitter deployed",
    desc:  "A smart contract is deployed on Base that automatically routes creator fees — 90% to you, 10% platform.",
    badge: "BASE MAINNET",
  },
  {
    num: "03",
    scene: "rocket"   as const,
    color: "var(--warning)",
    title: "Bankr launches your token",
    desc:  "GitLaunchr calls the Bankr Agent API. Bankr deploys your ERC-20 on Base and wires the FeeSplitter as beneficiary.",
    badge: "BANKR AGENT API",
  },
  {
    num: "04",
    scene: "live"     as const,
    color: "var(--success)",
    title: "Track it live",
    desc:  "Real-time status page auto-refreshes every 2.5s. Token address + Basescan link appear the moment deployment finishes.",
    badge: "LIVE ON BASE",
  },
];

const FAQS = [
  {
    q: "Do I need a crypto wallet to launch?",
    a: "No. GitLaunchr uses the Bankr Agent API to deploy on your behalf. You only need a GitHub account and a payout EVM address (where you want to receive fees). The platform deployer wallet handles gas costs.",
  },
  {
    q: "What chain does GitLaunchr deploy on?",
    a: "Base mainnet only (chain ID 8453). Base is Coinbase's Ethereum L2 — fast finality (~2s), very low gas fees, and growing ecosystem. A Basescan link is provided for every deployment.",
  },
  {
    q: "How do fees actually work?",
    a: "Bankr charges 1.2% on all token trades. Of the 57% allocated to creators by Bankr, our FeeSplitter contract routes 90% directly to your payout address and 10% to the platform. Net: you receive 51.3% of all trading fees automatically.",
  },
  {
    q: "What is the FeeSplitter contract?",
    a: "A minimal Solidity contract deployed fresh for each token launch. It holds an immutable split config (90/10 BPS) and a receive() function to accept ETH. Anyone can call distributeETH() to trigger the split — funds always go to the right addresses.",
  },
  {
    q: "How long does deployment take?",
    a: "FeeSplitter: ~5–10 seconds (one Base block confirmation). Bankr agent job: typically 30–90 seconds depending on queue. The status page auto-polls and updates in real time.",
  },
  {
    q: "What is the daily launch limit?",
    a: "3 token launches per GitHub account per 24h. This protects against Bankr API rate limits and spam. The limit resets at UTC midnight.",
  },
  {
    q: "What happens if the Bankr job fails?",
    a: "The launch record stays in the database with status 'failed'. The FeeSplitter contract will have been deployed but the token won't exist. You can view the error in logs and retry. The status page shows a clear error state.",
  },
  {
    q: "Is my payout address safe?",
    a: "Yes — it's passed to the FeeSplitter constructor as an immutable address and recorded on-chain. It is never stored in any off-chain auth system, and the platform has no ability to change it post-deployment.",
  },
];

/* ── PAGE ─────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className={styles.root}>
      <ScanlinesOverlay />

      {/* ── HERO (with skyline) ─────────────────────────── */}
      <div className={styles.heroWrap}>
        <SkylineCanvas />
        <HUD />

        <section className={styles.hero}>
          <div className={styles.heroPre}>BUILT ON BASE · POWERED BY BANKR</div>

          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleLine1}>GITLAUNCHR</span>
            <span className={styles.heroTitleLine2}>
              Launch tokens.<br />Keep your fees.
            </span>
          </h1>

          <p className={styles.heroSub}>
            A pixel city for GitHub builders. Sign in once, get a
            FeeSplitter deployed, and go live on Base — no wallet required.
          </p>

          <div className={styles.heroCtas}>
            <Link href="/launch/new">
              <PixelButton variant="primary" size="lg">▶ LAUNCH YOUR TOKEN</PixelButton>
            </Link>
            <Link href="/">
              <PixelButton variant="secondary" size="lg">🏙 ENTER THE CITY</PixelButton>
            </Link>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatVal} style={{ color: "var(--success)" }}>1,284</span>
              <span className={styles.heroStatLabel}>Tokens launched</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatVal} style={{ color: "var(--warning)" }}>$2.1M</span>
              <span className={styles.heroStatLabel}>Fee volume</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatVal} style={{ color: "var(--cyan)" }}>~60s</span>
              <span className={styles.heroStatLabel}>Avg deploy time</span>
            </div>
          </div>
        </section>
      </div>

      {/* ════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════ */}
      <section className={styles.section} id="how">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>// HOW IT WORKS</span>
            <h2 className={styles.sectionTitle}>From GitHub to Base in 4 steps</h2>
            <p className={styles.sectionSub}>
              No MetaMask. No private keys in the browser. No manual gas.
              Just sign in and launch.
            </p>
          </div>

          {/* TIMELINE */}
          <div className={styles.timeline}>
            {HOW_STEPS.map((step, i) => (
              <div key={step.num} className={styles.timelineRow}>

                {/* LEFT: number + connector */}
                <div className={styles.timelineLeft}>
                  <div
                    className={styles.timelineNum}
                    style={{ borderColor: step.color, color: step.color }}
                  >
                    {step.num}
                  </div>
                  {i < HOW_STEPS.length - 1 && (
                    <div
                      className={styles.timelineConnector}
                      style={{ background: `linear-gradient(to bottom, ${step.color}, ${HOW_STEPS[i + 1].color})` }}
                    />
                  )}
                </div>

                {/* RIGHT: card */}
                <div
                  className={styles.timelineCard}
                  style={{ borderColor: `${step.color}44` }}
                >
                  <div className={styles.timelineCardHead}>
                    <div>
                      <div className={styles.timelineBadge} style={{ color: step.color, borderColor: `${step.color}55` }}>
                        {step.badge}
                      </div>
                      <h3 className={styles.timelineTitle} style={{ color: step.color }}>
                        {step.title}
                      </h3>
                      <p className={styles.timelineDesc}>{step.desc}</p>
                    </div>
                    <div className={styles.timelineGif}>
                      <PixelGif scene={step.scene} size={80} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FEE BREAKDOWN
      ════════════════════════════════════════════════ */}
      <section className={`${styles.section} ${styles.sectionDark}`} id="fees">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>// FEE STRUCTURE</span>
            <h2 className={styles.sectionTitle}>Transparent. On-chain. Automatic.</h2>
            <p className={styles.sectionSub}>
              Every token launched through GitLaunchr gets a dedicated FeeSplitter contract.
              Fees flow directly to your wallet — no claiming, no middleman.
            </p>
          </div>

          {/* BIG VISUAL BAR */}
          <div className={styles.feeViz}>
            <div className={styles.feeBarLabel}>
              <span style={{ color: "var(--muted)" }}>1.2% total fee on every trade</span>
            </div>

            <div className={styles.feeBar}>
              <div className={styles.feeSegYou}>
                <span className={styles.feeSegLabel}>YOU</span>
                <span className={styles.feeSegPct}>51.3%</span>
              </div>
              <div className={styles.feeSegPlatform}>
                <span className={styles.feeSegLabel}>PLATFORM</span>
                <span className={styles.feeSegPct}>5.7%</span>
              </div>
              <div className={styles.feeSegBankr}>
                <span className={styles.feeSegLabel}>BANKR</span>
                <span className={styles.feeSegPct}>43%</span>
              </div>
            </div>

            {/* MATH CARDS */}
            <div className={styles.feeMathGrid}>
              <PixelPanel variant="success" label="CREATOR NET">
                <div className={styles.feeMathCard}>
                  <PixelGif scene="token" size={52} />
                  <div className={styles.feeMathInfo}>
                    <div className={styles.feeMathBig} style={{ color: "var(--success)" }}>51.3%</div>
                    <div className={styles.feeMathSub}>of total trading fees</div>
                    <div className={styles.feeMathFormula}>
                      Bankr 57% × FeeSplitter 90%
                    </div>
                  </div>
                </div>
              </PixelPanel>

              <PixelPanel variant="default" label="PLATFORM CUT">
                <div className={styles.feeMathCard}>
                  <PixelGif scene="split" size={52} />
                  <div className={styles.feeMathInfo}>
                    <div className={styles.feeMathBig} style={{ color: "var(--warning)" }}>5.7%</div>
                    <div className={styles.feeMathSub}>of total trading fees</div>
                    <div className={styles.feeMathFormula}>
                      Bankr 57% × FeeSplitter 10%
                    </div>
                  </div>
                </div>
              </PixelPanel>

              <PixelPanel variant="default" label="BANKR SHARE">
                <div className={styles.feeMathCard}>
                  <PixelGif scene="contract" size={52} />
                  <div className={styles.feeMathInfo}>
                    <div className={styles.feeMathBig} style={{ color: "var(--muted)" }}>43%</div>
                    <div className={styles.feeMathSub}>of total trading fees</div>
                    <div className={styles.feeMathFormula}>
                      Bankr platform share
                    </div>
                  </div>
                </div>
              </PixelPanel>
            </div>

            {/* SPLITTER EXPLAINER */}
            <div className={styles.splitterExplainer}>
              <div className={styles.splitterDiagram}>
                <div className={styles.splitterNode} style={{ borderColor: "var(--warning)" }}>
                  <span style={{ color: "var(--warning)" }}>TRADE FEE</span>
                  <span style={{ fontSize: "6px", color: "var(--muted)" }}>1.2% of swap</span>
                </div>
                <div className={styles.splitterArrow}>→</div>
                <div className={styles.splitterNode} style={{ borderColor: "var(--primary)" }}>
                  <span style={{ color: "var(--primary)" }}>BANKR</span>
                  <span style={{ fontSize: "6px", color: "var(--muted)" }}>routes 57%</span>
                </div>
                <div className={styles.splitterArrow}>→</div>
                <div className={styles.splitterNode} style={{ borderColor: "var(--cyan)" }}>
                  <span style={{ color: "var(--cyan)" }}>FEESPLITTER</span>
                  <span style={{ fontSize: "6px", color: "var(--muted)" }}>on-chain contract</span>
                </div>
                <div className={styles.splitterBranch}>
                  <div className={styles.splitterBranchLine} />
                  <div className={styles.splitterBranchItems}>
                    <div className={styles.splitterNode} style={{ borderColor: "var(--success)" }}>
                      <span style={{ color: "var(--success)" }}>YOUR WALLET</span>
                      <span style={{ fontSize: "6px", color: "var(--muted)" }}>90% → 51.3%</span>
                    </div>
                    <div className={styles.splitterNode} style={{ borderColor: "var(--muted)" }}>
                      <span style={{ color: "var(--muted)" }}>PLATFORM</span>
                      <span style={{ fontSize: "6px", color: "var(--muted)" }}>10% → 5.7%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FAQ ACCORDION
      ════════════════════════════════════════════════ */}
      <section className={styles.section} id="faq">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTag}>// FAQ</span>
            <h2 className={styles.sectionTitle}>Common questions</h2>
            <p className={styles.sectionSub}>
              Everything you need to know before launching.
            </p>
          </div>

          <FaqAccordion items={FAQS} />
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════ */}
      <section className={`${styles.section} ${styles.sectionDark}`}>
        <div className={styles.ctaBanner}>
          <PixelPanel variant="cyan">
            <div className={styles.ctaInner}>
              <PixelGif scene="rocket" size={72} />
              <div className={styles.ctaText}>
                <h2 className={`${styles.ctaTitle} glow-cyan`}>
                  Ready to launch?
                </h2>
                <p className={styles.ctaSub}>
                  Sign in with GitHub. Fill the form. Token live in under 2 minutes.
                </p>
              </div>
              <div className={styles.ctaBtns}>
                <Link href="/launch/new">
                  <PixelButton variant="primary" size="lg">▶ LAUNCH NOW</PixelButton>
                </Link>
                <Link href="/">
                  <PixelButton variant="secondary" size="sm">← BACK TO CITY</PixelButton>
                </Link>
              </div>
            </div>
          </PixelPanel>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════ */}
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>

          {/* Brand */}
          <div className={styles.footerBrand}>
            <span className={`${styles.footerLogo} glow-primary`}>GITLAUNCHR</span>
            <p className={styles.footerDesc}>
              A city of GitHub builders.<br />
              Launch tokens on Base. Keep your fees.
            </p>
            <div className={styles.footerSocials}>
              <a href="https://github.com" target="_blank" rel="noreferrer"
                className={styles.socialBtn} aria-label="GitHub">
                <GithubIcon size={16} color="var(--muted)" />
                <span>GitHub</span>
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer"
                className={styles.socialBtn} aria-label="X">
                <XIcon size={16} color="var(--muted)" />
                <span>X / Twitter</span>
              </a>
              <a href="https://discord.gg" target="_blank" rel="noreferrer"
                className={styles.socialBtn} aria-label="Discord">
                <DiscordIcon size={16} color="var(--muted)" />
                <span>Discord</span>
              </a>
            </div>
          </div>

          {/* Product */}
          <div className={styles.footerCol}>
            <span className="hud-label">PRODUCT</span>
            <Link href="/launch/new" className={styles.footerLink}>Launch Token</Link>
            <Link href="/explore"    className={styles.footerLink}>Explore City</Link>
            <Link href="/"           className={styles.footerLink}>Home</Link>
          </div>

          {/* Docs */}
          <div className={styles.footerCol}>
            <span className="hud-label">RESOURCES</span>
            <a href="https://docs.bankr.bot"                   target="_blank" rel="noreferrer" className={styles.footerLink}>Bankr Docs</a>
            <a href="https://docs.bankr.bot/agent-api/overview/" target="_blank" rel="noreferrer" className={styles.footerLink}>Agent API</a>
            <a href="https://basescan.org"                      target="_blank" rel="noreferrer" className={styles.footerLink}>Basescan</a>
            <a href="https://base.org"                          target="_blank" rel="noreferrer" className={styles.footerLink}>Base Network</a>
          </div>

          {/* Chain info */}
          <div className={styles.footerCol}>
            <span className="hud-label">NETWORK</span>
            <div className={styles.chainBadge}>
              <BaseIcon size={14} color="var(--primary)" />
              <span>Base Mainnet</span>
            </div>
            <div className={styles.footerMeta}>Chain ID: 8453</div>
            <div className={styles.footerMeta}>RPC: mainnet.base.org</div>
            <div className={styles.footerMeta}>Explorer: basescan.org</div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>© 2025 GitLaunchr — Built on Base · Powered by Bankr</span>
          <div className={styles.footerBottomLinks}>
            <span className={styles.footerBottomLink}>No wallet required</span>
            <span style={{ color: "var(--border)" }}>·</span>
            <span className={styles.footerBottomLink}>Open source</span>
            <span style={{ color: "var(--border)" }}>·</span>
            <span className={styles.footerBottomLink}>Fees on-chain</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
