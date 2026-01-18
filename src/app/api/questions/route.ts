// app/api/questions/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Question from "@/lib/models/Question";

// GET all questions
export async function GET() {
  try {
    await connectDB();
    const questions = await Question.find().sort({ createdAt: -1 });
    return NextResponse.json(questions, { status: 200 });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// POST add new question
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const newQuestion = new Question(body);
    const saved = await newQuestion.save();
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
