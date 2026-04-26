import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Exam from "@/lib/models/Exam";
import axios from "axios";

const EXAM_MODEL_BASE_URL =
  process.env.EXAM_MODEL_URL || process.env.NEXT_PUBLIC_EXAM_MODEL_URL || "http://127.0.0.1:8000";
const PYTHON_API_URL = `${EXAM_MODEL_BASE_URL}/api/v1/generate-paper`;

export async function POST(req: Request) {
  try {
    // extract exam id (second-to-last segment)
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const examId = segments[segments.length - 2];

    if (!examId) {
      return NextResponse.json({ error: "Exam ID missing" }, { status: 400 });
    }

    // connect and fetch exam
    await connectDB();
    const exam = await Exam.findById(examId).populate("subject", "name topics");
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const durationMinutes = Number(exam.duration || 0);

    // Send a richer blueprint payload for better generation quality.
    const payload = {
      subject: exam.subject?.name ? [exam.subject.name] : ["Unknown"],
      topic:
        exam.subject?.topics && exam.subject.topics.length > 0
          ? exam.subject.topics
          : [exam.title || "General"],
      difficulty: [
        exam.veryShort?.difficulty || "medium",
        exam.short?.difficulty || "medium",
        exam.long?.difficulty || "hard",
      ],
      difficulty_profile: {
        mcq: exam.veryShort?.difficulty || "medium",
        short_theory: exam.short?.difficulty || "medium",
        long_theory: exam.long?.difficulty || "hard",
        coding: exam.long?.difficulty || "hard",
      },
      num_mcq: exam.veryShort?.count || 0,
      mcq_max_marks: 1,
      num_short_theory: exam.short?.count || 0,
      short_theory_marks: 3,
      num_long_theory: exam.long?.count || 0,
      long_theory_marks: 8,
      num_coding: exam.coding?.count || 0,
      coding_max_marks: 10,
      duration: `${durationMinutes} minutes`,
      duration_minutes: durationMinutes,
    };

    console.log("📤 Sending payload:", payload);

    // call Python model API
    const response = await axios.post(PYTHON_API_URL, payload, { timeout: 120000 });
    const generated = response.data;
    console.log("✅ Response from Python API:", generated);

    if (!generated || !generated.paper) {
      throw new Error("Invalid response: missing paper data");
    }

    // 🔥 Normalize & merge keys before saving
    const normalizedQuestions = {
      MCQs: generated.paper.MCQs || [],
      Coding: generated.paper.Coding || [],
      Theory: [
        ...(generated.paper.ShortTheory || []),
        ...(generated.paper.LongTheory || []),
      ],
    };

    // save to DB
    exam.questions = normalizedQuestions;
    exam.paper_solutions_map = generated.solutions || generated.paper_solutions_map || {};
    exam.status = "generated";

    const updatedExam = await exam.save();
    return NextResponse.json(updatedExam);
  } catch (err: any) {
    console.error("❌ Generate API Error:", err.response?.data || err.message);
    const message = err.response?.data?.detail || err.message || "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
