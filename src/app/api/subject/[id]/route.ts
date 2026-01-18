import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/lib/models/subject";
import Faculty from "@/lib/models/faculty";

export async function GET(req: Request) {
  await connectDB();
  const id = req.url.split("/").pop();
  const subject = await Subject.findById(id).populate("faculty", "name email department");
  return NextResponse.json(subject);
}

export async function PUT(req: Request) {
  await connectDB();
  const id = req.url.split("/").pop();
  const data = await req.json();

  // Split topics string into array if needed
  if (data.topics && typeof data.topics === "string") {
    data.topics = data.topics
      .split(",")
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0);
  }

  
  if (data.faculty) {
    const facultyExists = await Faculty.findById(data.faculty);
    if (!facultyExists) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 400 });
    }
  }

  const updated = await Subject.findByIdAndUpdate(id, data, { new: true }).populate(
    "faculty",
    "name email department"
  );
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  await connectDB();
  const id = req.url.split("/").pop();
  await Subject.findByIdAndDelete(id);
  return NextResponse.json({ message: "Deleted" });
}
