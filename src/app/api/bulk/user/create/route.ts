import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Course from "@/lib/models/Course";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";

interface ExcelRow {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: string;
  courseName?: string;
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

    console.log(`📄 Loaded ${rows.length} rows from Excel`);

    let created = 0,
      updated = 0,
      skipped = 0;

    for (const row of rows) {
      const email = row.email?.trim()?.toLowerCase();
      const firstName = row.firstName?.trim() || "";
      const lastName = row.lastName?.trim() || "";
      const password = row.password?.trim() || "123456";
      const role = row.role?.trim()?.toLowerCase() || "student";
      const courseName = row.courseName?.trim();

      if (!email || !firstName || !lastName) {
        skipped++;
        continue;
      }

      const hashed = await bcrypt.hash(password, 10);

      // ✅ Find course by courseName field
      let courseDoc = null;
      if (courseName) {
        courseDoc = await Course.findOne({
          name: new RegExp(`^${courseName}$`, "i"),
        });
        if (!courseDoc) {
          console.warn(`⚠️ Course not found for "${courseName}"`);
        }
      }

      const userData: any = {
        firstName,
        lastName,
        email,
        password: hashed,
        role,
        createdAt: new Date(),
      };

      // ✅ Attach course ObjectId if found
      if (courseDoc?._id) {
        userData.course = courseDoc._id;
      }

      const existing = await User.findOne({ email });
      if (existing) {
        await User.updateOne({ email }, { $set: userData });
        updated++;
      } else {
        await User.create(userData);
        created++;
      }
    }

    console.log("🎯 Bulk Upload Summary:", { created, updated, skipped });

    return new Response(
      JSON.stringify({
        message: "Bulk user upload completed successfully",
        summary: { created, updated, skipped },
      }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌ Bulk Upload Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
