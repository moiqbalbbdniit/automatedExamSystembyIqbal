import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Submission from "@/lib/models/Submission";
import User from "@/lib/models/User";


interface ExamData {
  id: string;
  title: string;
  subject: string;
  faculty: string;
  createdAt: Date;
  totalSubmissions: number;
  totalStudents: number;
  unevaluated: number;
}

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const selectedDate = dateParam ? new Date(dateParam) : new Date();
    selectedDate.setHours(0, 0, 0, 0);

    const start = new Date(selectedDate);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    const exams = await Exam.find({ createdAt: { $gte: start, $lte: end } })
      .populate("subject", "name code")
      .lean();

    const examIds = exams.map((e: any) => e._id);
    const facultyIds = Array.from(
      new Set(exams.map((e: any) => String(e.facultyId || "")).filter(Boolean))
    );

    const [submissions, facultyUsers] = await Promise.all([
      Submission.find({ examId: { $in: examIds } }, { examId: 1, studentId: 1, isEvaluated: 1 }).lean(),
      User.find({ _id: { $in: facultyIds } }, { firstName: 1, lastName: 1, email: 1 }).lean(),
    ]);

    const facultyMap = new Map<string, string>();
    for (const user of facultyUsers as any[]) {
      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Unknown";
      facultyMap.set(String(user._id), name);
    }

    const submissionByExam = new Map<string, any[]>();
    for (const submission of submissions as any[]) {
      const examId = String(submission.examId || "");
      if (!submissionByExam.has(examId)) submissionByExam.set(examId, []);
      submissionByExam.get(examId)!.push(submission);
    }

    const examData: ExamData[] = await Promise.all(
      exams.map(async (exam) => {
        const examId = (exam._id as string | { toString(): string }).toString();
        const examSubmissions = submissionByExam.get(examId) || [];
        const uniqueStudents = new Set(examSubmissions.map((s: any) => String(s.studentId || "")));
        const unevaluated = examSubmissions.filter((s: any) => !s.isEvaluated).length;
        const facultyName = facultyMap.get(String((exam as any).facultyId || "")) || "Unknown Faculty";

        return {
          id: examId,
          title: exam.title,
          subject: (exam as any).subject?.name || "Unknown Subject",
          faculty: facultyName,
          createdAt: (exam as any).createdAt,
          totalSubmissions: examSubmissions.length,
          totalStudents: uniqueStudents.size,
          unevaluated,
        };
      })
    );

    const totalExams = examData.length;
    const totalStudents = examData.reduce((acc, e) => acc + e.totalStudents, 0);
    const totalSubmissions = examData.reduce((acc, e) => acc + e.totalSubmissions, 0);
    const totalUnevaluated = examData.reduce((acc, e) => acc + e.unevaluated, 0);

    return NextResponse.json({
      kpis: {
        totalExams,
        totalStudents,
        totalSubmissions,
        totalUnevaluated,
      },
      exams: examData,
      selectedDate: start,
    });
  } catch (error: any) {
    console.error("❌ Exam Monitor API Error:", error);

    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
