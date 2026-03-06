import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { supabaseAdmin } from "@/lib/supabase";

// ── Extend NextAuth types to include `id` on session.user ────────
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "github") return false;

      const githubProfile = profile as {
        id?: number;
        login?: string;
        avatar_url?: string;
      };

      const github_id = String(githubProfile?.id ?? user.id);
      const username  = githubProfile?.login ?? user.name ?? "unknown";
      const avatar_url = githubProfile?.avatar_url ?? user.image ?? "";

      // Upsert user row
      const { error } = await supabaseAdmin.from("users").upsert(
        {
          github_id,
          username,
          avatar_url,
        },
        { onConflict: "github_id" }
      );

      if (error) {
        console.error("[auth] upsert user error:", error);
        return false;
      }

      return true;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },

    async jwt({ token, account, profile }) {
      if (account?.provider === "github" && profile) {
        const githubProfile = profile as { id?: number; login?: string };
        token.githubId = String(githubProfile?.id);
        token.login    = githubProfile?.login;
      }
      return token;
    },
  },

  pages: {
    signIn: "/api/auth/signin",
  },
};