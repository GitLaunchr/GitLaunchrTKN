import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { checkLaunchRateLimit } from "@/lib/rateLimit";
import { isValidSymbol, sanitizeString } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const { user } = await getSupabaseSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const githubUsername = user.user_metadata?.user_name ?? "unknown";
  const avatarUrl      = user.user_metadata?.avatar_url ?? undefined;

  let { data: dbUser } = await supabaseAdmin
    .from("users").select("id").eq("github_id", githubUsername).single();

  if (!dbUser) {
    const { data: newUser } = await supabaseAdmin
      .from("users")
      .upsert({ github_id: githubUsername, username: githubUsername, avatar_url: avatarUrl ?? "" }, { onConflict: "github_id" })
      .select("id").single();
    dbUser = newUser;
  }

  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 403 });

  const { allowed, remaining } = await checkLaunchRateLimit(dbUser.id);
  if (!allowed) return NextResponse.json({ error: "Daily limit reached (3/day). Resets at UTC midnight.", remaining: 0 }, { status: 429 });

  let body: {
    name?:           string;
    symbol?:         string;
    twitterHandle?:  string;
    description?:    string;
    website?:        string;
    pairing?:        "bankr" | "gitlaunchr";
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const name          = sanitizeString(body.name ?? "");
  const symbol        = (body.symbol ?? "").toUpperCase().trim();
  const twitterHandle = (body.twitterHandle ?? "").replace(/^@/, "").trim();
  const pairing       = body.pairing === "gitlaunchr" ? "gitlaunchr" : "bankr";

  if (!name)                  return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!isValidSymbol(symbol)) return NextResponse.json({ error: "Symbol must be 2–8 uppercase letters" }, { status: 400 });

  // Twitter handle only required for Bankr mode
  if (pairing === "bankr" && !twitterHandle)
    return NextResponse.json({ error: "Twitter handle is required" }, { status: 400 });

  const { data: launch, error: insertErr } = await supabaseAdmin
    .from("launch_requests")
    .insert({
      user_id:        dbUser.id,
      name,
      symbol,
      creator_payout: pairing === "bankr" ? `@${twitterHandle}` : githubUsername,
      description:    sanitizeString(body.description ?? ""),
      website:        body.website ?? "",
      pairing,
      status:         "pending",
    })
    .select("id").single();

  if (insertErr || !launch) {
    console.error("[launch] insert error:", insertErr);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // ── Flywheel mode — integration coming soon ────────────
  if (pairing === "gitlaunchr") {
    // TODO: integrate Doppler SDK directly once Partner API / Doppler access confirmed
    // For now mark as deploying so the status page shows the simulation
    await supabaseAdmin
      .from("launch_requests")
      .update({ status: "deploying" })
      .eq("id", launch.id);

    return NextResponse.json({ id: launch.id, jobId: null, remaining: remaining - 1 });
  }

  // ── Bankr mode ─────────────────────────────────────────
  const apiKey = process.env.BANKR_API_KEY;
  if (!apiKey) {
    await supabaseAdmin.from("launch_requests").update({ status: "failed" }).eq("id", launch.id);
    return NextResponse.json({ error: "Missing BANKR_API_KEY" }, { status: 500 });
  }

  const prompt = `Launch a token called "${name}" with symbol "${symbol}" on Base with a liquidity pool. Set the fee recipient to Twitter user @${twitterHandle}.`;

  const bankrRes = await fetch("https://api.bankr.bot/agent/prompt", {
    method:  "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    body:    JSON.stringify({ prompt }),
  });

  if (!bankrRes.ok) {
    const text = await bankrRes.text().catch(() => "");
    await supabaseAdmin.from("launch_requests").update({ status: "failed" }).eq("id", launch.id);
    return NextResponse.json({ error: `Bankr error: ${text}` }, { status: 500 });
  }

  const { jobId } = await bankrRes.json();

  await supabaseAdmin
    .from("launch_requests")
    .update({ bankr_job_id: jobId, status: "deploying" })
    .eq("id", launch.id);

  return NextResponse.json({ id: launch.id, jobId, remaining: remaining - 1 });
}
