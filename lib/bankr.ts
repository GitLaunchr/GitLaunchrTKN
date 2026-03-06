/**
 * lib/bankr.ts — Bankr Partner Deploy API
 * Docs: https://docs.bankr.bot/token-launching/partner-api
 * Requires: BANKR_PARTNER_KEY env var
 */

const BANKR_API_BASE = "https://api.bankr.bot";

function getHeaders(): Record<string, string> {
  const key = process.env.BANKR_PARTNER_KEY ?? process.env.BANKR_API_KEY;
  if (!key) throw new Error("Missing BANKR_PARTNER_KEY env var");
  return { "Content-Type": "application/json", "X-Partner-Key": key };
}

interface DeployRequest {
  tokenName:    string;
  tokenSymbol:  string;
  description?: string;
  image?:       string;
  websiteUrl?:  string;
  feeRecipient: { type: "x"; value: string };
  simulateOnly?: boolean;
}

interface DeployResponse {
  success:      boolean;
  tokenAddress: string;
  txHash?:      string;
  activityId:   string;
  chain:        string;
}

export async function deployTokenViaBankr(params: {
  name:           string;
  symbol:         string;
  twitterHandle:  string; // fees go here — Bankr resolves @handle to wallet
  description?:   string;
  website?:       string;
  githubUsername: string;
  avatarUrl?:     string; // GitHub avatar → token logo
}): Promise<{ tokenAddress: string; txHash: string; activityId: string }> {

  const body: DeployRequest = {
    tokenName:    params.name,
    tokenSymbol:  params.symbol,
    description:  params.description,
    image:        params.avatarUrl,
    websiteUrl:   params.website || `https://github.com/${params.githubUsername}`,
    feeRecipient: { type: "x", value: params.twitterHandle.replace(/^@/, "") },
  };

  const res = await fetch(`${BANKR_API_BASE}/token-launches/deploy`, {
    method:  "POST",
    headers: getHeaders(),
    body:    JSON.stringify(body),
  });

  if (res.status === 401) throw new Error("Invalid partner key. Check BANKR_PARTNER_KEY.");
  if (res.status === 403) {
    const err = new Error("Partner key not configured for deployment. Contact Bankr team.") as Error & { code: string };
    err.code = "BANKR_PARTNER_NOT_CONFIGURED";
    throw err;
  }
  if (res.status === 429) throw new Error("Bankr rate limit reached (50/day).");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Bankr deploy error ${res.status}: ${text}`);
  }

  const data: DeployResponse = await res.json();
  if (!data.success || !data.tokenAddress) throw new Error("Bankr deploy failed — no tokenAddress returned");

  return { tokenAddress: data.tokenAddress, txHash: data.txHash ?? "", activityId: data.activityId };
}
