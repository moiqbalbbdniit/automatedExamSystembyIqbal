console.log("✅ /api/users/[id]/change-password route registered!");


import { NextResponse } from "next/server";
import UserModel from "@/lib/models/User";
import { connectDB } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  console.log("🟢 change-password PATCH route triggered");

  try {
    await connectDB();

    const { id } = await context.params; // ✅ fixed async warning
    console.log("🟢 Params ID:", id);

    const { currentPassword, newPassword } = await req.json();
    console.log("🟢 Received body:", { currentPassword, newPassword });

    const user = await UserModel.findById(id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return NextResponse.json({ error: "Incorrect current password" }, { status: 401 });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Change password route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}