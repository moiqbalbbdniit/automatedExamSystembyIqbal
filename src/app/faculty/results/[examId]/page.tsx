"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, BarChart2, Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import GlobalLoader from "@/components/GlobalLoader";

type EvaluationDetail = {
  questionText: string;
  scoreObtained: number;
  maximumScore: number;
  studentAnswer?: string;
  feedback?: string;
};

type Answer = {
  questionId?: string;
  questionText: string;
  studentAnswer: string;
  marks?: number;
  questionType?: string;
  correctAnswer?: string;
};

type Submission = {
  _id: string;
  examId: string;
  studentId: string;
  facultyId?: string;
  status: "pending_evaluation" | "evaluated";
  total_score?: number;
  max_score?: number;
  answers: Answer[];
  evaluation_report?: {
    evaluation_details?: EvaluationDetail[];
    feedback?: string;
    strengths?: string[];
    weaknesses?: string[];
  };
  createdAt: string;
};

type ExamResultDoc = {
  _id: string;
  examId: string;
  studentId: string;
  facultyId?: string;
  totalMarksObtained?: number;
  totalMaxMarks?: number;
  percentage?: number;
  feedback?: string;
  strengths?: string[];
  weaknesses?: string[];
  evaluationDetails?: EvaluationDetail[];
  createdAt?: string;
  updatedAt?: string;
};

