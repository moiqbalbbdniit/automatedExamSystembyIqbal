import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Submission, { ISubmission } from "@/lib/models/Submission";
import ExamResult, { IExamResult } from "@/lib/models/ExamResult";
import axios from "axios";

const PYTHON_API_URL = "https://exammodelbydsteam.onrender.com/api/v1/evaluate-submission";

export async function POST(req: Request) {
  try {
    await connectDB();

    // 🧩 Parse payload (expected: array of submissions)
    const payload = await req.json();

    if (!Array.isArray(payload) || payload.length === 0) {
      console.log("❌ Invalid payload:", payload);
      return NextResponse.json({ error: "Expected an array of submissions" }, { status: 400 });
    }

    // 🧠 Validate structure
    const isValid = payload.every(
      (p) =>
        p.examId &&
        p.studentId &&
        Array.isArray(p.answers) &&
        p.answers.every(
          (a: any) =>
            typeof a.questionText === "string" &&
            typeof a.studentAnswer === "string" &&
            typeof a.maximumScore === "number"
        )
    );

    if (!isValid) {
      console.log("❌ Invalid data format in request:", payload);
      return NextResponse.json({ error: "Invalid submission data format" }, { status: 400 });
    }

    console.log(`📥 Received ${payload.length} submissions for evaluation`);

    // ⚙️ Send payload to Python evaluation API
    const response = await axios.post(PYTHON_API_URL, payload, { timeout: 180000 });
    const data = response.data;

    const reports = data?.batch_evaluation_reports || [];
    if (!reports.length) {
      throw new Error("Invalid response from Python model — no batch_evaluation_reports found");
    }

    const savedResults: IExamResult[] = [];

    // 🧾 Process each evaluation result
    for (const report of reports) {
      const summary = report.report_summary;
      if (!summary) continue;

      console.log("🧾 Report summary received:", summary);

      // 🛑 Skip already evaluated students
      const exists = await ExamResult.findOne({
        examId: summary.exam_id,
        studentId: summary.student_id,
      });
      if (exists) {
        console.log(`⚠️ Student ${summary.student_id} already evaluated`);
        continue;
      }

      // 🔍 Get related submission
      const submission = await Submission.findOne({
        examId: summary.exam_id,
        studentId: summary.student_id,
      });
      if (!submission) {
        console.warn(`⚠️ No submission found for student ${summary.student_id}`);
        continue;
      }

      // ✅ Safely parse numeric fields
      const obtained = Number(summary.total_score_obtained ?? 0);
      const max = Number(summary.total_max_score ?? 0);
      const percent = Number(summary.percentage_obtained ?? 0);

      if (isNaN(obtained) || isNaN(max) || isNaN(percent)) {
        console.error("⚠️ Invalid numeric values in report:", summary);
        continue;
      }

      // 💾 Save result in ExamResult collection
      const savedResult = await ExamResult.create({
        examId: summary.exam_id,
        studentId: summary.student_id,
        facultyId: submission.facultyId || null,
        totalMarksObtained: obtained,
        totalMaxMarks: max,
        percentage: percent,
        feedback: summary.overall_feedback || "",
        strengths: Array.isArray(summary.collective_strengths)
          ? summary.collective_strengths
          : [],
        weaknesses: Array.isArray(summary.collective_weaknesses)
          ? summary.collective_weaknesses
          : [],
      });

      // 🧩 Update submission status
      await Submission.updateOne(
        { examId: summary.exam_id, studentId: summary.student_id },
        {
          $set: {
            status: "evaluated",
            evaluation_report: savedResult._id,
            total_score: obtained,
            max_score: max,
          },
        }
      );

      savedResults.push(savedResult);
    }

    console.log("✅ Evaluation complete:", savedResults.length, "students evaluated");

    // 🧠 Prepare frontend response
    const studentResults = reports.map((r: any) => {
      const s = r.report_summary;
      return {
        examId: s.exam_id,
        studentId: s.student_id,
        totalQuestions: s.total_questions_evaluated,
        totalMarksObtained: s.total_score_obtained,
        totalMaxMarks: s.total_max_score,
        percentage: s.percentage_obtained,
        feedback: s.overall_feedback,
        strengths: s.collective_strengths || [],
        weaknesses: s.collective_weaknesses || [],
      };
    });

    return NextResponse.json({
      success: true,
      totalEvaluated: studentResults.length,
      results: studentResults,
    });
  } catch (err: any) {
    console.error("❌ Evaluation error:", err.response?.data || err.message);
    return NextResponse.json(
      { error: err.response?.data || err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
