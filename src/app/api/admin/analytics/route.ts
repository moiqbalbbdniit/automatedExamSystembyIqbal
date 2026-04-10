import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ExamResult from "@/lib/models/ExamResult";
import Exam from "@/lib/models/Exam";
import User from "@/lib/models/User";
import Submission from "@/lib/models/Submission";
import Course from "@/lib/models/Course";
import mongoose from "mongoose";

type NumericSummary = {
  totalResults: number;
  totalStudents: number;
  totalCourses: number;
  totalFaculties: number;
  avgPercentage: number;
  passRate: number;
};

type ResultRow = {
  id: string;
  examId: string;
  examTitle: string;
  examDate: string;
  courseId: string;
  courseName: string;
  subjectName: string;
  facultyId: string;
  facultyName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  percentage: number;
  marksObtained: number;
  maxMarks: number;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId") || "all";
    const facultyId = searchParams.get("facultyId") || "all";
    const studentId = searchParams.get("studentId") || "all";
    const daysParam = Number(searchParams.get("days") || "0");

    const examResultQuery: Record<string, unknown> = {};
    if (studentId !== "all") {
      examResultQuery.studentId = studentId;
    }

    if (Number.isFinite(daysParam) && daysParam > 0) {
      const from = new Date();
      from.setDate(from.getDate() - daysParam);
      examResultQuery.createdAt = { $gte: from };
    }

    const rawResults = await ExamResult.find(examResultQuery)
      .populate({
        path: "examId",
        model: Exam,
        select: "title facultyId course subject createdAt",
        populate: [
          { path: "course", select: "name" },
          { path: "subject", select: "name code" },
        ],
      })
      .populate({
        path: "studentId",
        model: User,
        select: "firstName lastName email course",
        populate: { path: "course", select: "name" },
      })
      .sort({ createdAt: -1 })
      .lean();

    const facultyIdsFromExams = Array.from(
      new Set(
        rawResults
          .map((r: any) => r?.examId?.facultyId)
          .filter(Boolean)
          .map((v: unknown) => String(v))
      )
    );

    const facultyUsers = await User.find(
      { _id: { $in: facultyIdsFromExams } },
      { firstName: 1, lastName: 1, email: 1 }
    ).lean();

    const facultyNameMap = new Map<string, string>();
    for (const f of facultyUsers as any[]) {
      const name = `${f.firstName || ""} ${f.lastName || ""}`.trim() || f.email || "Unknown Faculty";
      facultyNameMap.set(String(f._id), name);
    }

    const rawCourseValues = Array.from(
      new Set((rawResults as any[]).map((r) => r?.examId?.course).filter(Boolean))
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

    const normalized: ResultRow[] = (rawResults as any[])
      .map((r) => {
        const exam = r?.examId;
        const student = r?.studentId;
        const mappedFacultyId = String(exam?.facultyId || r?.facultyId || "");
        const examCourseRaw = exam?.course;
        const examCourseKey =
          typeof examCourseRaw === "object" && examCourseRaw?._id
            ? String(examCourseRaw._id)
            : typeof examCourseRaw === "string" && mongoose.Types.ObjectId.isValid(examCourseRaw)
              ? examCourseRaw
              : typeof examCourseRaw === "string"
                ? `name:${examCourseRaw}`
                : "unknown";
        const derivedCourseName =
          (typeof examCourseRaw === "object" && examCourseRaw?.name) ||
          courseNameMap.get(examCourseKey) ||
          student?.course?.name ||
          "Unassigned Course";
        const derivedCourseId =
          typeof examCourseRaw === "object" && examCourseRaw?._id
            ? String(examCourseRaw._id)
            : typeof examCourseRaw === "string" && mongoose.Types.ObjectId.isValid(examCourseRaw)
              ? examCourseRaw
              : typeof examCourseRaw === "string"
                ? `name:${examCourseRaw}`
                : String(student?.course?._id || "unknown");

        return {
          id: String(r?._id || ""),
          examId: String(exam?._id || ""),
          examTitle: exam?.title || "Untitled Exam",
          examDate: new Date(r?.createdAt || exam?.createdAt || Date.now()).toISOString(),
          courseId: derivedCourseId,
          courseName: derivedCourseName,
          subjectName: exam?.subject?.name || "Unknown Subject",
          facultyId: mappedFacultyId || "unknown",
          facultyName: facultyNameMap.get(mappedFacultyId) || "Unknown Faculty",
          studentId: String(student?._id || r?.studentId || ""),
          studentName:
            `${student?.firstName || ""} ${student?.lastName || ""}`.trim() ||
            student?.email ||
            "Unknown Student",
          studentEmail: student?.email || "",
          percentage: Number(r?.percentage || 0),
          marksObtained: Number(r?.totalMarksObtained || 0),
          maxMarks: Number(r?.totalMaxMarks || 0),
        };
      })
      .filter((row) => row.examId && row.studentId);

    const filtered = normalized.filter((row) => {
      if (courseId !== "all" && row.courseId !== courseId) return false;
      if (facultyId !== "all" && row.facultyId !== facultyId) return false;
      return true;
    });

    const resultsByStudent = new Map<string, ResultRow[]>();
    const resultsByCourse = new Map<string, ResultRow[]>();
    const resultsByFaculty = new Map<string, ResultRow[]>();
    const resultsBySubject = new Map<string, ResultRow[]>();

    for (const row of filtered) {
      if (!resultsByStudent.has(row.studentId)) resultsByStudent.set(row.studentId, []);
      if (!resultsByCourse.has(row.courseId)) resultsByCourse.set(row.courseId, []);
      if (!resultsByFaculty.has(row.facultyId)) resultsByFaculty.set(row.facultyId, []);
      if (!resultsBySubject.has(row.subjectName)) resultsBySubject.set(row.subjectName, []);

      resultsByStudent.get(row.studentId)!.push(row);
      resultsByCourse.get(row.courseId)!.push(row);
      resultsByFaculty.get(row.facultyId)!.push(row);
      resultsBySubject.get(row.subjectName)!.push(row);
    }

    const avgPct = filtered.length
      ? round2(filtered.reduce((a, b) => a + b.percentage, 0) / filtered.length)
      : 0;
    const passRate = filtered.length
      ? round2((filtered.filter((r) => r.percentage >= 40).length / filtered.length) * 100)
      : 0;

    const summary: NumericSummary = {
      totalResults: filtered.length,
      totalStudents: resultsByStudent.size,
      totalCourses: resultsByCourse.size,
      totalFaculties: resultsByFaculty.size,
      avgPercentage: avgPct,
      passRate,
    };

    const topPerformers = Array.from(resultsByStudent.entries())
      .map(([id, items]) => {
        const avg = items.reduce((a, b) => a + b.percentage, 0) / items.length;
        const latest = items[0];
        return {
          studentId: id,
          studentName: latest.studentName,
          courseName: latest.courseName,
          attempts: items.length,
          avgPercentage: round2(avg),
          bestPercentage: round2(Math.max(...items.map((x) => x.percentage))),
        };
      })
      .sort((a, b) => b.avgPercentage - a.avgPercentage)
      .slice(0, 10);

    const studentsTable = Array.from(resultsByStudent.entries())
      .map(([id, items]) => {
        const sortedByDateDesc = [...items].sort(
          (a, b) => +new Date(b.examDate) - +new Date(a.examDate)
        );
        const avg = items.reduce((a, b) => a + b.percentage, 0) / items.length;
        const passRateForStudent = round2(
          (items.filter((x) => x.percentage >= 40).length / Math.max(items.length, 1)) * 100
        );
        return {
          studentId: id,
          studentName: items[0]?.studentName || "Unknown Student",
          studentEmail: items[0]?.studentEmail || "",
          courseName: items[0]?.courseName || "Unassigned Course",
          attempts: items.length,
          avgPercentage: round2(avg),
          bestPercentage: round2(Math.max(...items.map((x) => x.percentage))),
          passRate: passRateForStudent,
          lastExamDate: sortedByDateDesc[0]?.examDate || new Date(0).toISOString(),
        };
      })
      .sort((a, b) => b.avgPercentage - a.avgPercentage);

    const coursePerformance = Array.from(resultsByCourse.entries())
      .map(([id, items]) => ({
        courseId: id,
        courseName: items[0]?.courseName || "Unassigned Course",
        attempts: items.length,
        students: new Set(items.map((x) => x.studentId)).size,
        avgPercentage: round2(items.reduce((a, b) => a + b.percentage, 0) / items.length),
        passRate: round2((items.filter((x) => x.percentage >= 40).length / items.length) * 100),
      }))
      .sort((a, b) => b.avgPercentage - a.avgPercentage);

    const facultyPerformance = Array.from(resultsByFaculty.entries())
      .map(([id, items]) => {
        const grouped = new Map<string, ResultRow[]>();
        for (const it of items) {
          if (!grouped.has(it.studentId)) grouped.set(it.studentId, []);
          grouped.get(it.studentId)!.push(it);
        }
        const topStudents = Array.from(grouped.values())
          .map((arr) => ({
            studentId: arr[0].studentId,
            studentName: arr[0].studentName,
            avgPercentage: round2(arr.reduce((a, b) => a + b.percentage, 0) / arr.length),
          }))
          .sort((a, b) => b.avgPercentage - a.avgPercentage)
          .slice(0, 3);

        return {
          facultyId: id,
          facultyName: items[0]?.facultyName || "Unknown Faculty",
          attempts: items.length,
          uniqueStudents: new Set(items.map((x) => x.studentId)).size,
          avgPercentage: round2(items.reduce((a, b) => a + b.percentage, 0) / items.length),
          topStudents,
        };
      })
      .sort((a, b) => b.avgPercentage - a.avgPercentage);

    const subjectPerformance = Array.from(resultsBySubject.entries())
      .map(([subjectName, items]) => ({
        subjectName,
        attempts: items.length,
        avgPercentage: round2(items.reduce((a, b) => a + b.percentage, 0) / items.length),
      }))
      .sort((a, b) => b.avgPercentage - a.avgPercentage);

    const selectedStudentId = studentId !== "all" ? studentId : null;
    const studentItems = selectedStudentId ? filtered.filter((r) => r.studentId === selectedStudentId) : [];
    const studentOverview = selectedStudentId
      ? {
          studentId: selectedStudentId,
          studentName: studentItems[0]?.studentName || "Unknown Student",
          courseName: studentItems[0]?.courseName || "Unassigned Course",
          attempts: studentItems.length,
          avgPercentage: studentItems.length
            ? round2(studentItems.reduce((a, b) => a + b.percentage, 0) / studentItems.length)
            : 0,
          bestPercentage: studentItems.length ? round2(Math.max(...studentItems.map((x) => x.percentage))) : 0,
          recentExams: studentItems
            .sort((a, b) => +new Date(b.examDate) - +new Date(a.examDate))
            .slice(0, 10)
            .map((x) => ({
              examId: x.examId,
              examTitle: x.examTitle,
              subjectName: x.subjectName,
              facultyName: x.facultyName,
              percentage: x.percentage,
              marksObtained: x.marksObtained,
              maxMarks: x.maxMarks,
              date: x.examDate,
            })),
          trend: studentItems
            .sort((a, b) => +new Date(a.examDate) - +new Date(b.examDate))
            .map((x) => ({
              label: new Date(x.examDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
              percentage: x.percentage,
              examTitle: x.examTitle,
            })),
        }
      : null;

    const studentsInScope = await User.find(
      { role: "student" },
      { firstName: 1, lastName: 1, email: 1 }
    ).lean();

    const filterOptions = {
      courses: coursePerformance.map((c) => ({ id: c.courseId, name: c.courseName })),
      faculties: facultyPerformance.map((f) => ({ id: f.facultyId, name: f.facultyName })),
      students: (studentsInScope as any[]).map((s) => ({
        id: String(s._id),
        name: `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.email,
      })),
    };

    const totalExams = await Exam.countDocuments();
    const totalSubmissions = await Submission.countDocuments();

    const areaData = coursePerformance.map((c) => ({
      course: c.courseName,
      totalExams: c.attempts,
      avgPercentage: c.avgPercentage,
    }));
    const pieData = subjectPerformance.map((s) => ({ name: s.subjectName, value: s.attempts }));

    return NextResponse.json({
      summary: {
        ...summary,
        totalExams,
        totalSubmissions,
      },
      filterOptions,
      coursePerformance,
      facultyPerformance,
      subjectPerformance,
      topPerformers,
      studentsTable,
      studentOverview,
      recentResults: filtered.slice(0, 25),
      areaData,
      pieData,
    });
  } catch (error: any) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { error: "Failed to generate analytics", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
