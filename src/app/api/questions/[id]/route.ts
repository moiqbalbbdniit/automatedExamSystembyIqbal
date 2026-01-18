import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Question from "@/lib/models/Question";

export async function PUT(req: Request) {
  try {
    await connectDB();
    const id = req.url.split("/").pop(); // get the ID from the URL
    const body = await req.json();
    const updated = await Question.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const id = req.url.split("/").pop(); // get the ID from the URL
    await Question.findByIdAndDelete(id);
    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
