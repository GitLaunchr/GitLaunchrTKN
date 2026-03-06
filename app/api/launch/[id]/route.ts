import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user } = await getSupabaseSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const { data, error } = await supabaseAdmin
    .from("launch_requests")
    .select("id, name, symbol, status, splitter_address, bankr_job_id, token_address, created_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Launch not found." }, { status: 404 });
  }

  return NextResponse.json(data);
}
