import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import UserModel from "@/lib/models/User";
import FacultyClassSection from "@/lib/models/FacultyClassSection";
import { connectDB } from "@/lib/db";
import { authorizeApiRoles } from "@/lib/apiAuth";

type CreateUserPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: string;
  course?: string;
  section?: string;
};

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

export async function GET(req: NextRequest) {
  const auth = authorizeApiRoles(req, ["admin", "faculty"]);
  if (!auth.ok) return auth.response;

  await connectDB();

  try {
    const roleQuery = normalize(req.nextUrl.searchParams.get("role")).toLowerCase();
    const projection = "firstName lastName email role course section";

    if (auth.user.role === "admin") {
      const role = roleQuery || "faculty";
      if (role !== "faculty") {
        return NextResponse.json({ error: "Admin can access faculty users only from this endpoint" }, { status: 403 });
      }

      const users = await UserModel.find({ role: "faculty" }, projection).sort({ createdAt: -1 }).lean();
      return NextResponse.json(users);
    }

    const assignmentSet = await getFacultyAssignmentSet(auth.user.id);
    if (assignmentSet.size === 0) {
      return NextResponse.json([]);
    }

    const students = await UserModel.find({ role: "student" }, projection)
      .sort({ createdAt: -1 })
      .lean();

    const filtered = (students as Array<{ course?: unknown; section?: unknown }>).filter((user) =>
      assignmentSet.has(`${String(user.course)}|${String(user.section)}`)
    );

    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = authorizeApiRoles(req, ["admin", "faculty"]);
  if (!auth.ok) return auth.response;

  await connectDB();

  try {
    const body = await req.json();
    const payloads: CreateUserPayload[] = Array.isArray(body?.users)
      ? body.users
      : [body as CreateUserPayload];

    if (!payloads.length) {
      return NextResponse.json({ error: "No users provided" }, { status: 400 });
    }

    const assignmentSet = auth.user.role === "faculty" ? await getFacultyAssignmentSet(auth.user.id) : new Set<string>();

    const summary = { created: 0, skipped: 0 };
    const errors: string[] = [];

    for (let i = 0; i < payloads.length; i += 1) {
      const row = payloads[i];
      const firstName = normalize(row.firstName);
      const lastName = normalize(row.lastName);
      const email = normalize(row.email).toLowerCase();
      const password = normalize(row.password) || "password123";
      const course = normalize(row.course);
      const section = normalize(row.section);

      const role = auth.user.role === "admin" ? "faculty" : "student";

      if (!firstName || !lastName || !email) {
        summary.skipped += 1;
        errors.push(`Row ${i + 1}: firstName, lastName and email are required`);
        continue;
      }

      const existing = await UserModel.findOne({ email }).lean();
      if (existing) {
        summary.skipped += 1;
        errors.push(`Row ${i + 1}: user already exists for ${email}`);
        continue;
      }

      const userDoc: Record<string, unknown> = {
        firstName,
        lastName,
        email,
        role,
        password: await bcrypt.hash(password, 10),
      };

      if (role === "student") {
        if (!course || !section) {
          summary.skipped += 1;
          errors.push(`Row ${i + 1}: class and section are required for student`);
          continue;
        }

        const key = `${course}|${section}`;
        if (!assignmentSet.has(key)) {
          summary.skipped += 1;
          errors.push(`Row ${i + 1}: class-section is not assigned to this faculty`);
          continue;
        }

        userDoc.course = course;
        userDoc.section = section;
      }

      await UserModel.create(userDoc);
      summary.created += 1;
    }

    return NextResponse.json({
      message: "User creation completed",
      summary,
      errors,
    });
  } catch {
    return NextResponse.json({ error: "Failed to create users" }, { status: 500 });
  }
}