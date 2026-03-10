import { redirect } from "next/navigation";
import { getSupabaseSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import ScanlinesOverlay from "@/app/components/ScanlinesOverlay";
import HUD from "@/app/components/HUD";
import ProfileEditor from "./ProfileEditor";
import styles from "./profile.module.css";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { user } = await getSupabaseSession();
  if (!user) redirect("/auth/signin?next=/profile");

  const githubUsername = user.user_metadata?.user_name ?? user.id;

  // Get user + their tokens + market data
  const { data: dbUser } = await supabaseAdmin
    .from("users").select("*").eq("github_id", githubUsername).single();

  const { data: launches } = await supabaseAdmin
    .from("launch_requests")
    .select("id, name, symbol, token_address, status, created_at")
    .eq("user_id", dbUser?.id)
    .order("created_at", { ascending: false });

  const tokenCount  = launches?.filter(l => l.status === "done").length ?? 0;
  const memberSince = dbUser?.created_at
    ? new Date(dbUser.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  return (
    <div className={styles.root}>
      <ScanlinesOverlay />
      <HUD />
      <main className={styles.main}>
        <div className={styles.header}>
          <span className={styles.tag}>// MY PROFILE</span>
          <h1 className={styles.title}>Builder Profile</h1>
        </div>
        <ProfileEditor
          initialUser={dbUser}
          githubUsername={githubUsername}
          avatarUrl={user.user_metadata?.avatar_url ?? ""}
          tokenCount={tokenCount}
          memberSince={memberSince}
          launches={launches ?? []}
        />
      </main>
    </div>
  );
}
