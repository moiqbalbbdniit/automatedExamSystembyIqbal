import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/lib/models/User";
import Course from "@/lib/models/Course"; // ✅ make sure Course model exists
import { connectDB } from "@/lib/db";


//trigerring deployments
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { firstName, lastName, email, password, role, course } = body;

    // Validate fields
    if (!firstName || !email || !password || !role) {
      return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
    }

    // Check for duplicates
    const existing = await User.findOne({ $or: [{ email }] });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // If a course is provided, validate it exists
    let courseId = null;
    if (course) {
      const existingCourse = await Course.findById(course);
      if (!existingCourse) {
        return NextResponse.json({ error: "Invalid course selected" }, { status: 400 });
      }
      courseId = existingCourse._id;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      firstName,
      lastName,
      // username,
      email,
      password: hashedPassword,
      role,
      course: courseId || undefined,
    });

    return NextResponse.json({
      message: "✅ User registered successfully",
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        email: newUser.email,
        role: newUser.role,
        course: newUser.course,
      },
    });
  } catch (err: any) {
    console.error("Signup Error:", err);
    return NextResponse.json({ error: "❌ Something went wrong" }, { status: 500 });
  }
}
