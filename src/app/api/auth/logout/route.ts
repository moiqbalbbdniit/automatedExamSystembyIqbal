import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Clear the JWT token cookie
  const response = NextResponse.json({ message: "Logged out" }, { status: 200 });
  response.cookies.set("exam_system_token", "", { httpOnly: true, expires: new Date(0) });
  return response;
}
