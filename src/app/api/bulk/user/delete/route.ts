import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { authorizeApiRoles } from "@/lib/apiAuth";

const normalizeText = (value: unknown) => String(value ?? "").trim();

export async function POST(req: NextRequest) {
  try {
    const auth = authorizeApiRoles(req, ["admin", "faculty"]);
    if (!auth.ok) return auth.response;

    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    if (!rows.length) {
      return NextResponse.json({ error: "No data found in sheet" }, { status: 400 });
    }

    const userEmails = Array.from(
      new Set(
        rows
          .map((row) => normalizeText(row.email).toLowerCase())
          .filter((email) => email.length > 0)
      )
    );

    if (!userEmails.length) {
      return NextResponse.json({ error: "No valid emails found" }, { status: 400 });
    }

    const deleteQuery: Record<string, unknown> = { email: { $in: userEmails } };
    if (auth.user.role === "faculty") {
      deleteQuery.role = "student";
    }

    const result = await User.deleteMany(deleteQuery);

    return NextResponse.json({
      message: `Deleted ${result.deletedCount} users successfully.`,
      summary: {
        requested: userEmails.length,
        deletedCount: result.deletedCount,
        skipped: Math.max(0, userEmails.length - Number(result.deletedCount || 0)),
      },
    });
  } catch (error: any) {
    console.error("Bulk Delete Error:", error);
    return NextResponse.json({ error: error.message || "Bulk delete failed" }, { status: 500 });
  }
}
