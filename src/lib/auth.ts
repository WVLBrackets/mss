import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { BOOTSTRAP_ADMIN_EMAIL } from "@/lib/constants";
import {
  getUserByEmail,
  getUserById,
  getUserByHandoffToken,
  clearHandoffToken,
  updateLastLogin,
} from "@/lib/repositories/userRepository";
import { verifyPassword } from "@/lib/services/authService";
import { isUserAdmin } from "@/lib/adminAuth";
import { sessionImageFromStoredAvatar } from "@/lib/blobAvatar";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        handoffToken: { label: "Handoff", type: "text" },
      },
      async authorize(credentials) {
        const handoff = credentials?.handoffToken?.trim();
        if (handoff) {
          const env = getCurrentEnvironment();
          const user = await getUserByHandoffToken(handoff, env);
          if (!user || !user.email_confirmed) return null;
          await clearHandoffToken(user.id, env);
          await updateLastLogin(user.id, env);
          return {
            id: user.id,
            email: user.email,
            name: user.display_name,
            fullName: user.name,
            image: sessionImageFromStoredAvatar(user.avatar_url),
            initials: user.initials,
          };
        }

        const devBypass =
          process.env.NODE_ENV === "development" &&
          process.env.DEV_AUTH_BYPASS === "true";

        if (devBypass) {
          const email = (
            process.env.DEV_AUTH_EMAIL || BOOTSTRAP_ADMIN_EMAIL
          ).toLowerCase();
          const env = getCurrentEnvironment();
          const user = await getUserByEmail(email, env);
          if (!user) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.display_name,
            fullName: user.name,
            image: sessionImageFromStoredAvatar(user.avatar_url),
            initials: user.initials,
          };
        }

        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const env = getCurrentEnvironment();
        const user = await getUserByEmail(email, env);
        if (!user) return null;
        if (!user.email_confirmed) return null;

        const ok = await verifyPassword(password, user.password_hash);
        if (!ok) return null;

        await updateLastLogin(user.id, env);
        return {
          id: user.id,
          email: user.email,
          name: user.display_name,
          fullName: user.name,
          image: sessionImageFromStoredAvatar(user.avatar_url),
          initials: user.initials,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.picture = user.image;
        const u = user as { initials?: string; fullName?: string };
        token.fullName =
          typeof u.fullName === "string" && u.fullName.trim()
            ? u.fullName.trim()
            : "";
        token.initials =
          typeof u.initials === "string" && u.initials
            ? u.initials.slice(0, 3)
            : (user.name?.slice(0, 1).toUpperCase() ?? "?");
      }
      if (trigger === "update" && token.id) {
        const env = getCurrentEnvironment();
        const row = await getUserById(String(token.id), env);
        if (row) {
          token.name = row.display_name;
          token.fullName = row.name;
          token.picture = sessionImageFromStoredAvatar(row.avatar_url);
          token.initials = row.initials.slice(0, 3);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        session.user.id = (token.id as string) ?? "";
        session.user.isAdmin = await isUserAdmin(session.user.email);
        session.user.initials =
          typeof token.initials === "string" && token.initials
            ? token.initials.slice(0, 3)
            : session.user.name?.slice(0, 3).toUpperCase() ?? "?";
        session.user.fullName =
          typeof token.fullName === "string" && token.fullName.trim()
            ? token.fullName.trim()
            : "";
        session.user.image =
          typeof token.picture === "string" ? token.picture : undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Returns the current session in Server Components and Route Handlers.
 */
export function getAuthSession() {
  return getServerSession(authOptions);
}
