// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Get the host from the request headers
  const url = new URL(req.url);

  // Create redirect response
  const response = NextResponse.redirect(`${url.origin}/`); // absolute URL required

  // Clear the JWT cookie
  response.cookies.set({
    name: "exam_system_token",
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0, // expire immediately
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return response;
}
