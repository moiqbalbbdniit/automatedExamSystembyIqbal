import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

type AuthorizedUser = {
  id: string;
  role: string;
  email?: string;
};

type AuthResult =
  | { ok: true; user: AuthorizedUser }
  | { ok: false; response: NextResponse };

export function authorizeApiRoles(req: NextRequest, allowedRoles: string[]): AuthResult {
  if (!JWT_SECRET) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Server auth misconfiguration" }, { status: 500 }),
    };
  }

  const token = req.cookies.get("exam_system_token")?.value;
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; role?: string; email?: string };
    const role = decoded?.role || "";

    if (!allowedRoles.includes(role)) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }

    return {
      ok: true,
      user: {
        id: String(decoded?.id || ""),
        role,
        email: decoded?.email,
      },
    };
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    };
  }
}
