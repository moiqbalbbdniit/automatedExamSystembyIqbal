
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Exam from "@/lib/models/Exam";
import Submission from "@/lib/models/Submission";

export async function GET() {
  try {
    await connectDB();

    // Count total students (assuming role field exists)
    const totalStudents = await User.countDocuments({ role: "student" });

    // Count active exams (assuming "active" or date range condition)
    const totalActiveExams = await Exam.countDocuments({ status: "published" });

    // Count unevaluated exams (pending evaluation submissions)
    const totalUnevaluatedExams = await Submission.countDocuments({
      status: "pending_evaluation",
    });

    // Count total submissions
    const totalSubmissions = await Submission.countDocuments();

    return NextResponse.json({
      totalStudents,
      totalActiveExams,
      totalUnevaluatedExams,
      totalSubmissions,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
