import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRoles } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Course from "@/lib/models/Course";
import Section from "@/lib/models/Section";
import FacultyClassSection from "@/lib/models/FacultyClassSection";

export async function GET(req: NextRequest) {
  const auth = authorizeApiRoles(req, ["admin", "faculty"]);
  if (!auth.ok) return auth.response;

  await connectDB();

  const facultyUserIdParam = req.nextUrl.searchParams.get("facultyUserId");
  const courseId = req.nextUrl.searchParams.get("courseId");
  const query: Record<string, unknown> = {};

  if (auth.user.role === "faculty") {
    query.facultyUserId = auth.user.id;
  } else if (facultyUserIdParam) {
    query.facultyUserId = facultyUserIdParam;
  }

  if (courseId) {
    query.course = courseId;
  }

  const assignments = await FacultyClassSection.find(query)
    .sort({ createdAt: -1 })
    .populate("facultyUserId", "firstName lastName email")
    .populate("course", "name")
    .populate("section", "name code");

  return NextResponse.json({ assignments });
}

export async function POST(req: NextRequest) {
  const auth = authorizeApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;

  await connectDB();

  const body = await req.json();
  const facultyUserId = String(body.facultyUserId || "").trim();
  const course = String(body.course || "").trim();
  const sections = Array.isArray(body.sections) ? body.sections.map((s: unknown) => String(s).trim()).filter(Boolean) : [];

  if (!facultyUserId || !course || sections.length === 0) {
    return NextResponse.json(
      { error: "facultyUserId, course and sections are required" },
      { status: 400 }
    );
  }

  const [facultyUser, courseDoc, sectionDocs] = await Promise.all([
    User.findOne({ _id: facultyUserId, role: "faculty" }),
    Course.findById(course),
    Section.find({ _id: { $in: sections }, course }),
  ]);

  if (!facultyUser) {
    return NextResponse.json({ error: "Faculty user not found" }, { status: 404 });
  }

  if (!courseDoc) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  if (sectionDocs.length !== sections.length) {
    return NextResponse.json(
      { error: "One or more sections are invalid for the selected class" },
      { status: 400 }
    );
  }

  for (const sectionId of sections as string[]) {
    await FacultyClassSection.updateOne(
      { facultyUserId, course, section: sectionId },
      {
        $set: {
          facultyUserId,
          course,
          section: sectionId,
          isActive: true,
          createdBy: auth.user.id,
        },
      },
      { upsert: true }
    );
  }

  const assignments = await FacultyClassSection.find({ facultyUserId, course })
    .populate("facultyUserId", "firstName lastName email")
    .populate("course", "name")
    .populate("section", "name code")
    .sort({ createdAt: -1 });

  return NextResponse.json({ assignments });
}
