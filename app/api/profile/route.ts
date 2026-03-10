import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { user } = await getSupabaseSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const githubUsername = user.user_metadata?.user_name ?? user.id;
  const { data, error } = await supabaseAdmin
    .from("users").select("*").eq("github_id", githubUsername).single();

  if (error || !data) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { user } = await getSupabaseSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const githubUsername = user.user_metadata?.user_name ?? user.id;

  let body: { twitter?: string; farcaster?: string; website?: string; bio?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const update: Record<string, string | null> = {};
  if ("twitter"   in body) update.twitter   = body.twitter?.replace(/^@/, "").trim().slice(0, 50)   || null;
  if ("farcaster" in body) update.farcaster = body.farcaster?.replace(/^@/, "").trim().slice(0, 50) || null;
  if ("website"   in body) update.website   = body.website?.trim().slice(0, 200) || null;
  if ("bio"       in body) update.bio       = body.bio?.trim().slice(0, 160)     || null;

  const { data, error } = await supabaseAdmin
    .from("users").update(update).eq("github_id", githubUsername).select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
