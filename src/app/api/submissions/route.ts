// app/api/submissions/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Submission from "@/lib/models/Submission";
import Exam from "@/lib/models/Exam";

const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();

export async function GET(req: Request) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const examId = url.searchParams.get("examId");

        if (!examId) {
            return NextResponse.json({ error: "Missing examId query parameter" }, { status: 400 });
        }

        // Fetch all submissions for that exam
        const [submissions, exam] = await Promise.all([
            Submission.find({ examId }).sort({ createdAt: 1 }).lean(),
            Exam.findById(examId).select("paper_solutions_map").lean(),
        ]);

        const solutions = (exam as any)?.paper_solutions_map || {};
        const byId = new Map<string, any>();
        const byQuestionText = new Map<string, any>();

        Object.entries(solutions).forEach(([qId, meta]) => {
            const data = meta as any;
            byId.set(String(qId), data);
            byQuestionText.set(normalize(data?.question), data);
        });

        const enriched = submissions.map((submission: any) => ({
            ...submission,
            answers: Array.isArray(submission?.answers)
                ? submission.answers.map((answer: any) => {
                    const solution =
                        (answer?.questionId && byId.get(String(answer.questionId))) ||
                        byQuestionText.get(normalize(answer?.questionText));

                    return {
                        ...answer,
                        questionType: solution?.type,
                        correctAnswer: solution?.correct_answer,
                    };
                })
                : [],
        }));

        return NextResponse.json(enriched);
    } catch (err: any) {
        console.error("Submissions GET error:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}