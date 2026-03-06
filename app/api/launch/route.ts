import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { deployFeeSplitter } from "@/lib/deploy";
import { buildBankrPrompt, submitBankrPrompt } from "@/lib/bankr";
import { checkLaunchRateLimit } from "@/lib/rateLimit";
import { getUserByGithubId } from "@/lib/users";
import {
  isValidEVMAddress,
  isValidSymbol,
  sanitizeString,
} from "@/lib/validation";
import type { CreateLaunchBody } from "@/types";

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Get DB user ───────────────────────────────────────
  const token = (session as { token?: { githubId?: string } }).token;
  const githubId =
    (session as unknown as { token?: { githubId?: string } }).token?.githubId ??
    "";

  // Auth.js puts githubId in jwt; fallback to session name
  const dbUser = githubId
    ? await getUserByGithubId(githubId)
    : null;

  if (!dbUser) {
    return NextResponse.json(
      { error: "User not found in DB. Please sign out and back in." },
      { status: 403 }
    );
  }

  // ── Rate limit ────────────────────────────────────────
  const { allowed, remaining } = await checkLaunchRateLimit(dbUser.id);
  if (!allowed) {
    return NextResponse.json(
      {
        error: `Daily launch limit reached (3/day). Try again tomorrow.`,
        remaining: 0,
      },
      { status: 429 }
    );
  }

  // ── Parse & validate body ─────────────────────────────
  let body: CreateLaunchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name          = sanitizeString(body.name ?? "", 64);
  const symbol        = sanitizeString(body.symbol ?? "", 8).toUpperCase();
  const creatorPayout = sanitizeString(body.creatorPayout ?? "", 42);
  const description   = sanitizeString(body.description ?? "", 512);
  const website       = sanitizeString(body.website ?? "", 256);
  const twitter       = sanitizeString(body.twitter ?? "", 64);

  if (!name) {
    return NextResponse.json({ error: "Token name is required." }, { status: 400 });
  }
  if (!isValidSymbol(symbol)) {
    return NextResponse.json(
      { error: "Symbol must be 2–8 uppercase letters." },
      { status: 400 }
    );
  }
  if (!isValidEVMAddress(creatorPayout)) {
    return NextResponse.json(
      { error: "creatorPayout must be a valid EVM address." },
      { status: 400 }
    );
  }

  // ── Create initial DB row ─────────────────────────────
  const { data: launch, error: insertErr } = await supabaseAdmin
    .from("launch_requests")
    .insert({
      user_id:        dbUser.id,
      name,
      symbol,
      creator_payout: creatorPayout,
      description:    description || null,
      website:        website || null,
      twitter:        twitter || null,
      status:         "pending",
    })
    .select()
    .single();

  if (insertErr || !launch) {
    console.error("[launch/POST] insert error:", insertErr);
    return NextResponse.json({ error: "DB error creating launch." }, { status: 500 });
  }

  const launchId = launch.id as string;

  // ── Step A: Deploy FeeSplitter ────────────────────────
  let splitterAddress: `0x${string}`;
  try {
    splitterAddress = await deployFeeSplitter(creatorPayout as `0x${string}`);
  } catch (err: unknown) {
    console.error("[launch] FeeSplitter deploy error:", err);
    await supabaseAdmin
      .from("launch_requests")
      .update({ status: "failed" })
      .eq("id", launchId);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "FeeSplitter deployment failed.",
      },
      { status: 500 }
    );
  }

  await supabaseAdmin
    .from("launch_requests")
    .update({ splitter_address: splitterAddress, status: "splitter_deployed" })
    .eq("id", launchId);

  // ── Step B: Call Bankr ────────────────────────────────
  let bankrJobId: string;
  try {
    const prompt = buildBankrPrompt(name, symbol, splitterAddress);
    bankrJobId = await submitBankrPrompt(prompt);
  } catch (err: unknown) {
    const isBankrDisabled =
      err instanceof Error &&
      (err as Error & { code?: string }).code === "BANKR_AGENT_DISABLED";

    await supabaseAdmin
      .from("launch_requests")
      .update({ status: "failed" })
      .eq("id", launchId);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Bankr API call failed.",
        code: isBankrDisabled ? "BANKR_AGENT_DISABLED" : undefined,
      },
      { status: isBankrDisabled ? 403 : 500 }
    );
  }

  // ── Step C: Store job id ──────────────────────────────
  await supabaseAdmin
    .from("launch_requests")
    .update({ bankr_job_id: bankrJobId, status: "bankr_created" })
    .eq("id", launchId);

  return NextResponse.json(
    { id: launchId, remaining: remaining - 1 },
    { status: 201 }
  );
}
