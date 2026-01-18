import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Department from "@/lib/models/department";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const id = req.url.split("/").pop(); // get ID from URL
  const dept = await Department.findById(id);
  return NextResponse.json(dept);
}

export async function PUT(req: Request) {
  await connectDB();
  const id = req.url.split("/").pop();
  const data = await req.json();
  const updated = await Department.findByIdAndUpdate(id, data, { new: true });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  await connectDB();
  const id = req.url.split("/").pop();
  await Department.findByIdAndDelete(id);
  return NextResponse.json({ message: "Deleted" });
}
