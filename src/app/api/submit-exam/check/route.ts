import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Submission from "@/lib/models/Submission";
import { connectDB } from "@/lib/db";

export async function GET(req: Request) {
  await connectDB();

  // Extract studentId from query params
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId");

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return NextResponse.json({ error: "Invalid or missing student ID" }, { status: 400 });
  }

  try {
    // Find submissions by this student
    const submissions = await Submission.find({ studentId }).select("examId").lean();
    return NextResponse.json({ submissions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
