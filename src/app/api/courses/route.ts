import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Course from "@/lib/models/Course";

export async function GET() {
  await connectDB();
  const courses = await Course.find();
  return NextResponse.json(courses);
}

export async function POST(req: Request) {
  await connectDB();
  const { name, description } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const newCourse = await Course.create({ name, description });
  return NextResponse.json(newCourse, { status: 201 });
}
