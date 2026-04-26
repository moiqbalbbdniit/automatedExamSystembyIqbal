import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import FacultyClassSection from "@/lib/models/FacultyClassSection";
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

    if (auth.user.role === "admin") {
      const result = await User.deleteMany({
        email: { $in: userEmails },
        role: "faculty",
      });

      return NextResponse.json({
        message: `Deleted ${result.deletedCount} faculty users successfully.`,
        summary: {
          requested: userEmails.length,
          deletedCount: result.deletedCount,
          skipped: Math.max(0, userEmails.length - Number(result.deletedCount || 0)),
        },
      });
    }

    const facultyAssignments = await FacultyClassSection.find({
      facultyUserId: auth.user.id,
      isActive: true,
    })
      .select("course section")
      .lean();

    const assignmentSet = new Set(
      (facultyAssignments as Array<{ course: unknown; section: unknown }>).map(
        (item) => `${String(item.course)}|${String(item.section)}`
      )
    );

    if (assignmentSet.size === 0) {
      return NextResponse.json(
        {
          message: "No assigned class-section found for this faculty.",
          summary: { requested: userEmails.length, deletedCount: 0, skipped: userEmails.length },
        },
        { status: 200 }
      );
    }

    const candidates = await User.find({
      email: { $in: userEmails },
      role: "student",
    })
      .select("_id course section")
      .lean();

    const deletableIds = (candidates as Array<{ _id: unknown; course?: unknown; section?: unknown }>)
      .filter((u) => assignmentSet.has(`${String(u.course)}|${String(u.section)}`))
      .map((u) => u._id);

    const result = deletableIds.length
      ? await User.deleteMany({ _id: { $in: deletableIds } })
      : { deletedCount: 0 };

    return NextResponse.json({
      message: `Deleted ${result.deletedCount} student users successfully.`,
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
