import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      isAdmin?: boolean;
      initials?: string;
    };
  }

  interface User {
    id: string;
    isAdmin?: boolean;
    initials?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    initials?: string;
  }
}
