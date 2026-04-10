import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRoles } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Subject from "@/lib/models/subject";
import FacultySubjectAssignment from "@/lib/models/FacultySubjectAssignment";

export async function GET(req: NextRequest) {
  const auth = authorizeApiRoles(req, ["admin", "faculty"]);
  if (!auth.ok) return auth.response;

  await connectDB();

  const facultyUserIdParam = req.nextUrl.searchParams.get("facultyUserId");
  const query: Record<string, unknown> = {};

  if (auth.user.role === "faculty") {
    query.facultyUserId = auth.user.id;
  } else if (facultyUserIdParam) {
    query.facultyUserId = facultyUserIdParam;
  }

  const assignments = await FacultySubjectAssignment.find(query)
    .sort({ createdAt: -1 })
    .populate("facultyUserId", "firstName lastName email")
    .populate("subject", "name code");

  return NextResponse.json({ assignments });
}

export async function POST(req: NextRequest) {
  const auth = authorizeApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;

  await connectDB();

  const body = await req.json();
  const facultyUserId = String(body.facultyUserId || "").trim();
  const subjects = Array.isArray(body.subjects)
    ? body.subjects.map((s: unknown) => String(s).trim()).filter(Boolean)
    : [];

  if (!facultyUserId || subjects.length === 0) {
    return NextResponse.json(
      { error: "facultyUserId and subjects are required" },
      { status: 400 }
    );
  }

  const [facultyUser, subjectDocs] = await Promise.all([
    User.findOne({ _id: facultyUserId, role: "faculty" }),
    Subject.find({ _id: { $in: subjects } }),
  ]);

  if (!facultyUser) {
    return NextResponse.json({ error: "Faculty user not found" }, { status: 404 });
  }

  if (subjectDocs.length !== subjects.length) {
    return NextResponse.json(
      { error: "One or more subjects are invalid" },
      { status: 400 }
    );
  }

  for (const subjectId of subjects as string[]) {
    await FacultySubjectAssignment.updateOne(
      { facultyUserId, subject: subjectId },
      {
        $set: {
          facultyUserId,
          subject: subjectId,
          isActive: true,
          createdBy: auth.user.id,
        },
      },
      { upsert: true }
    );
  }

  const assignments = await FacultySubjectAssignment.find({ facultyUserId })
    .populate("facultyUserId", "firstName lastName email")
    .populate("subject", "name code")
    .sort({ createdAt: -1 });

  return NextResponse.json({ assignments });
}
