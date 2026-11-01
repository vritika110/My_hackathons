import { NextResponse } from "next/server";

export default function middleware() {
  // Direct open access — no authorization or login required
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
