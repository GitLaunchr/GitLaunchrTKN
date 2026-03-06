const BANKR_API_BASE = "https://api.bankr.bot";

interface PromptResponse {
  jobId: string;
}

interface JobStatusResponse {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  output?: string;
  error?: string;
}

function getHeaders(): Record<string, string> {
  const key = process.env.BANKR_API_KEY;
  if (!key) throw new Error("Missing BANKR_API_KEY");
  return {
    "Content-Type": "application/json",
    "X-API-Key": key,
  };
}

/**
 * Build the Bankr prompt for deploying a token on Base.
 * Keep this minimal and deterministic.
 */
export function buildBankrPrompt(
  name: string,
  symbol: string,
  splitterAddress: string
): string {
  return (
    `Deploy a token called ${name} with symbol ${symbol} on Base. ` +
    `Set the fee beneficiary to ${splitterAddress}. ` +
    `If additional info is needed, proceed with sensible defaults.`
  );
}

/**
 * POST /agent/prompt — submit a deployment job to Bankr.
 * Throws with code BANKR_AGENT_DISABLED on 403.
 */
export async function submitBankrPrompt(prompt: string): Promise<string> {
  const res = await fetch(`${BANKR_API_BASE}/agent/prompt`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ prompt }),
  });

  if (res.status === 403) {
    const err = new Error(
      "Bankr Agent API not enabled. Enable it at https://bankr.bot/settings."
    ) as Error & { code: string };
    err.code = "BANKR_AGENT_DISABLED";
    throw err;
  }

  if (res.status === 429) {
    throw new Error("Bankr rate limit reached. Please wait and retry.");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Bankr prompt error ${res.status}: ${body}`);
  }

  const data: PromptResponse = await res.json();
  return data.jobId;
}

/**
 * GET /agent/job/{jobId} — poll job status.
 */
export async function getBankrJobStatus(
  jobId: string
): Promise<JobStatusResponse> {
  const res = await fetch(`${BANKR_API_BASE}/agent/job/${jobId}`, {
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Bankr job status error ${res.status}: ${body}`);
  }

  return res.json();
}

/**
 * Try to extract a token contract address from the Bankr job output.
 * The output is freeform text, so we look for a 0x EVM address.
 */
export function extractTokenAddress(output: string): string | null {
  const match = output.match(/0x[0-9a-fA-F]{40}/);
  return match ? match[0] : null;
}
