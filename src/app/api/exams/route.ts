// app/api/exams/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Subject from "@/lib/models/subject";

export async function GET(req: Request) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const facultyId = url.searchParams.get("facultyId");
    const courseId = url.searchParams.get("courseId");

    const query: any = {};
    if (facultyId) query.facultyId = facultyId;
    if (courseId) query.course = new mongoose.Types.ObjectId(courseId);

    const exams = await Exam.find(query)
      .sort({ createdAt: -1 })
      .populate("subject", "name code")
      .populate("course", "name");

    return NextResponse.json(exams);
  } catch (err: any) {
    console.error("Exams GET error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.title || !body.subject) {
      return NextResponse.json({ error: "Missing title or subject" }, { status: 400 });
    }

    const subj = await Subject.findById(body.subject);
    if (!subj) {
      return NextResponse.json({ error: "Subject not found" }, { status: 400 });
    }

    const exam = await Exam.create({
      title: body.title,
      course: body.course, 
      subject: body.subject,
      facultyId: body.facultyId || null,
      duration: body.duration || 180,
      veryShort: body.veryShort || { count: 0, difficulty: "easy" },
      short: body.short || { count: 0, difficulty: "medium" },
      long: body.long || { count: 0, difficulty: "hard" },
      coding: body.coding || { count: 0 },
      instructions: body.instructions || "",
      status: "draft",
      proctoringEnabled: body.proctoringEnabled ?? false,
    });

    const populated = await Exam.findById(exam._id)
      .populate("subject", "name code")
      .populate("course", "name");

    return NextResponse.json(populated, { status: 201 });
  } catch (err: any) {
    console.error("Exams POST error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}