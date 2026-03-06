import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { deployFeeSplitter } from "@/lib/deploy";
import { buildBankrPrompt, submitBankrPrompt } from "@/lib/bankr";
import { checkLaunchRateLimit } from "@/lib/rateLimit";
import { isValidEVMAddress, isValidSymbol, sanitizeString } from "@/lib/validation";

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────
  const { user } = await getSupabaseSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const githubId = user.user_metadata?.user_name ?? user.id;
  const username = user.user_metadata?.user_name ?? "unknown";

  // ── Get or create DB user ─────────────────────────────
  let { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("github_id", githubId)
    .single();

  if (!dbUser) {
    const { data: newUser } = await supabaseAdmin
      .from("users")
      .upsert({ github_id: githubId, username, avatar_url: user.user_metadata?.avatar_url ?? "" }, { onConflict: "github_id" })
      .select("id")
      .single();
    dbUser = newUser;
  }

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 403 });
  }

  // ── Rate limit ────────────────────────────────────────
  const { allowed, remaining } = await checkLaunchRateLimit(dbUser.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Daily limit reached (3/day). Resets at UTC midnight.", remaining: 0 },
      { status: 429 }
    );
  }

  // ── Validate body ─────────────────────────────────────
  let body: { name?: string; symbol?: string; creatorPayout?: string; description?: string; website?: string; twitter?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name          = sanitizeString(body.name ?? "");
  const symbol        = (body.symbol ?? "").toUpperCase().trim();
  const creatorPayout = (body.creatorPayout ?? "").trim();

  if (!name)                         return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!isValidSymbol(symbol))        return NextResponse.json({ error: "Symbol must be 2–8 uppercase letters" }, { status: 400 });
  if (!isValidEVMAddress(creatorPayout)) return NextResponse.json({ error: "Invalid payout address" }, { status: 400 });

  // ── Create DB row ─────────────────────────────────────
  const { data: launch, error: insertErr } = await supabaseAdmin
    .from("launch_requests")
    .insert({
      user_id: dbUser.id,
      name, symbol,
      creator_payout: creatorPayout,
      description: sanitizeString(body.description ?? ""),
      website:     body.website ?? "",
      twitter:     body.twitter ?? "",
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr || !launch) {
    console.error("[launch] insert error:", insertErr);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // ── Deploy FeeSplitter ────────────────────────────────
  let splitterAddress: string;
  try {
    splitterAddress = await deployFeeSplitter(
      creatorPayout as `0x${string}`
    );
  } catch (err) {
    console.error("[launch] deploy error:", err);
    await supabaseAdmin.from("launch_requests").update({ status: "failed" }).eq("id", launch.id);
    return NextResponse.json({ error: "FeeSplitter deploy failed" }, { status: 500 });
  }

  await supabaseAdmin.from("launch_requests")
    .update({ splitter_address: splitterAddress, status: "splitter_deployed" })
    .eq("id", launch.id);

  // ── Submit Bankr job ──────────────────────────────────
  let bankrJobId: string;
  try {
    const prompt = buildBankrPrompt(name, symbol, splitterAddress);
    bankrJobId   = await submitBankrPrompt(prompt);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Bankr error";
    const code = (err as { code?: string }).code;
    await supabaseAdmin.from("launch_requests").update({ status: "failed" }).eq("id", launch.id);
    if (code === "BANKR_AGENT_DISABLED") {
      return NextResponse.json({ error: "Bankr agent not enabled for this API key.", code }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  await supabaseAdmin.from("launch_requests")
    .update({ bankr_job_id: bankrJobId, status: "bankr_created" })
    .eq("id", launch.id);

  return NextResponse.json({ id: launch.id, remaining: remaining - 1 });
}