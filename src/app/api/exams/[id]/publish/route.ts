import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Exam from "@/lib/models/Exam";

// PUT: Publish exam
export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const examId = segments[segments.length - 2]; // [id] segment

    if (!examId) {
      return NextResponse.json({ error: "Exam ID is missing" }, { status: 400 });
    }

    await connectDB();

  const updatedExam = await Exam.findByIdAndUpdate(
        examId,
        { 
          status: "published", 
          isPublished: true, 
          publishedAt: new Date() // <-- THIS saves the current date/time
        },
        { new: true } // This returns the updated document
    ).populate("subject", "name code");
    
    if (!updatedExam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json(updatedExam); // Return the updated exam data

  } catch (err: any) {
    console.error("Publish API Error:", err.message);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

// POST: Placeholder (optional)
export async function POST(req: Request) {
  try {
    return NextResponse.json({ message: "We are working on it 🚧" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}