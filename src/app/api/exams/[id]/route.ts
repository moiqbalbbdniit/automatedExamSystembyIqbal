
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Exam from "@/lib/models/Exam";
import "@/lib/models/subject";
import "@/lib/models/Course";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await context.params;
    const exam = await Exam.findById(id).populate("subject", "name code").populate("course", "name");
    if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(exam);
  } catch (err: any) {
    console.error("Exam GET error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}


export async function PUT(req: Request) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const seg = url.pathname.split("/").filter(Boolean);
    const examId = seg[seg.length - 1];

    const body = await req.json();

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
      "subject",
      "duration",
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
    const updated = await Exam.findByIdAndUpdate(examId, updateData, { new: true })
      .populate("subject", "name code")
      .populate("course", "name");

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