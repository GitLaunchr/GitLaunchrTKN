import { supabaseAdmin } from "./supabase";

const MAX_DAILY_LAUNCHES = 3;

/**
 * Check if a user has exceeded their daily launch limit.
 * Returns true if they're allowed to launch.
 */
export async function checkLaunchRateLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabaseAdmin
    .from("launch_requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfDay.toISOString());

  if (error) {
    // If we can't check, allow (fail open — don't block users on DB issues)
    console.error("[rateLimit] DB error:", error);
    return { allowed: true, remaining: MAX_DAILY_LAUNCHES };
  }

  const used = count ?? 0;
  return {
    allowed: used < MAX_DAILY_LAUNCHES,
    remaining: Math.max(0, MAX_DAILY_LAUNCHES - used),
  };
}
