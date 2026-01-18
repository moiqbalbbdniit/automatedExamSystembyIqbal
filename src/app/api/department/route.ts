import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Department from "@/lib/models/department";

export async function GET() {
  await connectDB();
  const departments = await Department.find();
  return NextResponse.json(departments);
}

export async function POST(req: Request) {
  await connectDB();
  const data = await req.json();

  try {
    const dept = await Department.create(data);
    return NextResponse.json(dept, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
