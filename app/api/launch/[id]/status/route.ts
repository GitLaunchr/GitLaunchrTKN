import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { LaunchStatus } from "@/types";

const TERMINAL: LaunchStatus[] = ["done", "failed"];

function extractTokenAddress(text: string): string | null {
  const keywords = ["deployed at", "token address", "contract address", "launched at", "address:"];
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    const idx = lower.indexOf(kw);
    if (idx !== -1) {
      const m = text.slice(idx).match(/0x[0-9a-fA-F]{40}/);
      if (m) return m[0];
    }
  }
  const all = [...text.matchAll(/0x[0-9a-fA-F]{40}/g)];
  return all.length > 0 ? all[all.length - 1][0] : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user } = await getSupabaseSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: launch, error } = await supabaseAdmin
    .from("launch_requests").select("*").eq("id", params.id).single();

  if (error || !launch) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ── Flywheel mode — no Bankr polling needed ────────────
  // The status page handles its own simulation client-side.
  // We just return the launch data with pairing field.
  if (launch.pairing === "gitlaunchr") {
    return NextResponse.json(launch);
  }

  // Already terminal — return as-is
  if (TERMINAL.includes(launch.status as LaunchStatus)) return NextResponse.json(launch);

  // No job yet
  if (!launch.bankr_job_id) return NextResponse.json(launch);

  // ── Poll Bankr (Bankr mode only) ───────────────────────
  const apiKey = process.env.BANKR_API_KEY;
  if (!apiKey) return NextResponse.json(launch);

  try {
    const res = await fetch(`https://api.bankr.bot/agent/job/${launch.bankr_job_id}`, {
      headers: { "X-API-Key": apiKey },
      cache:   "no-store",
    });

    if (!res.ok) return NextResponse.json(launch);

    const job = await res.json();

    let newStatus: LaunchStatus     = launch.status as LaunchStatus;
    let tokenAddress: string | null = launch.token_address ?? null;

    if (job.status === "pending" || job.status === "processing") {
      newStatus = "deploying";
    } else if (job.status === "completed") {
      const text = job.response ?? job.output ?? "";
      tokenAddress = extractTokenAddress(text);
      newStatus    = tokenAddress ? "done" : "failed";
    } else if (job.status === "failed") {
      newStatus = "failed";
    }

    if (newStatus !== launch.status || tokenAddress !== launch.token_address) {
      await supabaseAdmin.from("launch_requests").update({
        status:        newStatus,
        token_address: tokenAddress,
        updated_at:    new Date().toISOString(),
      }).eq("id", launch.id);
    }

    return NextResponse.json({ ...launch, status: newStatus, token_address: tokenAddress });

  } catch (err) {
    console.error("[status] poll error:", err);
    return NextResponse.json(launch);
  }
}
