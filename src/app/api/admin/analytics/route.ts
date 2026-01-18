import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Exam from "@/lib/models/Exam";
import Subject from "@/lib/models/subject";

export async function GET() {
  await connectDB();

  // ✅ Fetch course-wise exam count for area chart
  const examsByCourse = await Exam.aggregate([
    { $group: { _id: "$course", totalExams: { $sum: 1 } } },
    { $sort: { totalExams: -1 } },
  ]);

  // ✅ Fetch subject-wise exam count for pie chart
  const examsBySubject = await Exam.aggregate([
    { $group: { _id: "$subject", totalExams: { $sum: 1 } } },
    { $sort: { totalExams: -1 } },
  ]);

  // Populate subject names using subjectId
  const subjectMap: { [key: string]: string } = {};
  const subjects = await Subject.find(
    { _id: { $in: examsBySubject.map((s) => s._id) } },
    { _id: 1, name: 1 }
  );

  subjects.forEach((subj) => {
    subjectMap[subj._id.toString()] = subj.name;
  });

  // Format both datasets for frontend
  const areaData = examsByCourse.map((c) => ({
    course: c._id || "Unknown",
    totalExams: c.totalExams,
  }));

  const pieData = examsBySubject.map((s) => ({
    name: subjectMap[s._id?.toString()] || "Unknown Subject",
    value: s.totalExams,
  }));

  return NextResponse.json({ areaData, pieData });
}
