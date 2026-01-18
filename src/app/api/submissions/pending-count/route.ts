import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Submission from "@/lib/models/Submission";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    console.log("✅ [LOG] /api/submissions/pending-count route called");

    await connectDB();

    const url = new URL(req.url);
    const facultyIdString = url.searchParams.get("facultyId");

    console.log("🧩 [LOG] Received facultyId:", facultyIdString);

    if (!facultyIdString || !mongoose.Types.ObjectId.isValid(facultyIdString)) {
      console.warn("⚠️ [LOG] Invalid or missing facultyId:", facultyIdString);
      return NextResponse.json(
        { error: "Invalid or missing facultyId in query parameters." },
        { status: 400 }
      );
    }

    const facultyId = new mongoose.Types.ObjectId(facultyIdString);

    const pendingByExam = await Submission.aggregate([
      {
        $match: {
          facultyId,
          status: "pending_evaluation",
        },
      },
      {
        $group: {
          _id: "$examId",
          count: { $sum: 1 },
        },
      },
    ]);

    const pendingByExamStrings = pendingByExam.map((item) => ({
      _id: item._id?.toString() || "",
      count: item.count,
    }));

    const totalPending = pendingByExamStrings.reduce((sum, x) => sum + x.count, 0);

    console.log("📊 [LOG] Pending aggregation result:", {
      totalPending,
      pendingByExam: pendingByExamStrings,
    });

    return NextResponse.json({
      totalPending,
      pendingByExam: pendingByExamStrings,
    });
  } catch (err: any) {
    console.error("❌ [LOG] Pending count API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}
