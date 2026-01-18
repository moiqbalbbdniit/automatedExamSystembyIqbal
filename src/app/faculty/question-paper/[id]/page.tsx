"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit3,
  Save,
  Printer,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import {jsPDF} from "jspdf";
/**
 * Page: faculty/generate-paper/[id]/page.tsx
 *
 * - Fetches exam by id
 * - Shows questions grouped by type
 * - Allows inline edit (MCQ options, theory, coding)
 * - Update button saves via PUT /api/exams/:id
 * - Print button generates a PDF using html2canvas + jspdf (loaded dynamically)
 */

/* Types */
type Subject = { _id: string; name: string; code?: string };
type Course = { _id: string; name: string; code?: string };
type MCQ = { id?: string; question: string; options?: string[]; answer?: string; marks?: number };
type Theory = { id?: string; question: string; marks?: number };
type Coding = { id?: string; question: string; marks?: number };

type QuestionPaper =
  | { MCQs?: MCQ[]; Theory?: Theory[]; Coding?: Coding[] }
  | any; // tolerate previous shapes

type Exam = {
  _id: string;
  title: string;
  course?: Course | string;
  subject?: Subject | string;
  duration?: number;
  status?: string;
  questions?: QuestionPaper | any;
  instructions?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function GeneratedPaperPage() {
  const params = useParams() as { id?: string };
  const router = useRouter();
  const { user } = useAuth();
  const facultyId = user?.id;
  const examId = params?.id;

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, boolean>>({}); // track edit-per-question
  const printRef = useRef<HTMLDivElement | null>(null);

  // Normalized questions structure in local state for editing
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [theory, setTheory] = useState<Theory[]>([]);
  const [coding, setCoding] = useState<Coding[]>([]);

  type Course = {
  _id: string;
  name: string;
};

const isCourseObject = (value: any): value is Course => {
  return value && typeof value === "object" && "name" in value;
};


  useEffect(() => {
    if (!examId) return;
    fetchExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  async function fetchExam() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/exams/${examId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Failed to fetch exam (status ${res.status})`);
      }
      const data = await res.json();
      setExam(data);

      // Normalize possible question shapes:
      // If exam.questions is an array with objects that have a 'type' field, convert to grouped arrays.
      const q = data.questions || {};

      if (Array.isArray(q)) {
        // old-style: array of { type, question, options?, marks? }
        const mq: MCQ[] = [];
        const th: Theory[] = [];
        const cd: Coding[] = [];
        q.forEach((item: any, idx: number) => {
          const id = item._id || item.id || `${idx}`;
          if (item.type === "mcq" || item.type === "MCQ") {
            mq.push({ id, question: item.question || item.text || "", options: item.options || [], answer: item.answer, marks: item.marks || 0 });
          } else if (item.type === "coding") {
            cd.push({ id, question: item.question || item.text || "", marks: item.marks || 0 });
          } else {
            th.push({ id, question: item.question || item.text || "", marks: item.marks || 0 });
          }
        });
        setMcqs(mq);
        setTheory(th);
        setCoding(cd);
      } else if (typeof q === "object") {
        // new-style: { MCQs: [...], Theory: [...], Coding: [...] }
        setMcqs((q.MCQs || q.mcqs || q.MCQS || []).map((m: any, i: number) => ({
          id: m._id || m.id || `${i}`,
          question: m.question || m.text || "",
          options: m.options || [],
          answer: m.answer,
          marks: m.marks || 0,
        })));
        setTheory((q.Theory || q.theory || []).map((t: any, i: number) => ({
          id: t._id || t.id || `${i}`,
          question: t.question || t.text || "",
          marks: t.marks || 0,
        })));
        setCoding((q.Coding || q.coding || []).map((c: any, i: number) => ({
          id: c._id || c.id || `${i}`,
          question: c.question || c.text || "",
          marks: c.marks || 0,
        })));
      } else {
        // fallback
        setMcqs([]);
        setTheory([]);
        setCoding([]);
      }
    } catch (err: any) {
      console.error("Fetch exam error:", err);
      setError(err.message || "Failed to load exam");
    } finally {
      setLoading(false);
    }
  }

  // Handlers to edit questions
  const onChangeMcq = (idx: number, field: keyof MCQ, value: any) => {
    setMcqs((prev) => {
      const copy = [...prev];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const onChangeTheory = (idx: number, value: string) => {
    setTheory((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], question: value };
      return copy;
    });
  };

  const onChangeCoding = (idx: number, value: string) => {
    setCoding((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], question: value };
      return copy;
    });
  };

  const addMcqOption = (qIdx: number) => {
    setMcqs((prev) => {
      const copy = [...prev];
      copy[qIdx].options = [...(copy[qIdx].options || []), ""];
      return copy;
    });
  };

  const removeMcqOption = (qIdx: number, optIdx: number) => {
    setMcqs((prev) => {
      const copy = [...prev];
      copy[qIdx].options = copy[qIdx].options?.filter((_, i) => i !== optIdx) || [];
      return copy;
    });
  };

  const updateMcqOption = (qIdx: number, optIdx: number, value: string) => {
    setMcqs((prev) => {
      const copy = [...prev];
      const opts = copy[qIdx].options ? [...copy[qIdx].options] : [];
      opts[optIdx] = value;
      copy[qIdx].options = opts;
      return copy;
    });
  };

  const toggleEdit = (id: string | number) => {
    setEditing((prev) => ({ ...prev, [String(id)]: !prev[String(id)] }));
  };

  // Compose request payload from local state
  function composeQuestionsPayload() {
    // We'll try to return the same new-style structure { MCQs: [], Theory: [], Coding: [] }
    const payload: any = {
      MCQs: mcqs.map((m) => ({
        question: m.question,
        options: m.options || [],
        answer: m.answer,
        marks: m.marks || 0,
      })),
      Theory: theory.map((t) => ({ question: t.question, marks: t.marks || 0 })),
      Coding: coding.map((c) => ({ question: c.question, marks: c.marks || 0 })),
    };
    return payload;
  }

  // Save edited paper
  async function handleUpdatePaper() {
    if (!examId) return;
    setSaving(true);
    try {
      const payload = {
        // only update the questions (and keep other exam fields untouched on server)
        questions: composeQuestionsPayload(),
      };
      const res = await fetch(`/api/exams/${examId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update exam");
      }
      setExam(data);
      toast.success("Question paper updated successfully");
    } catch (err: any) {
      console.error("Update error:", err);
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  // Print / download PDF using html2canvas + jspdf (dynamic import)
  // add at top of file


// replace your handlePrint with this function


async function handleDownloadPaper() {
  if (!exam) {
    toast.error("No exam loaded to generate PDF");
    return;
  }

  // ✅ Safely extract course and subject details
  const courseName =
    typeof exam.course === "object" && exam.course !== null
      ? exam.course.name || "Course"
      : String(exam.course || "Course");

  const subjectName =
    typeof exam.subject === "object" && exam.subject !== null
      ? exam.subject.name || "Subject"
      : String(exam.subject || "Subject");

  const subjectCode =
    typeof exam.subject === "object" && exam.subject !== null
      ? exam.subject.code || "N/A"
      : String(exam.subject || "N/A");

  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 50;
  const marginRight = 50;
  const usableWidth = pageWidth - marginLeft - marginRight;
  const lineHeight = 14;

  const totalMCQMarks = mcqs.reduce((s, q) => s + (q.marks || 0), 0);
  const totalTheoryMarks = theory.reduce((s, q) => s + (q.marks || 0), 0);
  const totalCodingMarks = coding.reduce((s, q) => s + (q.marks || 0), 0);
  const totalMarks = totalMCQMarks + totalTheoryMarks + totalCodingMarks;

  let currentY = 60;
  let pageNo = 1;

  // HEADER
  const drawHeader = () => {
    doc.setFont("Times", "Bold");
    doc.setFontSize(11);
    doc.text(`Subject Code: ${subjectCode}`, pageWidth - marginRight - 120, 40);

    doc.setFont("Times", "Bold");
    doc.setFontSize(13);
    doc.text(
      "PAPER ID: " + (exam._id?.toString().slice(0, 8) || "N/A"),
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 20;

    doc.setFontSize(18);
    doc.text("INVERTIS UNIVERSITY", pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += 20;

    doc.setFont("Times", "Normal");
    doc.setFontSize(13);
    doc.text(courseName, pageWidth / 2, currentY, { align: "center" });
    currentY += 18;

    const subjLine = `${subjectName} (${subjectCode})`;
    doc.text(subjLine, pageWidth / 2, currentY, { align: "center" });
    currentY += 16;

    doc.setFontSize(11);
    doc.text(`Time: ${exam.duration ?? "3"} Hours`, marginLeft, currentY);
    doc.text(`Total Marks: ${totalMarks}`, pageWidth - marginRight - 100, currentY);
    currentY += 20;

    doc.setFontSize(10);
    doc.text(
      "Note: 1. Attempt all Sections. If any data missing, choose suitably.",
      marginLeft,
      currentY
    );
    currentY += 24;

    doc.setLineWidth(0.5);
    doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
    currentY += 20;
  };

  const addSectionHeading = (label: string) => {
    doc.setFont("Times", "Bold");
    doc.setFontSize(12);
    doc.text(label, pageWidth / 2, currentY, { align: "center" });
    currentY += 18;
  };

  const addQuestion = (qNo: string, text: string, marks?: number) => {
    const xQ = marginLeft;
    const xM = pageWidth - marginRight - 40; // marks aligned right
    const yStart = currentY;

    doc.setFont("Times", "Normal");
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(text, usableWidth - 80);
    const qHeight = splitText.length * lineHeight + 6;

    if (currentY + qHeight > pageHeight - 60) {
      doc.addPage();
      pageNo++;
      currentY = 60;
      drawHeader();
    }

    doc.setFont("Times", "Bold");
    doc.text(`${qNo}.`, xQ, currentY);

    doc.setFont("Times", "Normal");
    doc.text(splitText, xQ + 25, currentY, { maxWidth: usableWidth - 70 });
    if (marks) doc.text(`${marks}`, xM, yStart);

    currentY += qHeight + 6;
  };

  const addMCQ = (qNo: number, q: any) => {
    addQuestion(`${qNo}`, q.question, q.marks);

    if (q.options && q.options.length > 0) {
      q.options.forEach((opt: string, idx: number) => {
        const optText = `${String.fromCharCode(97 + idx)}) ${opt}`;
        const splitOpt = doc.splitTextToSize(optText, usableWidth - 90);
        splitOpt.forEach((line: any) => {
          if (currentY > pageHeight - 60) {
            doc.addPage();
            pageNo++;
            currentY = 60;
            drawHeader();
          }
          doc.text(line, marginLeft + 35, currentY);
          currentY += lineHeight;
        });
      });
      currentY += 4;
    }
  };

  // DRAW CONTENT
  drawHeader();

  if (mcqs.length > 0) {
    addSectionHeading("SECTION A");
    mcqs.forEach((q, i) => addMCQ(i + 1, q));
  }

  if (theory.length > 0) {
    addSectionHeading("SECTION B");
    theory.forEach((q, i) => addQuestion(`${i + 1}`, q.question, q.marks));
  }

  if (coding.length > 0) {
    addSectionHeading("SECTION C");
    coding.forEach((q, i) => addQuestion(`${i + 1}`, q.question, q.marks));
  }

  doc.setFontSize(9);
  doc.text(`Page ${pageNo}`, pageWidth / 2, pageHeight - 20, { align: "center" });

  doc.save(`${(exam.title || "question-paper").replace(/\s+/g, "-")}.pdf`);
  toast.success("Question Paper PDF Downloaded");
}




  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg bg-black/40 text-white">
        <div className="relative flex flex-col items-center">
          <div className="absolute h-40 w-40 rounded-full bg-indigo-500/20 animate-pulse" />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-24 w-24 text-indigo-400 mb-4 animate-bounce-slow"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.6}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v12H3V4zM2 18h20" />
          </svg>
          <h2 className="text-2xl font-semibold">Generating Question Paper...</h2>
          <p className="text-gray-300 mt-2">Please wait while we load the paper.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-black text-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/faculty">
            <Button variant="ghost" className="bg-transparent border border-gray-700">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Question Paper — Preview & Edit</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleDownloadPaper} className="bg-transparent border border-gray-700">
            <Printer className="w-4 h-4 mr-2" /> Print / Download PDF
          </Button>
          <Button onClick={handleUpdatePaper} disabled={saving} className="bg-indigo-700 hover:bg-indigo-600">
            {saving ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>) : (<><Save className="w-4 h-4 mr-2" /> Update Paper</>)}
          </Button>
        </div>
      </div>

      {error && <div className="bg-red-700/20 border border-red-600 p-3 rounded mb-4 text-red-200">{error}</div>}

      <div ref={printRef} className="space-y-6">
        {/* Header area for PDF */}
        <div className="bg-[#07101a] border border-indigo-900 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold">{exam?.title || "Untitled Exam"}</h2>
              <div className="text-sm text-gray-400">
                {typeof exam?.subject === "object" && exam?.subject?.name
                  ? `${exam.subject.name}${exam.subject.code ? ` (${exam.subject.code})` : ""}`
                  : ""}
              </div>
              <div className="text-sm text-gray-500 mt-2"><div className="text-sm text-gray-500 mt-2">
  Course: {isCourseObject(exam?.course) ? exam.course.name : (exam?.course || "N/A")} 
</div>
</div>
            </div>
            <div className="text-right text-sm text-gray-400">
              <div>Duration: {exam?.duration ?? "—"} min</div>
              <div>Status: {(exam?.status || "draft").toUpperCase()}</div>
            </div>
          </div>

          {exam?.instructions && (
            <div className="mt-4 p-3 bg-gray-900 rounded text-sm text-gray-300 border border-gray-800">
              <strong>Instructions:</strong>
              <div className="mt-2 whitespace-pre-wrap">{exam.instructions}</div>
            </div>
          )}
        </div>

        {/* MCQs */}
        <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-teal-300">MCQs</h3>
            <div className="text-sm text-gray-400">Total: {mcqs.length}</div>
          </div>

          {mcqs.length === 0 && <div className="text-gray-500">No MCQs available.</div>}

          <div className="space-y-4">
            {mcqs.map((q, i) => (
              <div key={q.id ?? i} className="bg-[#0b1220] p-4 rounded border border-gray-800">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="text-sm text-gray-400">Q{i + 1}.</div>
                      <Textarea
                        value={q.question}
                        onChange={(e) => onChangeMcq(i, "question", e.target.value)}
                        className="bg-transparent border border-gray-700 text-gray-100"
                        rows={2}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(q.options || []).map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <Input
                            value={opt}
                            onChange={(e) => updateMcqOption(i, oi, e.target.value)}
                            className="bg-transparent border border-gray-700 text-gray-100"
                          />
                          <button
                            onClick={() => removeMcqOption(i, oi)}
                            className="text-red-400 px-2 py-1 rounded bg-red-900/10"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div>
                        <Button onClick={() => addMcqOption(i)} className="bg-indigo-700 hover:bg-indigo-600">
                          + Option
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="w-36 text-right space-y-2">
                    <label className="text-xs text-gray-400">Marks</label>
                    <Input
                      type="number"
                      value={q.marks || 0}
                      onChange={(e) => onChangeMcq(i, "marks", Number(e.target.value))}
                      className="bg-transparent border border-gray-700 text-gray-100"
                    />
                    <label className="text-xs text-gray-400 mt-2">Answer (optional)</label>
                    <Input
                      value={q.answer || ""}
                      onChange={(e) => onChangeMcq(i, "answer", e.target.value)}
                      className="bg-transparent border border-gray-700 text-gray-100"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Theory */}
        <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-teal-300">Theory (Short / Long)</h3>
            <div className="text-sm text-gray-400">Total: {theory.length}</div>
          </div>

          <div className="space-y-4">
            {theory.length === 0 && <div className="text-gray-500">No theory questions.</div>}
            {theory.map((t, i) => (
              <div key={t.id ?? i} className="bg-[#0b1220] p-4 rounded border border-gray-800">
                <div className="flex gap-4">
                  <div className="w-10 text-gray-400">Q{mcqs.length + i + 1}.</div>
                  <div className="flex-1">
                    <Textarea
                      value={t.question}
                      onChange={(e) => onChangeTheory(i, e.target.value)}
                      className="bg-transparent border border-gray-700 text-gray-100"
                      rows={3}
                    />
                  </div>
                  <div className="w-28">
                    <label className="text-xs text-gray-400">Marks</label>
                    <Input type="number" value={t.marks || 0} onChange={(e) => {
                      setTheory((prev) => {
                        const c = [...prev];
                        c[i] = { ...c[i], marks: Number(e.target.value) };
                        return c;
                      });
                    }} className="bg-transparent border border-gray-700 text-gray-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Coding */}
        <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-teal-300">Coding Questions</h3>
            <div className="text-sm text-gray-400">Total: {coding.length}</div>
          </div>

          <div className="space-y-4">
            {coding.length === 0 && <div className="text-gray-500">No coding questions.</div>}
            {coding.map((c, i) => (
              <div key={c.id ?? i} className="bg-[#0b1220] p-4 rounded border border-gray-800">
                <div className="flex gap-4">
                  <div className="w-10 text-gray-400">Q{mcqs.length + theory.length + i + 1}.</div>
                  <div className="flex-1">
                    <Textarea
                      value={c.question}
                      onChange={(e) => onChangeCoding(i, e.target.value)}
                      className="bg-transparent border border-gray-700 text-gray-100"
                      rows={4}
                    />
                  </div>
                  <div className="w-28">
                    <label className="text-xs text-gray-400">Marks</label>
                    <Input type="number" value={c.marks || 0} onChange={(e) => {
                      setCoding((prev) => {
                        const cc = [...prev];
                        cc[i] = { ...cc[i], marks: Number(e.target.value) };
                        return cc;
                      });
                    }} className="bg-transparent border border-gray-700 text-gray-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
