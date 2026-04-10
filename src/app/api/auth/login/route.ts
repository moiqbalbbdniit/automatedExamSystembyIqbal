import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// import Course from "@/lib/models/Course";
import User from "@/lib/models/User";
import { connectDB } from "@/lib/db";


const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password, role } = await req.json();

    let userQuery = User.findOne({ email, role }).populate("course", "name description");

    // Guard populate for hot-reload/model-cache scenarios where old schema lacks section.
    if (User.schema.path("section")) {
      userQuery = userQuery.populate("section", "name code");
    }

    const user = await userQuery;
    if (!user)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const sessionUser = {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      course: user.course
        ? { _id: user.course._id.toString(), name: user.course.name }
        : null,
      section: user.section
        ? {
            _id: user.section._id.toString(),
            name: user.section.name,
            code: user.section.code,
          }
        : null,
      className: user.course?.name || null,
      sectionCode: user.section?.code || null,
      phone: user.phone || null,
      address: user.address || null,
      zipCode: user.zipCode || null,
      country: user.country || null,
      language: user.language || null,
    };

    const token = jwt.sign(
      sessionUser,
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const res = NextResponse.json({
      message: "Login successful",
      user: sessionUser,
    });

    res.cookies.set("exam_system_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET /api/auth/login -> "me"
export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(cookieHeader.split(";").map(c => c.trim().split("=")));
    const token = cookies["exam_system_token"];
    if (!token) return NextResponse.json({ user: null });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return NextResponse.json({ user: decoded });
  } catch {
    return NextResponse.json({ user: null });
  }
}

// DELETE /api/auth/login -> logout
export async function DELETE() {
  const res = NextResponse.json({ message: "Logged out" });
  res.cookies.set("exam_system_token", "", { maxAge: 0, path: "/" });
  return res;
}
