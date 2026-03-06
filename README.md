# GitLaunchr 🏙

> A Git City–inspired pixel/8-bit launchpad. Launch tokens on Base mainnet via the Bankr Agent API. No wallet required in the browser.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [Environment Variables](#environment-variables)
4. [GitHub OAuth App Setup](#github-oauth-app-setup)
5. [Supabase Setup](#supabase-setup)
6. [Bankr API Key + Agent Access](#bankr-api-key--agent-access)
7. [FeeSplitter Contract](#feesplitter-contract)
8. [How Launch Works](#how-launch-works)
9. [Bankr Prompt Template](#bankr-prompt-template)
10. [Fee Math](#fee-math)
11. [Troubleshooting](#troubleshooting)
12. [File Structure](#file-structure)

---

## Architecture Overview

```
Browser (no wallet)
  │
  ├─ GitHub OAuth (NextAuth)
  │
  └─ POST /api/launch
        │
        ├─ A) Deploy FeeSplitter on Base  ← viem + PLATFORM_DEPLOYER_PRIVATE_KEY
        │       (server-side, no browser wallet needed)
        │
        ├─ B) POST https://api.bankr.bot/agent/prompt
        │       Bankr deploys the token and sets fee beneficiary = splitterAddress
        │
        └─ C) Store bankr_job_id in DB
               │
               └─ Client polls GET /api/launch/[id]/status every 2.5s
                     │
                     └─ Server polls GET https://api.bankr.bot/agent/job/{jobId}
                           └─ Extracts token_address from output when done
```

---

## Quick Start

```bash
# 1. Clone & install
git clone https://github.com/your-org/gitlaunchr
cd gitlaunchr
npm install

# 2. Set up env vars
cp .env.example .env.local
# Fill in all values (see sections below)

# 3. Run Supabase migration
# Paste contents of sql/001_init.sql into Supabase SQL Editor

# 4. Compile FeeSplitter (Foundry)
# See "FeeSplitter Contract" section below

# 5. Start dev server
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

| Variable                      | Description                                               |
|-------------------------------|-----------------------------------------------------------|
| `NEXTAUTH_URL`                | Full URL of your app (`http://localhost:3000` for dev)    |
| `NEXTAUTH_SECRET`             | Random secret ≥ 32 chars. Run: `openssl rand -hex 32`     |
| `GITHUB_CLIENT_ID`            | From your GitHub OAuth App                                |
| `GITHUB_CLIENT_SECRET`        | From your GitHub OAuth App                                |
| `SUPABASE_URL`                | Your Supabase project URL                                 |
| `SUPABASE_SERVICE_ROLE_KEY`   | Service role key (never expose to client)                 |
| `BANKR_API_KEY`               | From https://bankr.bot/settings                           |
| `BASE_RPC_URL`                | RPC endpoint for Base mainnet                             |
| `PLATFORM_TREASURY_ADDRESS`   | EVM address that receives the 10% platform fee split      |
| `PLATFORM_DEPLOYER_PRIVATE_KEY` | Private key of wallet that deploys FeeSplitter contracts |

> ⚠️ **NEVER** commit `.env.local` or any file containing `PLATFORM_DEPLOYER_PRIVATE_KEY` to git.

---

## GitHub OAuth App Setup

1. Go to **https://github.com/settings/applications/new**
2. Fill in:
   - **Application name**: GitLaunchr
   - **Homepage URL**: `http://localhost:3000` (or your production URL)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
3. Click **Register application**
4. Copy **Client ID** → `GITHUB_CLIENT_ID`
5. Generate a new **Client Secret** → `GITHUB_CLIENT_SECRET`

For production, update the callback URL to your domain.

---

## Supabase Setup

1. Create a new project at **https://supabase.com**
2. Go to **Settings → API**:
   - Copy **Project URL** → `SUPABASE_URL`
   - Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **SQL Editor** and run the contents of `sql/001_init.sql`
4. Verify tables `users` and `launch_requests` were created

---

## Bankr API Key + Agent Access

1. Go to **https://bankr.bot/settings**
2. Navigate to **API Keys** and create a new key → `BANKR_API_KEY`
3. **Enable Agent API access** — this is a separate toggle on the same page.
   Without this, all prompts return 403.
4. Make sure your Bankr account has a wallet configured on **Base mainnet**.

> 📖 Full docs: https://docs.bankr.bot/agent-api/authentication/

---

## FeeSplitter Contract

The FeeSplitter is a simple ETH splitter deployed server-side for each launch.

### Source

See `contracts/FeeSplitter.sol`.

### Compile with Foundry

```bash
# Install Foundry if needed
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Compile
forge build --contracts contracts/

# Get bytecode
cat out/FeeSplitter.sol/FeeSplitter.json | jq -r '.bytecode.object'
```

### Wire up bytecode

After compiling, paste the output hex into `lib/feeSplitter.ts`:

```ts
export const FEESPLITTER_BYTECODE = "0x<YOUR_HEX_HERE>" as `0x${string}`;
```

### Contract Summary

```solidity
constructor(
  address creatorPayout_,    // Creator's payout wallet
  address platformTreasury_, // Platform treasury (from env)
  uint256 creatorBps_,       // 9000 (90%)
  uint256 platformBps_       // 1000 (10%)
)

receive() external payable   // Accept ETH from Bankr
distributeETH()              // Split and send ETH
```

---

## How Launch Works

### Step-by-step

```
1. User fills LaunchForm → POST /api/launch

2. Server validates:
   - Auth session exists
   - Rate limit: ≤ 3 launches/day
   - name, symbol, creatorPayout validated

3. DB row created (status: pending)

4. [A] Server deploys FeeSplitter on Base
   using viem + PLATFORM_DEPLOYER_PRIVATE_KEY
   → splitter_address stored (status: splitter_deployed)

5. [B] Server POSTs to Bankr Agent API:
   POST https://api.bankr.bot/agent/prompt
   Header: X-API-Key: BANKR_API_KEY
   Body: { prompt: "Deploy a token called X..." }
   → bankr_job_id stored (status: bankr_created)

6. Client navigates to /launch/[id]
   → polls GET /api/launch/[id]/status every 2.5s

7. Server polls Bankr:
   GET https://api.bankr.bot/agent/job/{jobId}
   → When completed: extracts token address from output
   → status: done, token_address stored

8. UI shows ✓ on all timeline steps + Basescan link
```

---

## Bankr Prompt Template

The exact prompt sent to Bankr Agent API:

```
Deploy a token called {NAME} with symbol {SYMBOL} on Base. Set the fee beneficiary to {SPLITTER_ADDRESS}. If additional info is needed, proceed with sensible defaults.
```

**Example:**

```
Deploy a token called BuildCity Token with symbol BCT on Base. Set the fee beneficiary to 0xAbCd...1234. If additional info is needed, proceed with sensible defaults.
```

> Source: `lib/bankr.ts` → `buildBankrPrompt()`
>
> Keep this minimal and deterministic. Do not add dynamic instructions that could cause non-deterministic behavior.

---

## Fee Math

Bankr charges a 1.2% fee on token trades. Of that fee:

| Layer              | Share         | Amount of Total Fee |
|--------------------|---------------|---------------------|
| Bankr platform     | 43%           | 0.516%              |
| Creator (Bankr)    | 57%           | 0.684%              |

The FeeSplitter further divides the **creator's 57%**:

| Recipient          | BPS   | % of Creator Share | % of Total Fee |
|--------------------|-------|--------------------|----------------|
| Token creator      | 9000  | 90%                | **51.3%**      |
| GitLaunchr platform| 1000  | 10%                | **5.7%**       |

---

## Troubleshooting

### 403 from Bankr

**Cause**: Agent API access not enabled on your Bankr account.

**Fix**: Go to https://bankr.bot/settings → Enable "Agent API Access".

The UI surfaces this as a friendly error with a direct link.

### 429 from Bankr

**Cause**: Rate limit hit on Bankr's side.

**Fix**: Wait a few minutes and retry. The launch row stays in DB so you can monitor status.

### FeeSplitter deploy fails

1. Check `PLATFORM_DEPLOYER_PRIVATE_KEY` is set and correct.
2. Check deployer wallet has ETH on Base for gas.
3. Check `FEESPLITTER_BYTECODE` is not the placeholder string.
4. Check `BASE_RPC_URL` is reachable.

### "User not found in DB"

**Cause**: The GitHub OAuth callback ran but the DB upsert failed.

**Fix**:
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct.
- Check the `users` table exists (run migration again).
- Sign out and back in.

### Token address not extracting

Bankr's output is freeform text. The extractor looks for the first `0x[40 hex chars]` pattern.

If Bankr changes its output format, update `extractTokenAddress()` in `lib/bankr.ts`.

### Launch stuck at "bankr_created"

- The Bankr job may be queued. Wait 30–60 seconds and check again.
- Manually query: `GET https://api.bankr.bot/agent/job/{bankr_job_id}` with your API key.
- If status is `failed`, check the `error` field in the Bankr response.

---

## File Structure

```
gitlaunchr/
├── app/
│   ├── layout.tsx                    # Root layout + font
│   ├── page.tsx                      # Landing page
│   ├── page.module.css
│   ├── explore/
│   │   └── page.tsx                  # Explore stub
│   ├── launch/
│   │   ├── new/
│   │   │   └── page.tsx              # Launch form (auth-gated)
│   │   └── [id]/
│   │       └── page.tsx              # Status page (polls)
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   │   └── route.ts              # NextAuth handler
│   │   └── launch/
│   │       ├── route.ts              # POST create launch
│   │       └── [id]/
│   │           ├── route.ts          # GET launch details
│   │           └── status/
│   │               └── route.ts      # GET status + Bankr poll
│   └── components/
│       ├── HUD.tsx                   # Top HUD bar
│       ├── PixelPanel.tsx            # Panel container
│       ├── PixelButton.tsx           # Pixel button
│       ├── SkylineCanvas.tsx         # Procedural skyline + fireflies
│       ├── ScanlinesOverlay.tsx      # CRT scanlines
│       ├── LaunchForm.tsx            # Launch form
│       ├── StatusTimeline.tsx        # Deployment steps
│       └── SessionWrapper.tsx        # NextAuth provider
├── lib/
│   ├── auth.ts                       # NextAuth config
│   ├── supabase.ts                   # Supabase admin client
│   ├── bankr.ts                      # Bankr API client
│   ├── deploy.ts                     # viem FeeSplitter deploy
│   ├── feeSplitter.ts                # ABI + bytecode
│   ├── rateLimit.ts                  # Rate limit check
│   ├── users.ts                      # User DB helpers
│   └── validation.ts                 # Input validators
├── contracts/
│   └── FeeSplitter.sol               # Solidity source
├── sql/
│   └── 001_init.sql                  # Supabase migration
├── styles/
│   └── globals.css                   # Global styles + CSS vars
├── types/
│   └── index.ts                      # TypeScript types
├── .env.example
├── next.config.js
├── package.json
└── tsconfig.json
```
