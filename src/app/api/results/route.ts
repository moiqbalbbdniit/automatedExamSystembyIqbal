import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ExamResult from "@/lib/models/ExamResult";
import Exam from "@/lib/models/Exam";
import Subject from "@/lib/models/subject";
import { authorizeApiRoles } from "@/lib/apiAuth";

export const dynamic = "force-dynamic"; // optional, ensures latest data on each request

export async function GET(req: NextRequest) {
  try {
    const auth = authorizeApiRoles(req, ["student", "faculty", "admin"]);
    if (!auth.ok) return auth.response;

    await connectDB();

    const url = new URL(req.url);
    const studentId = url.searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Missing studentId parameter" },
        { status: 400 }
      );
    }

    if (auth.user.role === "student" && studentId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch exam results and populate exam + subject details
    const results = await ExamResult.find({ studentId })
      .populate({
        path: "examId",
        model: Exam,
        populate: {
          path: "subject",
          model: Subject,
          select: "name",
        },
      })
      .sort({ createdAt: -1 }) // latest first
      .lean();
    if (!results || results.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error fetching exam results:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam results", details: error.message },
      { status: 500 }
    );
  }
}
