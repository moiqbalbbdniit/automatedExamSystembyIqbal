import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Submission from "@/lib/models/Submission";
import Faculty from "@/lib/models/faculty";
import User from "@/lib/models/User";
import Subject from "@/lib/models/subject";


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
      .populate("subject" , "name code")
      .lean();

    const examData: ExamData[] = await Promise.all(
      exams.map(async (exam) => {
        console.log("facultyId from exam:", exam.facultyId);

        const user = await User.findById(exam.facultyId).lean();
        let facultyName = "Unknown";

        if (user && "email" in user) {
          const faculty = await Faculty.findOne({ email: user.email }).lean() as { name?: string } | null;
          if (faculty && faculty.name) facultyName = faculty.name;
        }

        const submissions = await Submission.find({ examId: exam._id }).lean();
        const uniqueStudents = new Set(submissions.map((s) => s.studentId));
        const unevaluated = submissions.filter((s) => !s.isEvaluated).length;

        return {
          id: (exam._id as string | { toString(): string }).toString(),
          title: exam.title,
          subject: exam.subject?.name || "Unknown",
          faculty: facultyName,
          createdAt: exam.createdAt,
          totalSubmissions: submissions.length,
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
