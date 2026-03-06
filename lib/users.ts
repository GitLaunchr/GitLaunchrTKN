import { supabaseAdmin } from "./supabase";
import type { User } from "@/types";

export async function getUserByGithubId(
  githubId: string
): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("github_id", githubId)
    .single();

  if (error || !data) return null;
  return data as User;
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as User;
}
