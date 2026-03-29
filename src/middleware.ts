import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // Role-based route protection
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (pathname.startsWith("/professor") && role !== "PROFESSOR") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (pathname.startsWith("/student") && role !== "STUDENT") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    // Protect all routes except login, api/auth, static files
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
