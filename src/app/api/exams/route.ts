// app/api/exams/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Subject from "@/lib/models/subject";
import FacultyClassSection from "@/lib/models/FacultyClassSection";
import FacultySubjectAssignment from "@/lib/models/FacultySubjectAssignment";
import { authorizeApiRoles } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const facultyId = req.nextUrl.searchParams.get("facultyId");
    const courseId = req.nextUrl.searchParams.get("courseId");
    const sectionId = req.nextUrl.searchParams.get("sectionId");
    const now = new Date();

    const query: any = {};
    if (facultyId) {
      if (Exam.schema.path("facultyUserId")) {
        query.$or = [{ facultyId }, { facultyUserId: facultyId }];
      } else {
        query.facultyId = facultyId;
      }
    }
    if (courseId) query.course = new mongoose.Types.ObjectId(courseId);
    if (sectionId && Exam.schema.path("targetSections")) {
      const sectionObjectId = new mongoose.Types.ObjectId(sectionId);
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { targetSections: sectionObjectId },
            { targetSections: { $exists: false } },
            { targetSections: { $size: 0 } },
          ],
        },
      ];
    }

    // Student listing path (course-scoped) should only return active/published exams.
    if (courseId && !facultyId) {
      query.isPublished = true;
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: now } },
          ],
        },
      ];
    }

    let findQuery = Exam.find(query)
      .sort({ createdAt: -1 })
      .populate("subject", "name code")
      .populate("course", "name");

    if (Exam.schema.path("targetSections")) {
      findQuery = findQuery.populate("targetSections", "name code");
    }

    if (Exam.schema.path("facultyUserId")) {
      findQuery = findQuery.populate("facultyUserId", "firstName lastName email");
    }

    const exams = await findQuery;

    return NextResponse.json(exams);
  } catch (err: any) {
    console.error("Exams GET error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = authorizeApiRoles(req as NextRequest, ["admin", "faculty"]);
    if (!auth.ok) return auth.response;

    await connectDB();
    const body = await req.json();

    if (!body.title || !body.subject) {
      return NextResponse.json({ error: "Missing title or subject" }, { status: 400 });
    }

    const subj = await Subject.findById(body.subject);
    if (!subj) {
      return NextResponse.json({ error: "Subject not found" }, { status: 400 });
    }

    const hasSectionTargeting = Boolean(Exam.schema.path("targetSections"));
    const targetSections = Array.isArray(body.targetSections)
      ? body.targetSections.map((item: unknown) => String(item).trim()).filter(Boolean)
      : [];

    const requestedFacultyId = String(body.facultyUserId || body.facultyId || "").trim();
    const creatorFacultyUserId =
      auth.user.role === "faculty" ? auth.user.id : requestedFacultyId || auth.user.id;

    if (auth.user.role === "faculty" && requestedFacultyId && requestedFacultyId !== auth.user.id) {
      return NextResponse.json(
        { error: "You can only create exams for your own faculty account" },
        { status: 403 }
      );
    }

    if (auth.user.role === "faculty") {
      const course = String(body.course || "").trim();
      if (!course || !hasSectionTargeting || targetSections.length === 0) {
        return NextResponse.json(
          { error: "Faculty exam creation requires class and at least one assigned section" },
          { status: 400 }
        );
      }

      const uniqueSectionIds = Array.from(new Set(targetSections));
      const allowedCount = await FacultyClassSection.countDocuments({
        facultyUserId: creatorFacultyUserId,
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

      const subjectAllowed = await FacultySubjectAssignment.exists({
        facultyUserId: creatorFacultyUserId,
        subject: body.subject,
        isActive: true,
      });

      if (!subjectAllowed) {
        return NextResponse.json(
          { error: "Selected subject is not assigned to this faculty" },
          { status: 403 }
        );
      }
    }

    const exam = await Exam.create({
      title: body.title,
      course: body.course, 
      targetSections: hasSectionTargeting
        ? Array.isArray(body.targetSections)
          ? body.targetSections
          : []
        : undefined,
      subject: body.subject,
      facultyUserId: Exam.schema.path("facultyUserId") ? creatorFacultyUserId || null : undefined,
      facultyId: creatorFacultyUserId || body.facultyId || null,
      duration: body.duration || 180,
      veryShort: body.veryShort || { count: 0, difficulty: "easy" },
      short: body.short || { count: 0, difficulty: "medium" },
      long: body.long || { count: 0, difficulty: "hard" },
      coding: body.coding || { count: 0 },
      instructions: body.instructions || "",
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      status: "draft",
      proctoringEnabled: body.proctoringEnabled ?? false,
    });

    let populatedQuery = Exam.findById(exam._id)
      .populate("subject", "name code")
      .populate("course", "name");

    if (Exam.schema.path("targetSections")) {
      populatedQuery = populatedQuery.populate("targetSections", "name code");
    }

    if (Exam.schema.path("facultyUserId")) {
      populatedQuery = populatedQuery.populate("facultyUserId", "firstName lastName email");
    }

    const populated = await populatedQuery;

    return NextResponse.json(populated, { status: 201 });
  } catch (err: any) {
    console.error("Exams POST error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}