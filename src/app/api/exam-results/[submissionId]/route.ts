import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Submission from "@/lib/models/Submission";
import ExamResult from "@/lib/models/ExamResult";

// GET handler
export async function GET(req: Request) {
  try {
    await connectDB();

    // Extract submissionId from the URL
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const submissionId = segments[segments.length - 1];

    if (!submissionId)
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });

    const submission = await Submission.findById(submissionId).lean();
    if (!submission || Array.isArray(submission)) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    const examResult = await ExamResult.findOne({
      examId: submission.examId,
      studentId: submission.studentId,
    }).lean();

    if (!examResult)
      return NextResponse.json({ error: "ExamResult not found" }, { status: 404 });

    return NextResponse.json({ submission, examResult });
  } catch (err: any) {
    console.error("❌ Fetch exam result error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// PUT -> update scores and feedback
export async function PUT(req: Request) {
  try {
    await connectDB();
    const { submissionId, updatedReport } = await req.json();

    if (!submissionId || !updatedReport)
      return NextResponse.json({ error: "Missing submissionId or updatedReport" }, { status: 400 });

    const submission = await Submission.findById(submissionId).lean();
    if (!submission || Array.isArray(submission)) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    // recalc total & percentage
    const totalMarksObtained = updatedReport.reduce((sum: number, q: any) => sum + Number(q.scoreObtained), 0);
    const totalMaxMarks = updatedReport.reduce((sum: number, q: any) => sum + Number(q.maximumScore), 0);
    const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;

    const updatedResult = await ExamResult.findOneAndUpdate(
      { examId: submission.examId, studentId: submission.studentId },
      {
        $set: {
          evaluationDetails: updatedReport.map((q: any) => ({
            questionText: q.questionText,
            scoreObtained: Number(q.scoreObtained),
            maximumScore: Number(q.maximumScore),
            feedback: q.feedback || "",
          })),
          totalMarksObtained,
          totalMaxMarks,
          percentage,
          feedback: updatedReport.map((q: any) => q.feedback).join(" | "),
        },
      },
      { new: true }
    );

    return NextResponse.json({ success: true, result: updatedResult });
  } catch (err: any) {
    console.error("❌ Update exam result error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
