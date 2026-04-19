import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { getCurrentEnvironment } from "@/lib/appEnvironment";
import { BOOTSTRAP_ADMIN_EMAIL } from "@/lib/constants";
import {
  getUserByEmail,
  getUserByHandoffToken,
  clearHandoffToken,
  updateLastLogin,
} from "@/lib/repositories/userRepository";
import { verifyPassword } from "@/lib/services/authService";
import { isUserAdmin } from "@/lib/adminAuth";

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
            name: user.name,
            image: user.avatar_url ?? undefined,
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
            name: user.name,
            image: user.avatar_url ?? undefined,
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
          name: user.name,
          image: user.avatar_url ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        session.user.id = (token.id as string) ?? "";
        session.user.isAdmin = await isUserAdmin(session.user.email);
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
