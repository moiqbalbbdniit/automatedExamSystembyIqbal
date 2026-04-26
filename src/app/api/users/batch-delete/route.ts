import { NextRequest, NextResponse } from "next/server";
import UserModel from "@/lib/models/User";
import FacultyClassSection from "@/lib/models/FacultyClassSection";
import { connectDB } from "@/lib/db";
import { authorizeApiRoles } from "@/lib/apiAuth";

const normalize = (v: unknown) => String(v ?? "").trim();

const getFacultyAssignmentSet = async (facultyUserId: string) => {
  const assignments = await FacultyClassSection.find({
    facultyUserId,
    isActive: true,
  })
    .select("course section")
    .lean();

  return new Set(
    (assignments as Array<{ course: unknown; section: unknown }>).map(
      (item) => `${String(item.course)}|${String(item.section)}`
    )
  );
};

export async function POST(req: NextRequest) {
  const auth = authorizeApiRoles(req, ["admin", "faculty"]);
  if (!auth.ok) return auth.response;

  await connectDB();

  try {
    const body = await req.json();
    const emailsInput = Array.isArray(body?.emails) ? body.emails : [];
    const emails = Array.from(
      new Set(
        emailsInput
          .map((email: unknown) => normalize(email).toLowerCase())
          .filter((email: string) => email.length > 0)
      )
    );

    if (emails.length === 0) {
      return NextResponse.json({ error: "No valid emails provided" }, { status: 400 });
    }

    if (auth.user.role === "admin") {
      const result = await UserModel.deleteMany({
        email: { $in: emails },
        role: "faculty",
      });

      return NextResponse.json({
        message: `Deleted ${result.deletedCount} faculty users successfully.`,
        summary: {
          requested: emails.length,
          deletedCount: result.deletedCount,
          skipped: Math.max(0, emails.length - Number(result.deletedCount || 0)),
        },
      });
    }

    const assignmentSet = await getFacultyAssignmentSet(auth.user.id);
    if (assignmentSet.size === 0) {
      return NextResponse.json({
        message: "No assigned class-section found for this faculty.",
        summary: { requested: emails.length, deletedCount: 0, skipped: emails.length },
      });
    }

    const candidates = await UserModel.find({
      email: { $in: emails },
      role: "student",
    })
      .select("_id course section")
      .lean();

    const deletableIds = (candidates as Array<{ _id: unknown; course?: unknown; section?: unknown }>)
      .filter((u) => assignmentSet.has(`${String(u.course)}|${String(u.section)}`))
      .map((u) => u._id);

    const result = deletableIds.length
      ? await UserModel.deleteMany({ _id: { $in: deletableIds } })
      : { deletedCount: 0 };

    return NextResponse.json({
      message: `Deleted ${result.deletedCount} student users successfully.`,
      summary: {
        requested: emails.length,
        deletedCount: result.deletedCount,
        skipped: Math.max(0, emails.length - Number(result.deletedCount || 0)),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to delete users" }, { status: 500 });
  }
}
