import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRoles } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Section from "@/lib/models/Section";
import Course from "@/lib/models/Course";

export async function GET(req: NextRequest) {
  const auth = authorizeApiRoles(req, ["admin", "faculty"]);
  if (!auth.ok) return auth.response;

  await connectDB();

  const courseId = req.nextUrl.searchParams.get("courseId");
  const query = courseId ? { course: courseId } : {};

  const sections = await Section.find(query)
    .sort({ name: 1 })
    .populate("course", "name");

  return NextResponse.json({ sections });
}

export async function POST(req: NextRequest) {
  const auth = authorizeApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;

  await connectDB();

  const body = await req.json();
  const course = String(body.course || "").trim();
  const code = String(body.code || "").trim().toUpperCase();
  const name = String(body.name || code || "").trim();

  if (!course || !code || !name) {
    return NextResponse.json({ error: "course, code, and name are required" }, { status: 400 });
  }

  const courseDoc = await Course.findById(course);
  if (!courseDoc) {
    return NextResponse.json({ error: "Invalid course selected" }, { status: 400 });
  }

  const exists = await Section.findOne({ course, code });
  if (exists) {
    return NextResponse.json({ error: "Section already exists for this class" }, { status: 409 });
  }

  const section = await Section.create({
    course,
    code,
    name,
    isActive: body.isActive ?? true,
  });

  const populated = await Section.findById(section._id).populate("course", "name");
  return NextResponse.json(populated, { status: 201 });
}
