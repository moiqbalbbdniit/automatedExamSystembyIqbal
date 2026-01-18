import { NextResponse } from "next/server";
import {connectDB} from "@/lib/db";
import Course from "@/lib/models/Course";

export async function DELETE(req:Request) {
  await connectDB();
  const id = req.url.split("/").pop();
  await Course.findByIdAndDelete(id);
  return NextResponse.json({ message: "Course deleted" });
}
