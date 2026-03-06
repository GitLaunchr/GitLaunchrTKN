import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getBankrJobStatus, extractTokenAddress } from "@/lib/bankr";
import type { LaunchStatus } from "@/types";

const TERMINAL_STATUSES: LaunchStatus[] = ["done", "failed"];

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user } = await getSupabaseSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const { data: launch, error: fetchErr } = await supabaseAdmin
    .from("launch_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !launch) {
    return NextResponse.json({ error: "Launch not found." }, { status: 404 });
  }

  if (TERMINAL_STATUSES.includes(launch.status as LaunchStatus)) {
    return NextResponse.json(launch);
  }

  if (!launch.bankr_job_id) {
    return NextResponse.json(launch);
  }

  try {
    const job = await getBankrJobStatus(launch.bankr_job_id);

    let newStatus: LaunchStatus = launch.status as LaunchStatus;
    let tokenAddress: string | null = launch.token_address ?? null;

    if (job.status === "running" || job.status === "pending") {
      newStatus = "deploying";
    } else if (job.status === "completed") {
      newStatus = "done";
      if (job.output) tokenAddress = extractTokenAddress(job.output) ?? null;
    } else if (job.status === "failed") {
      newStatus = "failed";
    }

    if (newStatus !== launch.status || tokenAddress !== launch.token_address) {
      await supabaseAdmin
        .from("launch_requests")
        .update({ status: newStatus, token_address: tokenAddress, updated_at: new Date().toISOString() })
        .eq("id", id);

      return NextResponse.json({ ...launch, status: newStatus, token_address: tokenAddress });
    }
  } catch (err) {
    console.error("[status] Bankr poll error:", err);
  }

  return NextResponse.json(launch);
}
