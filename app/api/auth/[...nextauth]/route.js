import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const AUTHORIZED_EMAIL = process.env.AUTHORIZED_EMAIL || "vritika110@gmail.com";
const DEMO_MODE = process.env.DEMO_MODE === "true";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "demo-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "demo-client-secret",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "demo-secret-key-for-development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days - persistent session
  },
  callbacks: {
    async signIn({ user }) {
      if (DEMO_MODE) return true;
      // Strict: only allow the authorized email
      if (user?.email === AUTHORIZED_EMAIL) {
        return true;
      }
      return "/unauthorized";
    },
    async jwt({ token, user }) {
      if (DEMO_MODE && !token.email) {
        token.email = AUTHORIZED_EMAIL;
        token.name = "Vritika";
        token.picture = null;
      }
      return token;
    },
    async session({ session, token }) {
      if (DEMO_MODE) {
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
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
