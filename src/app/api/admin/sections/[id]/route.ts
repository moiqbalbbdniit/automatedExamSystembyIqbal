import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRoles } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Section from "@/lib/models/Section";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authorizeApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;

  await connectDB();

  const { id } = await params;
  const deleted = await Section.findByIdAndDelete(id);

  if (!deleted) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
