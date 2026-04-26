import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Course from "@/lib/models/Course";
import Section from "@/lib/models/Section";
import FacultyClassSection from "@/lib/models/FacultyClassSection";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import { authorizeApiRoles } from "@/lib/apiAuth";

interface ExcelRow {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: string;
  courseName?: string;
  sectionCode?: string;
}

type BulkSummary = {
  created: number;
  updated: number;
  skipped: number;
};

const normalizeText = (value: unknown) => String(value ?? "").trim();

export async function POST(req: NextRequest) {
  try {
    const auth = authorizeApiRoles(req, ["admin", "faculty"]);
    if (!auth.ok) return auth.response;

    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, {
        status: 400,
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: "" });

    if (!rows.length) {
      return NextResponse.json({ error: "No rows found in uploaded file" }, { status: 400 });
    }

    const emails = Array.from(
      new Set(
        rows
          .map((row) => normalizeText(row.email).toLowerCase())
          .filter((email) => email.length > 0)
      )
    );

    const existingUsers = emails.length
      ? await User.find({ email: { $in: emails } }, { _id: 1, email: 1, role: 1 }).lean()
      : [];
    const existingByEmail = new Map(existingUsers.map((u: any) => [String(u.email).toLowerCase(), u]));

    const uniqueCourseNames = Array.from(
      new Set(rows.map((row) => normalizeText(row.courseName).toLowerCase()).filter(Boolean))
    );

    const facultyAssignments = auth.user.role === "faculty"
      ? await FacultyClassSection.find({ facultyUserId: auth.user.id, isActive: true })
          .select("course section")
          .lean()
      : [];

    const facultyAssignmentSet = new Set(
      (facultyAssignments as Array<{ course: unknown; section: unknown }>).map(
        (item) => `${String(item.course)}|${String(item.section)}`
      )
    );

    const courseDocs = uniqueCourseNames.length
      ? await Course.find({
          name: {
            $in: uniqueCourseNames.map(
              (name) => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
            ),
          },
        }).lean()
      : [];

    const courseByName = new Map<string, any>();
    for (const course of courseDocs as any[]) {
      courseByName.set(String(course.name || "").trim().toLowerCase(), course);
    }

    const sectionDocs = courseDocs.length
      ? await Section.find({ course: { $in: (courseDocs as any[]).map((course) => course._id) } }).lean()
      : [];

    const sectionByCourseAndCode = new Map<string, any>();
    for (const section of sectionDocs as any[]) {
      const key = `${String(section.course)}|${String(section.code || "").trim().toUpperCase()}`;
      sectionByCourseAndCode.set(key, section);
    }

    const summary: BulkSummary = { created: 0, updated: 0, skipped: 0 };
    const defaultHashedPassword = await bcrypt.hash("password123", 10);
    const operations: any[] = [];

    for (const row of rows) {
      const email = normalizeText(row.email).toLowerCase();
      const firstName = normalizeText(row.firstName);
      const lastName = normalizeText(row.lastName);
      const password = normalizeText(row.password);
      const role = auth.user.role === "faculty" ? "student" : "faculty";
      const courseName = normalizeText(row.courseName).toLowerCase();
      const sectionCode = normalizeText(row.sectionCode).toUpperCase();

      if (!email || !firstName || !lastName) {
        summary.skipped += 1;
        continue;
      }

      const existing = existingByEmail.get(email);
      const courseDoc = courseName ? courseByName.get(courseName) : null;
      const sectionDoc =
        courseDoc && sectionCode
          ? sectionByCourseAndCode.get(`${String(courseDoc._id)}|${sectionCode}`)
          : null;

      if (auth.user.role === "faculty" && (!courseDoc || !sectionDoc)) {
        summary.skipped += 1;
        continue;
      }

      if (auth.user.role === "faculty") {
        const assignmentKey = `${String(courseDoc._id)}|${String(sectionDoc._id)}`;
        if (!facultyAssignmentSet.has(assignmentKey)) {
          summary.skipped += 1;
          continue;
        }
      }

      const userData: Record<string, unknown> = {
        firstName,
        lastName,
        email,
        role,
      };

      if (courseDoc?._id && auth.user.role === "faculty") {
        userData.course = courseDoc._id;
      }

      if (sectionDoc?._id && auth.user.role === "faculty") {
        userData.section = sectionDoc._id;
      }

      if (existing) {
        if (password) {
          userData.password = await bcrypt.hash(password, 10);
        }
        operations.push({
          updateOne: {
            filter: { _id: existing._id },
            update: { $set: userData },
          },
        });
        summary.updated += 1;
      } else {
        operations.push({
          insertOne: {
            document: {
              ...userData,
              password: password ? await bcrypt.hash(password, 10) : defaultHashedPassword,
              createdAt: new Date(),
            },
          },
        });
        summary.created += 1;
      }
    }

    if (operations.length > 0) {
      await User.bulkWrite(operations, { ordered: false });
    }

    return NextResponse.json({
      message: "Bulk user upload completed successfully",
      summary,
    });
  } catch (err: any) {
    console.error("❌ Bulk Upload Error:", err);
    return NextResponse.json({ error: err.message || "Bulk upload failed" }, {
      status: 500,
    });
  }
}