export default function ExamResultsPage() {
  const params = useParams();
  const examId = (params as any).examId as string;
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [editingReport, setEditingReport] = useState<EvaluationDetail[]>([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const toArray = <T,>(data: unknown, key?: string): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (key && data && typeof data === "object") {
      const maybe = (data as Record<string, unknown>)[key];
      if (Array.isArray(maybe)) return maybe as T[];
    }
    return [];
  };

  useEffect(() => {
    if (examId) fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/submissions?examId=${examId}`);
      setSubmissions(toArray<Submission>(res.data, "submissions"));
      setSelectedSubmissions([]);
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
      toast.error("Failed to load submissions.");
      setSubmissions([]);
      setSelectedSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubmissionSelection = (studentId: string) => {
    setSelectedSubmissions((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleSelectAll = () => {
    const pendingIds = submissions
      .filter((sub) => sub.status === "pending_evaluation")
      .map((sub) => sub.studentId);

    setSelectedSubmissions((prev) =>
      prev.length === pendingIds.length ? [] : pendingIds
    );
  };

  // Build payload expected by backend/python
  const buildPayload = (students: string[]) => {
    return submissions
      .filter((s) => students.includes(s.studentId))
      .map((s) => ({
        examId: s.examId,
        studentId: s.studentId,
        answers: s.answers.map((a) => ({
          questionId: a.questionId,
          questionText: a.questionText,
          studentAnswer: a.studentAnswer,
          maximumScore: a.marks || 10,
          questionType: a.questionType,
          correctAnswer: a.correctAnswer,
        })),
      }));
  };

  // Evaluate single student (no modal auto-open)
  const evaluateSingleSubmission = async (studentId: string) => {
    setEvaluatingId(studentId);
    try {
      const payload = buildPayload([studentId]);
      console.log("📤 Sending single evaluation payload:", payload);

      const res = await axios.post(`/api/submissions/evaluate/student`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data?.success) {
        toast.success(`Evaluation complete: ${studentId} — ${res.data.results?.[0]?.percentage ?? ""}%`);
      } else {
        toast.error(res.data?.error || "Evaluation failed.");
      }
      await fetchSubmissions();
    } catch (err: any) {
      console.error("Evaluation error:", err);
      toast.error(err?.response?.data?.error || "Evaluation failed.");
    } finally {
      setEvaluatingId(null);
    }
  };

  // Bulk evaluate selected students (no modal auto-open)
  const handleBundleEvaluate = async () => {
    if (selectedSubmissions.length === 0) {
      toast.error("Select at least one student.");
      return;
    }

    if (!confirm(`Evaluate ${selectedSubmissions.length} submissions using AI?`)) return;

    setLoading(true);
    try {
      const payload = buildPayload(selectedSubmissions);
      console.log("📤 Sending batch evaluation payload:", payload);

      const res = await axios.post(`/api/submissions/evaluate/student`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data?.success) {
        toast.success(`Evaluated ${res.data.totalEvaluated || selectedSubmissions.length} students.`);
      } else {
        toast.error(res.data?.error || "Batch evaluation failed.");
      }

      await fetchSubmissions();
    } catch (err: any) {
      console.error("Batch evaluation error:", err);
      toast.error(err?.response?.data?.error || "Batch evaluation failed.");
    } finally {
      setLoading(false);
      setSelectedSubmissions([]);
    }
  };

  /**
   * VIEW RESULT (opens modal)
   * We fetch GET /api/exam-results/{submissionId} -> { submission, examResult }
   */
  const handleViewResult = async (submission: Submission) => {
    setSelectedSubmission(null); // ensure modal closed while loading
    setEditingReport([]);
    setModalLoading(true);
    try {
      const res = await axios.get(`/api/exam-results/${submission._id}`);
      const payload = (res.data && typeof res.data === "object")
        ? (res.data as { submission?: Submission; examResult?: ExamResultDoc })
        : {};
      const submissionData = payload.submission;
      const examResult = payload.examResult;

      // build editingReport from examResult.evaluationDetails (if available)
      const evalDetails: EvaluationDetail[] = toArray<any>(examResult?.evaluationDetails).map((q: any) => ({
        questionText: q.questionText,
        scoreObtained: Number(q.scoreObtained || 0),
        maximumScore: Number(q.maximumScore || q.maximumScore || 10),
        studentAnswer: "", // will patch in from submission answers below
        feedback: q.feedback || "",
      }));

      // map student answers from submissionData
      const answersMap: Record<string, string> = {};
      toArray<any>(submissionData?.answers).forEach((a: any) => {
        answersMap[a.questionText] = a.studentAnswer;
      });

      const merged = evalDetails.map((q) => ({
        ...q,
        studentAnswer: answersMap[q.questionText] || "",
      }));

      setEditingReport(merged);

      // Put the examResult summary back into selectedSubmission so modal can show totals/feedback etc.
      const mergedSubmission: Submission = {
        ...submissionData,
        evaluation_report: {
          evaluation_details: merged,
          feedback: examResult?.feedback || "",
          strengths: examResult?.strengths || [],
          weaknesses: examResult?.weaknesses || [],
        },
      };

      setSelectedSubmission(mergedSubmission);
    } catch (err: any) {
      console.error("Failed to fetch exam result:", err);
      toast.error(err?.response?.data?.error || "Failed to load detailed report.");
    } finally {
      setModalLoading(false);
    }
  };

  // Save updates: faculty can update any part. We send { submissionId, updates }
  const saveUpdatedReport = async () => {
    if (!selectedSubmission) return;
    setSaving(true);
    try {
      // Prepare updates object
      const updates: any = {};

      // include evaluationDetails if editingReport exists
      if (Array.isArray(editingReport)) {
        updates.evaluationDetails = editingReport.map((q) => ({
          questionText: q.questionText,
          scoreObtained: Number(q.scoreObtained || 0),
          maximumScore: Number(q.maximumScore || 0),
          feedback: q.feedback || "",
        }));
      }

      // include feedback / strengths / weaknesses if present in selectedSubmission
      if (selectedSubmission.evaluation_report?.feedback !== undefined) {
        updates.feedback = selectedSubmission.evaluation_report.feedback;
      }
      if (selectedSubmission.evaluation_report?.strengths !== undefined) {
        updates.strengths = selectedSubmission.evaluation_report.strengths;
      }
      if (selectedSubmission.evaluation_report?.weaknesses !== undefined) {
        updates.weaknesses = selectedSubmission.evaluation_report.weaknesses;
      }

      // call the PUT endpoint
      const res = await axios.put(`/api/exam-results/${selectedSubmission._id}`, {
        submissionId: selectedSubmission._id,
        updates,
      });

      if (res.data?.success) {
        toast.success("Saved updates successfully.");
        // refresh submissions to reflect updated totals
        await fetchSubmissions();
        // re-fetch and refresh modal content
        await handleViewResult(selectedSubmission);
      } else {
        toast.error(res.data?.error || "Failed to save updates.");
      }
    } catch (err: any) {
      console.error("Save updates error:", err);
      toast.error(err?.response?.data?.error || "Failed to save updates.");
    } finally {
      setSaving(false);
    }
  };

  const safeSubmissions = Array.isArray(submissions) ? submissions : [];
  const pendingSubmissionsCount = safeSubmissions.filter((s) => s.status === "pending_evaluation").length;
  const allPendingSelected = pendingSubmissionsCount > 0 && selectedSubmissions.length === pendingSubmissionsCount;

  // ✅ 1️⃣ Show loading spinner while API is fetching
  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen text-foreground">
        <GlobalLoader/>
      </div>
    );
  }

  return (
    <div className="min-h-screen aurora-page text-foreground p-4 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Link href="/faculty">
              <Button variant="ghost" className="bg-transparent border border-border">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold">Exam Submissions ({examId})</h1>
        </div>
        <div className="flex items-center gap-3">
          {selectedSubmissions.length > 0 && (
            <Button
              onClick={handleBundleEvaluate}
              disabled={loading}
              className="bg-primary hover:bg-primary/85 text-primary-foreground flex items-center gap-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
              Bundle Evaluate ({selectedSubmissions.length})
            </Button>
          )}
          <Button onClick={fetchSubmissions} variant="outline" className="border border-border bg-card hover:bg-accent/20">
            Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="panel rounded-xl overflow-hidden shadow-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-card hover:bg-accent/20">
              <TableHead className="w-[50px] text-foreground">
                <Checkbox checked={allPendingSelected} onCheckedChange={toggleSelectAll} />
              </TableHead>
              <TableHead className="text-foreground">Student ID</TableHead>
              <TableHead className="text-foreground">Date</TableHead>
              <TableHead className="text-foreground">Status</TableHead>
              <TableHead className="text-foreground">Score</TableHead>
              <TableHead className="text-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeSubmissions.map((s) => (
              <TableRow key={s._id} className="hover:bg-accent/10">
                <TableCell>
                  <Checkbox
                    checked={selectedSubmissions.includes(s.studentId)}
                    onCheckedChange={() => toggleSubmissionSelection(s.studentId)}
                    disabled={s.status === "evaluated"}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">{s.studentId}</TableCell>
                <TableCell>{new Date(s.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <span
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${
                      s.status === "evaluated"
                        ? "bg-chart-2/20 text-chart-2"
                        : "bg-accent/20 text-foreground"
                    }`}
                  >
                    {s.status.toUpperCase().replace("_", " ")}
                  </span>
                </TableCell>
                <TableCell>
                  {s.status === "evaluated" ? (
                    <span className="font-bold text-chart-2">
                      {s.total_score} / {s.max_score}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {s.status === "evaluated" ? (
                    <Button onClick={() => handleViewResult(s)} variant="outline" className="border-border bg-card hover:bg-accent/20 w-full">
                      <Eye className="w-4 h-4" /> View Result
                    </Button>
                  ) : (
                    <Button
                      onClick={() => evaluateSingleSubmission(s.studentId)}
                      disabled={evaluatingId === s.studentId}
                      className="bg-primary hover:bg-primary/85 text-primary-foreground w-full"
                    >
                      {evaluatingId === s.studentId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <BarChart2 className="w-4 h-4" />
                      )}
                      Evaluate
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Result Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[60vw] max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-xl">
          <DialogHeader className="sticky top-0 z-10 border-b border-border bg-popover p-4">
            <DialogTitle className="text-lg sm:text-xl font-semibold">
              Evaluation Report — Student: <span className="font-mono text-primary">{selectedSubmission?.studentId}</span>
            </DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">Exam: <span className="text-foreground">{selectedSubmission?.examId}</span></p>
          </DialogHeader>

          <div className="p-4 space-y-5">
            {/* TOP SUMMARY — editable totals & feedback */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="rounded-lg border border-border bg-card p-3">
                <label className="text-xs text-muted-foreground">Total Marks Obtained</label>
                <Input
                  type="number"
                  value={selectedSubmission?.total_score ?? (selectedSubmission?.evaluation_report ? undefined : "")}
                  onChange={(e) => {
                    const val = Number(e.target.value || 0);
                    setSelectedSubmission((prev) => prev ? { ...prev, total_score: val } : prev);
                  }}
                  className="mt-2 border-input bg-background/70"
                />
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <label className="text-xs text-muted-foreground">Total Max Marks</label>
                <Input
                  type="number"
                  value={selectedSubmission?.max_score ?? (selectedSubmission?.evaluation_report ? undefined : "")}
                  onChange={(e) => {
                    const val = Number(e.target.value || 0);
                    setSelectedSubmission((prev) => prev ? { ...prev, max_score: val } : prev);
                  }}
                  className="mt-2 border-input bg-background/70"
                />
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <label className="text-xs text-muted-foreground">Overall Feedback</label>
                <Textarea
                  value={selectedSubmission?.evaluation_report?.feedback ?? ""}
                  onChange={(e) =>
                    setSelectedSubmission((prev) =>
                      prev ? { ...prev, evaluation_report: { ...(prev.evaluation_report || {}), feedback: e.target.value } } : prev
                    )
                  }
                  className="mt-2 min-h-[56px] border-input bg-background/70"
                />
              </div>
            </div>

            {/* QUESTION-BY-QUESTION editable */}
            <div>
              <h4 className="text-md mb-3 font-semibold text-primary">Question-level Evaluation</h4>
              <div className="space-y-3">
                {editingReport.length > 0 ? (
                  editingReport.map((q, i) => (
                    <div key={i} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-primary">{i + 1}. {q.questionText}</p>
                          <p className="mt-1 text-sm text-muted-foreground"><strong>Answer:</strong> {q.studentAnswer}</p>
                        </div>
                        <div className="w-full sm:w-40 flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground">Score</label>
                            <Input
                              type="number"
                              value={q.scoreObtained}
                              onChange={(e) => {
                                const val = Number(e.target.value || 0);
                                setEditingReport((prev) => prev.map((item, idx) => idx === i ? { ...item, scoreObtained: val } : item));
                              }}
                              className="mt-2 border-input bg-background/70"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground">Max</label>
                            <Input value={q.maximumScore} disabled className="mt-2 border-input bg-background/70" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="text-xs text-muted-foreground">Feedback (optional)</label>
                        <Textarea
                          value={q.feedback || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingReport((prev) => prev.map((item, idx) => idx === i ? { ...item, feedback: val } : item));
                          }}
                          className="mt-2 border-input bg-background/70"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No question-level details available.</p>
                )}
              </div>
            </div>

            {/* Strengths & Weaknesses (limit to 5 each) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-md font-semibold text-green-400">Strengths (top 5)</h4>
                </div>
                <div className="space-y-2">
                  {((selectedSubmission?.evaluation_report?.strengths) || []).slice(0, 5).map((s, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="text-sm text-muted-foreground flex-1">{s}</span>
                      <Button
                        onClick={() => {
                          setSelectedSubmission((prev) => {
                            if (!prev) return prev;
                            const cur = [...(prev.evaluation_report?.strengths || [])];
                            cur.splice(idx, 1);
                            return { ...prev, evaluation_report: { ...(prev.evaluation_report || {}), strengths: cur } };
                          });
                        }}
                        variant="ghost"
                        className="text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}

                  {/* add new strength */}
                  <AddEditableList
                    placeholder="Add strength..."
                    onAdd={(text) => {
                      setSelectedSubmission((prev) => {
                        if (!prev) return prev;
                        const cur = [...(prev.evaluation_report?.strengths || [])];
                        cur.unshift(text);
                        return { ...prev, evaluation_report: { ...(prev.evaluation_report || {}), strengths: cur } };
                      });
                    }}
                    disabled={(selectedSubmission?.evaluation_report?.strengths || []).length >= 5}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-md font-semibold text-red-400">Weaknesses (top 5)</h4>
                </div>
                <div className="space-y-2">
                  {((selectedSubmission?.evaluation_report?.weaknesses) || []).slice(0, 5).map((w, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="text-sm text-muted-foreground flex-1">{w}</span>
                      <Button
                        onClick={() => {
                          setSelectedSubmission((prev) => {
                            if (!prev) return prev;
                            const cur = [...(prev.evaluation_report?.weaknesses || [])];
                            cur.splice(idx, 1);
                            return { ...prev, evaluation_report: { ...(prev.evaluation_report || {}), weaknesses: cur } };
                          });
                        }}
                        variant="ghost"
                        className="text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}

                  {/* add new weakness */}
                  <AddEditableList
                    placeholder="Add weakness..."
                    onAdd={(text) => {
                      setSelectedSubmission((prev) => {
                        if (!prev) return prev;
                        const cur = [...(prev.evaluation_report?.weaknesses || [])];
                        cur.unshift(text);
                        return { ...prev, evaluation_report: { ...(prev.evaluation_report || {}), weaknesses: cur } };
                      });
                    }}
                    disabled={(selectedSubmission?.evaluation_report?.weaknesses || []).length >= 5}
                  />
                </div>
              </div>
            </div>

            {/* timestamps and meta */}
            <div className="text-sm text-muted-foreground">
              <div>Generated: {selectedSubmission ? new Date(selectedSubmission.createdAt).toLocaleString() : "-"}</div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row">
            <div className="flex-1">
              <Button
                onClick={async () => {
                  setSelectedSubmission(null);
                  setEditingReport([]);
                }}
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 sm:w-auto"
              >
                Close
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={saveUpdatedReport}
                disabled={saving}
                className="bg-primary text-primary-foreground hover:bg-primary/85"
              >
                {saving ? "Saving..." : "Save Updates"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Small helper component: input with Add button for strengths/weaknesses.
 * Keeps the parent file tidy.
 */
function AddEditableList({ placeholder, onAdd, disabled }: { placeholder?: string; onAdd: (s: string) => void; disabled?: boolean }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex gap-2 items-center mt-2">
      <Input
        placeholder={placeholder || "Add item..."}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="border-input bg-background/70"
        disabled={!!disabled}
      />
      <Button
        onClick={() => {
          if (!val.trim()) return;
          onAdd(val.trim());
          setVal("");
        }}
        disabled={!!disabled || !val.trim()}
        className="bg-primary text-primary-foreground hover:bg-primary/85"
      >
        Add
      </Button>
    </div>
  );
}