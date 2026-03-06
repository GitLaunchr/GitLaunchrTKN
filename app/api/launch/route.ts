import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { deployTokenViaBankr } from "@/lib/bankr";
import { checkLaunchRateLimit } from "@/lib/rateLimit";
import { isValidSymbol, sanitizeString } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const { user } = await getSupabaseSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const githubUsername = user.user_metadata?.user_name ?? "unknown";
  const avatarUrl      = user.user_metadata?.avatar_url ?? undefined;

  // ── Get or create DB user ─────────────────────────────
  let { data: dbUser } = await supabaseAdmin
    .from("users").select("id").eq("github_id", githubUsername).single();

  if (!dbUser) {
    const { data: newUser } = await supabaseAdmin
      .from("users")
      .upsert({ github_id: githubUsername, username: githubUsername, avatar_url: user.user_metadata?.avatar_url ?? "" }, { onConflict: "github_id" })
      .select("id").single();
    dbUser = newUser;
  }

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 403 });

  // ── Rate limit ────────────────────────────────────────
  const { allowed, remaining } = await checkLaunchRateLimit(dbUser.id);
  if (!allowed) return NextResponse.json({ error: "Daily limit reached (3/day). Resets at UTC midnight.", remaining: 0 }, { status: 429 });

  // ── Validate body ─────────────────────────────────────
  let body: { name?: string; symbol?: string; twitterHandle?: string; description?: string; website?: string; };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const name          = sanitizeString(body.name ?? "");
  const symbol        = (body.symbol ?? "").toUpperCase().trim();
  const twitterHandle = (body.twitterHandle ?? "").replace(/^@/, "").trim();

  if (!name)                  return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!isValidSymbol(symbol)) return NextResponse.json({ error: "Symbol must be 2–8 uppercase letters" }, { status: 400 });
  if (!twitterHandle)         return NextResponse.json({ error: "Twitter handle is required for fee payout" }, { status: 400 });

  // ── Create DB row ─────────────────────────────────────
  const { data: launch, error: insertErr } = await supabaseAdmin
    .from("launch_requests")
    .insert({
      user_id:        dbUser.id,
      name, symbol,
      creator_payout: `@${twitterHandle}`,
      description:    sanitizeString(body.description ?? ""),
      website:        body.website ?? "",
      status:         "pending",
    })
    .select("id").single();

  if (insertErr || !launch) {
    console.error("[launch] insert error:", insertErr);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // ── Deploy via Bankr Partner API ──────────────────────
  try {
    const result = await deployTokenViaBankr({
      name, symbol,
      twitterHandle,
      description: sanitizeString(body.description ?? ""),
      website:     body.website ?? "",
      githubUsername,
      avatarUrl,
    });

    await supabaseAdmin.from("launch_requests").update({
      token_address: result.tokenAddress,
      bankr_job_id:  result.activityId,
      status:        "done",
      updated_at:    new Date().toISOString(),
    }).eq("id", launch.id);

    return NextResponse.json({ id: launch.id, tokenAddress: result.tokenAddress, txHash: result.txHash, remaining: remaining - 1 });

  } catch (err: unknown) {
    const msg  = err instanceof Error ? err.message : "Deploy error";
    const code = (err as { code?: string }).code;
    await supabaseAdmin.from("launch_requests").update({ status: "failed" }).eq("id", launch.id);
    return NextResponse.json({ error: msg, code }, { status: code ? 403 : 500 });
  }
}
