// app/api/submissions/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Submission from "@/lib/models/Submission";

export async function GET(req: Request) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const examId = url.searchParams.get("examId");

        if (!examId) {
            return NextResponse.json({ error: "Missing examId query parameter" }, { status: 400 });
        }

        // Fetch all submissions for that exam
        const submissions = await Submission.find({ examId }).sort({ createdAt: 1 });

        return NextResponse.json(submissions);
    } catch (err: any) {
        console.error("Submissions GET error:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}