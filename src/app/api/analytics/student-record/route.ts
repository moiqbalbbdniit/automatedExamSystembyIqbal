import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ExamResult from "@/lib/models/ExamResult";
import Exam from "@/lib/models/Exam";
import User from "@/lib/models/User";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const facultyId = searchParams.get("facultyId");

    if (!studentId) {
      return NextResponse.json({ error: "Missing studentId" }, { status: 400 });
    }

    const query: Record<string, unknown> = { studentId };
    if (facultyId && facultyId !== "all") {
      query.facultyId = facultyId;
    }

    const results = await ExamResult.find(query)
      .populate({
        path: "examId",
        model: Exam,
        select: "title course subject facultyId createdAt",
        populate: [
          { path: "course", select: "name" },
          { path: "subject", select: "name code" },
        ],
      })
      .populate({ path: "studentId", model: User, select: "firstName lastName email" })
      .sort({ createdAt: -1 })
      .lean();

    const safeResults = Array.isArray(results) ? (results as any[]) : [];

    const facultyIds = Array.from(
      new Set(
        safeResults
          .map((r) => r?.examId?.facultyId || r?.facultyId)
          .filter(Boolean)
          .map((v) => String(v))
      )
    );

    const facultyUsers = facultyIds.length
      ? await User.find({ _id: { $in: facultyIds } }, { firstName: 1, lastName: 1, email: 1 }).lean()
      : [];

    const facultyNameMap = new Map<string, string>();
    for (const user of facultyUsers as any[]) {
      const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Unknown Faculty";
      facultyNameMap.set(String(user._id), name);
    }

    const studentDoc = safeResults[0]?.studentId;
    const studentName = studentDoc
      ? `${studentDoc.firstName || ""} ${studentDoc.lastName || ""}`.trim() || studentDoc.email || "Unknown Student"
      : "Unknown Student";
    const studentEmail = studentDoc?.email || "";

    const records = safeResults.map((r) => {
      const exam = r?.examId;
      const mappedFacultyId = String(exam?.facultyId || r?.facultyId || "");
      return {
        id: String(r?._id || ""),
        examId: String(exam?._id || ""),
        examTitle: exam?.title || "Untitled Exam",
        subjectName: exam?.subject?.name || "Unknown Subject",
        courseName: exam?.course?.name || "Unassigned Course",
        facultyName: facultyNameMap.get(mappedFacultyId) || "Unknown Faculty",
        percentage: Number(r?.percentage || 0),
        marksObtained: Number(r?.totalMarksObtained || 0),
        maxMarks: Number(r?.totalMaxMarks || 0),
        date: new Date(r?.createdAt || Date.now()).toISOString(),
      };
    });

    const avgPercentage = records.length
      ? round2(records.reduce((acc, cur) => acc + cur.percentage, 0) / records.length)
      : 0;
    const bestPercentage = records.length
      ? round2(Math.max(...records.map((r) => r.percentage)))
      : 0;
    const passRate = records.length
      ? round2((records.filter((r) => r.percentage >= 40).length / records.length) * 100)
      : 0;

    const subjectPerfMap = new Map<string, { total: number; count: number }>();
    for (const rec of records) {
      const current = subjectPerfMap.get(rec.subjectName) || { total: 0, count: 0 };
      current.total += rec.percentage;
      current.count += 1;
      subjectPerfMap.set(rec.subjectName, current);
    }

    const subjectPerformance = Array.from(subjectPerfMap.entries())
      .map(([subjectName, v]) => ({
        subjectName,
        attempts: v.count,
        avgPercentage: round2(v.total / Math.max(v.count, 1)),
      }))
      .sort((a, b) => b.avgPercentage - a.avgPercentage);

    const trend = [...records]
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))
      .map((r) => ({
        label: new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        percentage: r.percentage,
        examTitle: r.examTitle,
      }));

    return NextResponse.json({
      student: {
        id: studentId,
        name: studentName,
        email: studentEmail,
      },
      summary: {
        attempts: records.length,
        avgPercentage,
        bestPercentage,
        passRate,
      },
      subjectPerformance,
      trend,
      records,
    });
  } catch (error: any) {
    console.error("Student record analytics error:", error);
    return NextResponse.json(
      { error: "Failed to load student performance record", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
