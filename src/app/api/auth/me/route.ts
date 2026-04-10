// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(cookieHeader.split(";").map(c => c.trim().split("=")));
    const token = cookies["exam_system_token"];
    if (!token) return NextResponse.json({ user: null });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const decodedId = decoded?.id ? String(decoded.id) : "";

    if (!decodedId) {
      return NextResponse.json({ user: null });
    }

    await connectDB();

    let userQuery = User.findById(decodedId).populate("course", "name description");
    if (User.schema.path("section")) {
      userQuery = userQuery.populate("section", "name code");
    }

    const dbUser = await userQuery;

    if (!dbUser) {
      return NextResponse.json({ user: null });
    }

    const user = {
      id: dbUser._id,
      email: dbUser.email,
      role: dbUser.role,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      fullName: `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim(),
      course: dbUser.course
        ? { _id: dbUser.course._id.toString(), name: dbUser.course.name }
        : null,
      section: dbUser.section
        ? {
            _id: dbUser.section._id.toString(),
            name: dbUser.section.name,
            code: dbUser.section.code,
          }
        : null,
      className: dbUser.course?.name || null,
      sectionCode: dbUser.section?.code || null,
      phone: dbUser.phone || null,
      address: dbUser.address || null,
      zipCode: dbUser.zipCode || null,
      country: dbUser.country || null,
      language: dbUser.language || null,
    };

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Auth check failed:", err);
    return NextResponse.json({ user: null });
  }
}
