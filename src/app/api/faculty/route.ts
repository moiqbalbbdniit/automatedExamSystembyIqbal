import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db"; 
import Faculty from "@/lib/models/faculty";

export async function GET() {
  await connectDB();
  const faculties = await Faculty.find();
  return NextResponse.json(faculties);
}

export async function POST(req: Request) {
  await connectDB();
  const data = await req.json();
  try {
    const faculty = await Faculty.create(data);
    return NextResponse.json(faculty, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
