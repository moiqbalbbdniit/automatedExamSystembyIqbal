// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(cookieHeader.split(";").map(c => c.trim().split("=")));
    const token = cookies["exam_system_token"];
    if (!token) return NextResponse.json({ user: null });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return NextResponse.json({ user: decoded });
  } catch (err) {
    console.error("Auth check failed:", err);
    return NextResponse.json({ user: null });
  }
}
