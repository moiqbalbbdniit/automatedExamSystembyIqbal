import * as XLSX from "xlsx";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();

    // Parse the uploaded file
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      return new Response(JSON.stringify({ error: "No data found in sheet" }), { status: 400 });
    }

    // Extract email or ID list
    const userEmails = rows
      .map((row: any) => row.email?.trim())
      .filter((email: string | undefined) => !!email);

    if (!userEmails.length) {
      return new Response(JSON.stringify({ error: "No valid emails found" }), { status: 400 });
    }

    // Perform bulk delete
    const result = await User.deleteMany({ email: { $in: userEmails } });

    return new Response(
      JSON.stringify({
        message: `Deleted ${result.deletedCount} users successfully.`,
        deletedCount: result.deletedCount,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Bulk Delete Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
