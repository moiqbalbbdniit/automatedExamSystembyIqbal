import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Exam from "@/lib/models/Exam";
import ExamResult from "@/lib/models/ExamResult";
import Submission from "@/lib/models/Submission";
import User from "@/lib/models/User";
import Course from "@/lib/models/Course";
import mongoose from "mongoose";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get("facultyId");
    const daysParam = Number(searchParams.get("days") || "0");

    if (!facultyId) {
      return NextResponse.json({ error: "Missing facultyId" }, { status: 400 });
    }

    const examQuery: Record<string, unknown> = { facultyId };
    if (Number.isFinite(daysParam) && daysParam > 0) {
      const from = new Date();
      from.setDate(from.getDate() - daysParam);
      examQuery.createdAt = { $gte: from };
    }

    const exams = await Exam.find(examQuery)
      .populate("course", "name")
      .populate("subject", "name")
      .lean();

    const examIds = exams.map((e: any) => e._id);
    if (examIds.length === 0) {
      return NextResponse.json({
        summary: {
          totalExams: 0,
          totalEvaluatedSubmissions: 0,
          pendingEvaluations: 0,
          avgPercentage: 0,
          passRate: 0,
        },
        coursePerformance: [],
        subjectPerformance: [],
        topStudents: [],
        studentsTable: [],
        recentExamPerformance: [],
      });
    }

    const resultQuery: Record<string, unknown> = { examId: { $in: examIds } };
    if (Number.isFinite(daysParam) && daysParam > 0) {
      const from = new Date();
      from.setDate(from.getDate() - daysParam);
      resultQuery.createdAt = { $gte: from };
    }

    const results = await ExamResult.find(resultQuery)
      .populate({
        path: "examId",
        select: "title course subject",
        populate: [
          { path: "course", select: "name" },
          { path: "subject", select: "name code" },
        ],
      })
      .populate({ path: "studentId", model: User, select: "firstName lastName email" })
      .sort({ createdAt: -1 })
      .lean();

    const pendingEvaluations = await Submission.countDocuments({
      examId: { $in: examIds },
      status: "pending_evaluation",
    });

    const safeResults = (Array.isArray(results) ? results : []) as any[];

    const rawCourseValues = Array.from(
      new Set(safeResults.map((r) => r?.examId?.course).filter(Boolean))
    );
    const objectIdCourseValues = rawCourseValues
      .map((v: any) => (typeof v === "object" && v?._id ? String(v._id) : typeof v === "string" ? v : ""))
      .filter((v) => mongoose.Types.ObjectId.isValid(v));
    const legacyCourseNames = rawCourseValues
      .filter((v: any) => typeof v === "string" && !mongoose.Types.ObjectId.isValid(v))
      .map((v: any) => String(v));

    const courseDocs = objectIdCourseValues.length
      ? await Course.find({ _id: { $in: objectIdCourseValues } }, { name: 1 }).lean()
      : [];
    const courseNameMap = new Map<string, string>();
    for (const c of courseDocs as any[]) {
      courseNameMap.set(String(c._id), c.name || "Unassigned Course");
    }
    for (const cName of legacyCourseNames) {
      courseNameMap.set(`name:${cName}`, cName);
    }

    const avgPercentage = safeResults.length
      ? round2(safeResults.reduce((acc, cur) => acc + Number(cur.percentage || 0), 0) / safeResults.length)
      : 0;

    const passRate = safeResults.length
      ? round2(
          (safeResults.filter((r) => Number(r.percentage || 0) >= 40).length / safeResults.length) * 100
        )
      : 0;

    const courseMap = new Map<string, any[]>();
    const subjectMap = new Map<string, any[]>();
    const studentMap = new Map<string, any[]>();

    const examLookup = new Map<string, any>();
    for (const exam of exams as any[]) {
      examLookup.set(String(exam._id), exam);
    }

    for (const r of safeResults) {
      const examCourseRaw = r?.examId?.course;
      const fallbackExam = examLookup.get(String(r?.examId?._id || ""));
      const courseId =
        typeof examCourseRaw === "object" && examCourseRaw?._id
          ? String(examCourseRaw._id)
          : typeof examCourseRaw === "string" && mongoose.Types.ObjectId.isValid(examCourseRaw)
            ? examCourseRaw
            : typeof examCourseRaw === "string"
              ? `name:${examCourseRaw}`
              : "unknown";
      const courseName =
        (typeof examCourseRaw === "object" && examCourseRaw?.name) ||
        fallbackExam?.course?.name ||
        courseNameMap.get(courseId) ||
        "Unassigned Course";
      const subjectName = r?.examId?.subject?.name || fallbackExam?.subject?.name || "Unknown Subject";
      const studentId = String(r?.studentId?._id || r?.studentId || "unknown");

      if (!courseMap.has(courseId)) courseMap.set(courseId, []);
      if (!subjectMap.has(subjectName)) subjectMap.set(subjectName, []);
      if (!studentMap.has(studentId)) studentMap.set(studentId, []);

      courseMap.get(courseId)!.push({ ...r, courseName });
      subjectMap.get(subjectName)!.push(r);
      studentMap.get(studentId)!.push(r);
    }

    const coursePerformance = Array.from(courseMap.entries())
      .map(([courseId, items]) => ({
        courseId,
        courseName: items[0]?.courseName || "Unassigned Course",
        attempts: items.length,
        avgPercentage: round2(
          items.reduce((a, b) => a + Number(b.percentage || 0), 0) / Math.max(items.length, 1)
        ),
      }))
      .sort((a, b) => b.avgPercentage - a.avgPercentage);

    const subjectPerformance = Array.from(subjectMap.entries())
      .map(([subjectName, items]) => ({
        subjectName,
        attempts: items.length,
        avgPercentage: round2(
          items.reduce((a, b) => a + Number(b.percentage || 0), 0) / Math.max(items.length, 1)
        ),
      }))
      .sort((a, b) => b.avgPercentage - a.avgPercentage);

    const topStudents = Array.from(studentMap.entries())
      .map(([studentId, items]) => {
        const first = items[0];
        const studentName = `${first?.studentId?.firstName || ""} ${first?.studentId?.lastName || ""}`.trim() || first?.studentId?.email || "Unknown Student";
        return {
          studentId,
          studentName,
          attempts: items.length,
          avgPercentage: round2(
            items.reduce((a, b) => a + Number(b.percentage || 0), 0) / Math.max(items.length, 1)
          ),
          bestPercentage: round2(Math.max(...items.map((i) => Number(i.percentage || 0)))),
        };
      })
      .sort((a, b) => b.avgPercentage - a.avgPercentage)
      .slice(0, 8);

    const studentsTable = Array.from(studentMap.entries())
      .map(([studentId, items]) => {
        const first = items[0];
        const studentName =
          `${first?.studentId?.firstName || ""} ${first?.studentId?.lastName || ""}`.trim() ||
          first?.studentId?.email ||
          "Unknown Student";
        const studentEmail = first?.studentId?.email || "";
        const avg = round2(
          items.reduce((a, b) => a + Number(b.percentage || 0), 0) / Math.max(items.length, 1)
        );
        const best = round2(Math.max(...items.map((i) => Number(i.percentage || 0))));
        const passRateForStudent = round2(
          (items.filter((i) => Number(i.percentage || 0) >= 40).length / Math.max(items.length, 1)) * 100
        );
        const lastExamDate = items
          .map((i) => i?.createdAt)
          .filter(Boolean)
          .sort((a: any, b: any) => +new Date(b) - +new Date(a))[0];
        return {
          studentId,
          studentName,
          studentEmail,
          attempts: items.length,
          avgPercentage: avg,
          bestPercentage: best,
          passRate: passRateForStudent,
          lastExamDate: lastExamDate || new Date(0).toISOString(),
        };
      })
      .sort((a, b) => b.avgPercentage - a.avgPercentage);

    const resultByExam = new Map<string, any[]>();
    for (const r of safeResults) {
      const key = String(r?.examId?._id || "unknown");
      if (!resultByExam.has(key)) resultByExam.set(key, []);
      resultByExam.get(key)!.push(r);
    }

    const recentExamPerformance = exams
      .map((exam: any) => {
        const rows = resultByExam.get(String(exam._id)) || [];
        const avg = rows.length
          ? round2(rows.reduce((a, b) => a + Number(b.percentage || 0), 0) / rows.length)
          : 0;
        return {
          examId: String(exam._id),
          examTitle: exam.title,
          courseName: exam?.course?.name || "Unassigned Course",
          subjectName: exam?.subject?.name || "Unknown Subject",
          evaluatedCount: rows.length,
          avgPercentage: avg,
          createdAt: exam.createdAt,
        };
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 12);

    return NextResponse.json({
      summary: {
        totalExams: exams.length,
        totalEvaluatedSubmissions: safeResults.length,
        pendingEvaluations,
        avgPercentage,
        passRate,
      },
      coursePerformance,
      subjectPerformance,
      topStudents,
      studentsTable,
      recentExamPerformance,
    });
  } catch (error: any) {
    console.error("Faculty analytics error:", error);
    return NextResponse.json(
      { error: "Failed to load faculty analytics", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
