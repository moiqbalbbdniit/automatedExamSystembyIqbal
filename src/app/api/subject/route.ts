import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/lib/models/subject";
import Faculty from "@/lib/models/faculty";

export async function GET() {
  await connectDB();
  const subjects = await Subject.find().populate("faculty", "name email department");
  return NextResponse.json(subjects);
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const { name, code, topics, faculty } = body;

  if (!name || !code) {
    return NextResponse.json({ error: "Name and code are required" }, { status: 400 });
  }

  // ✅ Convert topics to array (split by comma OR newline)
  const topicsArray: string[] =
    typeof topics === "string"
      ? topics
          .split(/[,|\n]/) // split by comma OR newline
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : Array.isArray(topics)
      ? topics
      : [];

  // Validate faculty if provided
  let facultyId = null;
  if (faculty) {
    const facultyExists = await Faculty.findById(faculty);
    if (!facultyExists) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 400 });
    }
    facultyId = facultyExists._id;
  }

  // Save subject
  let subject = new Subject({
    name,
    code,
    topics: topicsArray,
    faculty: facultyId,
  });

  await subject.save();

  // Populate faculty before returning
  subject = await Subject.findById(subject._id).populate("faculty", "name email department");

  return NextResponse.json(subject, { status: 201 });
}
