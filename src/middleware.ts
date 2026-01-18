import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("exam_system_token")?.value;
  const { pathname } = req.nextUrl;

  // Public pages
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // No token → force login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Check role vs path
    if (
      (pathname.startsWith("/admin") && decoded.role !== "admin") ||
      (pathname.startsWith("/faculty") && decoded.role !== "faculty") ||
      (pathname.startsWith("/student") && decoded.role !== "student")
    ) {
      const res = NextResponse.redirect(new URL("/login", req.url));
      // Clear the token if role mismatch
      res.cookies.set("exam_system_token", "", { path: "/", maxAge: 0 });
      return res;
    }

    // Role matches → allow access
    return NextResponse.next();
  } catch (err) {
    console.error("JWT error:", err);
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set("exam_system_token", "", { path: "/", maxAge: 0 });
    return res;
  }
}

// Node.js runtime (jwt works)
export const config = {
  runtime: "nodejs",
  matcher: ["/admin/:path*", "/faculty/:path*", "/student/:path*"],
};
