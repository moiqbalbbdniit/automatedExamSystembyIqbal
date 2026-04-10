import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Section from "@/lib/models/Section";

export async function GET(req: NextRequest) {
  await connectDB();

  const courseId = req.nextUrl.searchParams.get("courseId");
  const query = courseId ? { course: courseId, isActive: true } : { isActive: true };

  const sections = await Section.find(query)
    .sort({ name: 1 })
    .populate("course", "name");

  return NextResponse.json({ sections });
}
