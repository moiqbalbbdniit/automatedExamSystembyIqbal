import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Exam from "@/lib/models/Exam";
import { authorizeApiRoles } from "@/lib/apiAuth";

// PUT: Publish exam
export async function PUT(req: NextRequest) {
  try {
    const auth = authorizeApiRoles(req, ["admin", "faculty"]);
    if (!auth.ok) return auth.response;

    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const examId = segments[segments.length - 2];

    if (!examId) {
      return NextResponse.json({ error: "Exam ID is missing" }, { status: 400 });
    }

    await connectDB();

    const existingExam = await Exam.findById(examId).select("facultyUserId facultyId");
    if (!existingExam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (auth.user.role === "faculty") {
      const owner = String(existingExam.get("facultyUserId") || existingExam.get("facultyId") || "");
      if (owner && owner !== auth.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "publish").toLowerCase();
    const expiryHours = Number(body?.expiryHours || 0);

    const updatePayload: Record<string, unknown> = {};
    if (action === "stop") {
      updatePayload.status = "stopped";
      updatePayload.isPublished = false;
      updatePayload.expiresAt = new Date();
    } else {
      updatePayload.status = "published";
      updatePayload.isPublished = true;
      updatePayload.publishedAt = new Date();
      if (expiryHours > 0) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiryHours);
        updatePayload.expiresAt = expiresAt;
      }
    }

    const updatedExam = await Exam.findByIdAndUpdate(examId, updatePayload, { new: true })
      .populate("subject", "name code")
      .populate("course", "name")
      .populate("targetSections", "name code");

    if (!updatedExam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json(updatedExam);
  } catch (err: any) {
    console.error("Publish API Error:", err.message);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ message: "We are working on it" });
}
