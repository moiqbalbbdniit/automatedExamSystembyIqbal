import { NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/db";
import Submission from "@/lib/models/Submission";
import ExamResult from "@/lib/models/ExamResult";
import Exam from "@/lib/models/Exam";

const EXAM_MODEL_BASE_URL =
  process.env.EXAM_MODEL_URL || process.env.NEXT_PUBLIC_EXAM_MODEL_URL || "http://127.0.0.1:8000";
const PYTHON_API_URL = `${EXAM_MODEL_BASE_URL}/api/v1/evaluate-submission`;

function assertModelUrlConfig() {
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.EXAM_MODEL_URL &&
    !process.env.NEXT_PUBLIC_EXAM_MODEL_URL
  ) {
    throw new Error("EXAM_MODEL_URL is required in production");
  }
}

type IncomingAnswer = {
  questionId?: string;
  questionText: string;
  studentAnswer: string;
  maximumScore: number;
  questionType?: string;
  correctAnswer?: string;
};

type IncomingSubmission = {
  examId: string;
  studentId: string;
  answers: IncomingAnswer[];
};

const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();

export async function POST(req: Request) {
  try {
    assertModelUrlConfig();

    await connectDB();

    const payload = (await req.json()) as IncomingSubmission[];
    if (!Array.isArray(payload) || payload.length === 0) {
      return NextResponse.json({ error: "Expected a non-empty array of submissions" }, { status: 400 });
    }

    const isValid = payload.every(
      (p) =>
        p.examId &&
        p.studentId &&
        Array.isArray(p.answers) &&
        p.answers.every(
          (a) =>
            typeof a.questionText === "string" &&
            typeof a.studentAnswer === "string" &&
            typeof a.maximumScore === "number"
        )
    );

    if (!isValid) {
      return NextResponse.json({ error: "Invalid submission data format" }, { status: 400 });
    }

    const examIds = Array.from(new Set(payload.map((p) => p.examId)));
    const exams = await Exam.find({ _id: { $in: examIds } })
      .select("_id paper_solutions_map")
      .lean();

    const examSolutionIndex = new Map<string, { byId: Map<string, any>; byQuestion: Map<string, any> }>();

    for (const exam of exams as any[]) {
      const raw = exam?.paper_solutions_map || {};
      const byId = new Map<string, any>();
      const byQuestion = new Map<string, any>();
      Object.entries(raw).forEach(([qId, value]) => {
        const solution = value as any;
        byId.set(String(qId), solution);
        byQuestion.set(normalize(solution?.question), solution);
      });
      examSolutionIndex.set(String(exam._id), { byId, byQuestion });
    }

    const enrichedPayload = payload.map((submission) => {
      const solutionIndex = examSolutionIndex.get(String(submission.examId));
      return {
        ...submission,
        answers: submission.answers.map((answer) => {
          const solution =
            (answer.questionId && solutionIndex?.byId.get(String(answer.questionId))) ||
            solutionIndex?.byQuestion.get(normalize(answer.questionText));

          const maximumScore =
            typeof answer.maximumScore === "number" && answer.maximumScore > 0
              ? answer.maximumScore
              : Number(solution?.marks || 10);

          return {
            ...answer,
            questionId: answer.questionId || solution?.Q_ID,
            questionType: answer.questionType || solution?.type,
            correctAnswer: answer.correctAnswer || solution?.correct_answer,
            maximumScore,
          };
        }),
      };
    });

    const response = await axios.post(PYTHON_API_URL, enrichedPayload, {
      timeout: 180000,
      headers: { "Content-Type": "application/json" },
    });

    const reports = response.data?.batch_evaluation_reports || [];
    if (!Array.isArray(reports) || reports.length === 0) {
      throw new Error("Invalid response from model service: no batch_evaluation_reports");
    }

    const summaryEntries = reports
      .map((report: any) => report?.report_summary)
      .filter((summary: any) => summary?.exam_id && summary?.student_id && !summary?.error);

    if (summaryEntries.length === 0) {
      return NextResponse.json({ success: true, totalEvaluated: 0, results: [] });
    }

    const existingResults = await ExamResult.find({
      $or: summaryEntries.map((s: any) => ({ examId: s.exam_id, studentId: s.student_id })),
    })
      .select("examId studentId")
      .lean();

    const existingKeySet = new Set(existingResults.map((r: any) => `${String(r.examId)}|${String(r.studentId)}`));

    const submissions = await Submission.find({
      $or: summaryEntries.map((s: any) => ({ examId: s.exam_id, studentId: s.student_id })),
    })
      .select("_id examId studentId facultyId")
      .lean();

    const submissionByKey = new Map(submissions.map((s: any) => [`${String(s.examId)}|${String(s.studentId)}`, s]));

    const resultDocs = summaryEntries
      .filter((s: any) => !existingKeySet.has(`${String(s.exam_id)}|${String(s.student_id)}`))
      .map((s: any) => {
        const key = `${String(s.exam_id)}|${String(s.student_id)}`;
        const sub = submissionByKey.get(key);
        return {
          examId: s.exam_id,
          studentId: s.student_id,
          facultyId: sub?.facultyId || null,
          totalMarksObtained: Number(s.total_score_obtained || 0),
          totalMaxMarks: Number(s.total_max_score || 0),
          percentage: Number(s.percentage_obtained || 0),
          feedback: s.overall_feedback || "",
          strengths: Array.isArray(s.collective_strengths) ? s.collective_strengths : [],
          weaknesses: Array.isArray(s.collective_weaknesses) ? s.collective_weaknesses : [],
        };
      });

    if (resultDocs.length > 0) {
      await ExamResult.insertMany(resultDocs, { ordered: false });
    }

    const allSavedResults = await ExamResult.find({
      $or: summaryEntries.map((s: any) => ({ examId: s.exam_id, studentId: s.student_id })),
    })
      .select("_id examId studentId")
      .lean();

    const resultIdByKey = new Map(
      allSavedResults.map((r: any) => [`${String(r.examId)}|${String(r.studentId)}`, String(r._id)])
    );

    const submissionBulkOps = summaryEntries
      .map((s: any) => {
        const key = `${String(s.exam_id)}|${String(s.student_id)}`;
        const evalResultId = resultIdByKey.get(key);
        if (!evalResultId) return null;

        return {
          updateOne: {
            filter: { examId: s.exam_id, studentId: s.student_id },
            update: {
              $set: {
                status: "evaluated",
                evaluation_report: evalResultId,
                total_score: Number(s.total_score_obtained || 0),
                max_score: Number(s.total_max_score || 0),
              },
            },
          },
        };
      })
      .filter(Boolean) as any[];

    if (submissionBulkOps.length > 0) {
      await Submission.bulkWrite(submissionBulkOps, { ordered: false });
    }

    const studentResults = summaryEntries.map((s: any) => ({
      examId: s.exam_id,
      studentId: s.student_id,
      totalQuestions: s.total_questions_evaluated,
      totalMarksObtained: s.total_score_obtained,
      totalMaxMarks: s.total_max_score,
      percentage: s.percentage_obtained,
      feedback: s.overall_feedback,
      strengths: s.collective_strengths || [],
      weaknesses: s.collective_weaknesses || [],
    }));

    return NextResponse.json({
      success: true,
      totalEvaluated: studentResults.length,
      results: studentResults,
    });
  } catch (err: any) {
    console.error("Evaluation error:", err.response?.data || err.message);
    return NextResponse.json(
      { error: err.response?.data || err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
