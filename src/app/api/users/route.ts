import { NextResponse } from "next/server";
import UserModel from "@/lib/models/User";
import { connectDB } from "@/lib/db";

export async function GET() {
  await connectDB();
  try {
    const users = await UserModel.find({}, "firstName lastName email role username");
    return NextResponse.json(users);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}