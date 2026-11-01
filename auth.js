import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const AUTHORIZED_EMAIL = "vritika110@gmail.com";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "demo-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "demo-client-secret",
    }),
  ],
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "hacktracker-secret-key-32-characters-minimum-length!",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30-day persistent session
  },
  callbacks: {
    async signIn({ user }) {
      if (process.env.DEMO_MODE === "true") return true;

      // Strict check: ONLY vritika110@gmail.com is allowed
      if (
        user?.email &&
        user.email.trim().toLowerCase() === AUTHORIZED_EMAIL.toLowerCase()
      ) {
        return true;
      }

      // Reject all other emails -> redirect to unauthorized
      return false;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
      }
      if (process.env.DEMO_MODE === "true" && !token.email) {
        token.email = AUTHORIZED_EMAIL;
        token.name = "Vritika";
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.email) {
        session.user = {
          ...session.user,
          email: token.email,
        };
      }
      if (process.env.DEMO_MODE === "true" && !session.user?.email) {
        session.user = {
          email: AUTHORIZED_EMAIL,
          name: "Vritika",
          image: null,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/unauthorized",
  },
});

