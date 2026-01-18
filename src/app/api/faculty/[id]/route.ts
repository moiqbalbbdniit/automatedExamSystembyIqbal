import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Faculty from "@/lib/models/faculty";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await context.params; // ✅ await params
  const faculty = await Faculty.findById(id);
  return NextResponse.json(faculty);
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await context.params; // ✅ await params
  const data = await req.json();
  const updated = await Faculty.findByIdAndUpdate(id, data, { new: true });
  return NextResponse.json(updated);
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await context.params; // ✅ await params
  await Faculty.findByIdAndDelete(id);
  return NextResponse.json({ message: "Deleted" });
}
