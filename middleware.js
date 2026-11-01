import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const AUTHORIZED_EMAIL = "vritika110@gmail.com";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;

    // In demo mode (DEMO_MODE=true), allow all access
    if (process.env.DEMO_MODE === "true") {
      return NextResponse.next();
    }

    // Strict email check — reject any other Google account
    if (token && token.email !== AUTHORIZED_EMAIL) {
      const url = req.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Only run middleware on protected pages if there's a token (or demo mode)
      authorized: ({ token }) => {
        if (process.env.DEMO_MODE === "true") return true;
        return !!token;
      },
    },
  }
);

// Protect these routes — everything except /login, /unauthorized, /api/auth
export const config = {
  matcher: [
    "/((?!login|unauthorized|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
