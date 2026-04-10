
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Exam from "@/lib/models/Exam";
import "@/lib/models/subject";
import "@/lib/models/Course";
import FacultyClassSection from "@/lib/models/FacultyClassSection";
import FacultySubjectAssignment from "@/lib/models/FacultySubjectAssignment";
import { authorizeApiRoles } from "@/lib/apiAuth";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await context.params;
    let examQuery = Exam.findById(id)
      .populate("subject", "name code")
      .populate("course", "name");

    if (Exam.schema.path("targetSections")) {
      examQuery = examQuery.populate("targetSections", "name code");
    }

    if (Exam.schema.path("facultyUserId")) {
      examQuery = examQuery.populate("facultyUserId", "firstName lastName email");
    }

    const exam = await examQuery;
    if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(exam);
  } catch (err: any) {
    console.error("Exam GET error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}


export async function PUT(req: NextRequest) {
  try {
    const auth = authorizeApiRoles(req, ["admin", "faculty"]);
    if (!auth.ok) return auth.response;

    await connectDB();
    const url = new URL(req.url);
    const seg = url.pathname.split("/").filter(Boolean);
    const examId = seg[seg.length - 1];

    const body = await req.json();

    const existingExam = await Exam.findById(examId);
    if (!existingExam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const hasSectionTargeting = Boolean(Exam.schema.path("targetSections"));

    if (auth.user.role === "faculty") {
      const existingFacultyId = String(
        existingExam.get("facultyUserId") || existingExam.get("facultyId") || ""
      );

      if (existingFacultyId && existingFacultyId !== auth.user.id) {
        return NextResponse.json({ error: "You can update only your own exams" }, { status: 403 });
      }

      const course = String(body.course || existingExam.get("course") || "");
      const incomingSections = Array.isArray(body.targetSections)
        ? body.targetSections
        : existingExam.get("targetSections") || [];
      const targetSections = incomingSections
        .map((item: unknown) => String(item).trim())
        .filter(Boolean);

      if (!course || !hasSectionTargeting || targetSections.length === 0) {
        return NextResponse.json(
          { error: "Faculty exam update requires class and at least one assigned section" },
          { status: 400 }
        );
      }

      const uniqueSectionIds = Array.from(new Set(targetSections));
      const allowedCount = await FacultyClassSection.countDocuments({
        facultyUserId: auth.user.id,
        course,
        section: { $in: uniqueSectionIds },
        isActive: true,
      });

      if (allowedCount !== uniqueSectionIds.length) {
        return NextResponse.json(
          { error: "One or more selected sections are not assigned to this faculty" },
          { status: 403 }
        );
      }

      const subjectId = String(body.subject || existingExam.get("subject") || "");
      const subjectAllowed = await FacultySubjectAssignment.exists({
        facultyUserId: auth.user.id,
        subject: subjectId,
        isActive: true,
      });

      if (!subjectAllowed) {
        return NextResponse.json(
          { error: "Selected subject is not assigned to this faculty" },
          { status: 403 }
        );
      }

      body.facultyUserId = auth.user.id;
      body.facultyId = auth.user.id;
    }

       const allowed: any = {};
    if (body.questions) allowed.questions = body.questions;
    if (body.paper_solutions_map) allowed.paper_solutions_map = body.paper_solutions_map;
    if (body.status) allowed.status = body.status;
    if (typeof body.isPublished !== "undefined") allowed.isPublished = body.isPublished;

    if (typeof body.proctoringEnabled !== "undefined") {
      allowed.proctoringEnabled = body.proctoringEnabled;
    }
    
    const allowedFields = [
      "title",
      "course",
      "targetSections",
      "subject",
      "facultyUserId",
      "duration",
      "expiresAt",
      "veryShort",
      "short",
      "long",
      "coding",
      "instructions",
      "status",
      "isPublished",
      "questions",
      "paper_solutions_map",
      "proctoringEnabled", 
    ];

    // ✅ Build update object dynamically from body
    const updateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined && body[key] !== null) {
        updateData[key] = body[key];
      }
    }

    // ✅ Actually apply update
    let updatedQuery = Exam.findByIdAndUpdate(examId, updateData, { new: true })
      .populate("subject", "name code")
      .populate("course", "name");

    if (Exam.schema.path("targetSections")) {
      updatedQuery = updatedQuery.populate("targetSections", "name code");
    }

    if (Exam.schema.path("facultyUserId")) {
      updatedQuery = updatedQuery.populate("facultyUserId", "firstName lastName email");
    }

    const updated = await updatedQuery;

    if (!updated) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("Exam PUT error:", err);
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}

// DELETE exam
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await context.params;
    await Exam.findByIdAndDelete(id);
    return NextResponse.json({ message: "Deleted" });
  } catch (err: any) {
    console.error("Exam DELETE error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}