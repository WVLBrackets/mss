import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      isAdmin?: boolean;
      initials?: string;
      /** DB `users.name` (full / legal name); `name` on session is display name. */
      fullName?: string;
      /** When true, self-service profile editing is disabled. */
      profileLocked?: boolean;
    };
  }

  interface User {
    id: string;
    isAdmin?: boolean;
    initials?: string;
    fullName?: string;
    profileLocked?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    initials?: string;
    fullName?: string;
    profileLocked?: boolean;
  }
}
