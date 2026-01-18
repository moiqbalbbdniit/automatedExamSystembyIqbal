"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, BookOpen, Play, Eye, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";

// --- DATA TYPES (CORRECTED) ---

type Subject = { _id: string; name: string; code?: string };
type Course = { _id: string; name: string };

// This defines the structure of the generated questions object
type QuestionPaper = {
  MCQs?: { question: string; options?: string[] }[];
  Theory?: { question: string }[];
  Coding?: { question: string }[];
};

// FIX 1: Replaced `any` with a specific and accurate type for Exams
type Exam = {
  _id: string;
  title: string;
   course: Course | string; 
  subject: Subject;
  duration: number;
  status: string;
  questions: QuestionPaper;
  veryShort: { count: number; difficulty: string };
  short: { count: number; difficulty: string };
  long: { count: number; difficulty: string };
  coding: { count: number };
  instructions: string;
  proctoringEnabled?: boolean;
};

type PendingCountByExam = {
  _id: string; // This is the examId
  count: number;
};

export default function FacultyDashboardPage() {
  const { user } = useAuth();
  const facultyId = user?.id;
  const facultyName = user?.firstName;
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [pendingCounts, setPendingCounts] = useState<PendingCountByExam[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [form, setForm] = useState({
    title: "",
    course: "",
    subjectId: "",
    duration: 180,
    veryShortCount: 5,
    veryShortDifficulty: "easy",
    shortCount: 5,
    shortDifficulty: "medium",
    longCount: 2,
    longDifficulty: "hard",
    codingCount: 0,
    instructions: "",
    proctoringEnabled: false,
  });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // fetch courses
  async function fetchCourses() {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      setCourses(data || []);
    } catch (err) {
      console.error("Courses fetch error", err);
    }
  }

  //fetch pending submissions 
  async function fetchPendingCounts(id: string) {
    try {
      const res = await fetch(`/api/submissions/pending-count?facultyId=${id}`);
      const data = await res.json();
    
      setPendingCounts(data.pendingByExam || []); 
    } catch (err) {
      console.error("Pending counts fetch error", err);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      await Promise.all([fetchSubjects(), fetchCourses()]);
      if (facultyId) await loadExams(facultyId);
    }
    loadInitialData();
  }, []);


   async function loadExams(id: string) {
    setLoadingExams(true);
    try {
      const res = await fetch(`/api/exams?facultyId=${id}`);
      const data = await res.json();
      setExams(data || []);
      await fetchPendingCounts(id);
    } catch (err) {
      console.error("Failed loading exams", err);
    } finally {
      setLoadingExams(false);
    }
  }


 useEffect(() => {
    async function loadInitialData() {
      await Promise.all([fetchSubjects(), fetchCourses()]);
      if (facultyId) {
        await loadExams(facultyId); 
      }
    }
    loadInitialData();
  }, [facultyId]);


useEffect(() => {
    
    if (!facultyId) return;  
    fetchPendingCounts(facultyId); 
}, [facultyId]);

  async function fetchSubjects() {
    try {
      const res = await fetch("/api/subject");
      const data = await res.json();
      setSubjects(data || []);
    } catch (err) {
      console.error("Subjects fetch error", err);
    }
  }

 const getPendingCount = (examId: string): number => {
    // Now this comparison works because p._id is a string!
    const item = pendingCounts.find(p => p._id === examId); 
    return item ? item.count : 0;
};
 

  function openCreateModal() {
    setEditingExam(null);
    setForm({
      title: "",
      course: "B.Tech",
      subjectId: "",
      duration: 180,
      veryShortCount: 5,
      veryShortDifficulty: "easy",
      shortCount: 5,
      shortDifficulty: "medium",
      longCount: 2,
      longDifficulty: "hard",
      codingCount: 0,
      instructions: "",
       proctoringEnabled: false,
    });
    setOpenModal(true);
  }

  function openEditModal(exam: Exam) {
    setEditingExam(exam);
    setForm({
      title: exam.title,
      course:
      typeof exam.course === "object"
        ? exam.course?._id
        : exam.course || "",
      subjectId: exam.subject?._id || "",
      duration: exam.duration || 180,
      veryShortCount: exam.veryShort?.count || 0,
      veryShortDifficulty: exam.veryShort?.difficulty || "easy",
      shortCount: exam.short?.count || 0,
      shortDifficulty: exam.short?.difficulty || "medium",
      longCount: exam.long?.count || 0,
      longDifficulty: exam.long?.difficulty || "hard",
      codingCount: exam.coding?.count || 0,
      instructions: exam.instructions || "",
      proctoringEnabled: exam.proctoringEnabled ?? false,
    });
    setOpenModal(true);
  }

  const handleSaveExam = async () => {
  if (!form.title || !form.subjectId) {
    alert("Please provide exam title and select a subject.");
    return;
  }

  setSaving(true);
  try {
    const payload = {
      title: form.title,
      course: form.course,
      subject: form.subjectId,
      duration: Number(form.duration),
      veryShort: {
        count: Math.max(1, Number(form.veryShortCount)),
        difficulty: form.veryShortDifficulty,
      },
      short: {
        count: Math.max(1, Number(form.shortCount)),
        difficulty: form.shortDifficulty,
      },
      long: {
        count: Math.max(1, Number(form.longCount)),
        difficulty: form.longDifficulty,
      },
      coding: { count: Math.max(0, Number(form.codingCount)) },
      instructions: form.instructions,
      facultyId,
      proctoringEnabled: form.proctoringEnabled,
    };

    const url = editingExam ? `/api/exams/${editingExam._id}` : "/api/exams";
    const method = editingExam ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const saved = await res.json();
    if (!res.ok) throw new Error(saved.error || "Failed to save exam");

    // ✅ Update local state immediately with new values
    setExams((prev) =>
      editingExam
        ? prev.map((e) => (e._id === saved._id ? saved : e))
        : [saved, ...prev]
    );

    toast.success("Exam saved successfully!");
    setOpenModal(false);
  } catch (err: any) {
    console.error("Save exam error:", err);
    toast.error(`Failed to save exam: ${err.message}`);
  } finally {
    setSaving(false);
  }
};


  const handleGeneratePaper = async (examId: string) => {
    if (
      !confirm(
        "Generate question paper using AI? This will replace existing questions."
      )
    )
      return;
    setGenerating(examId);

    try {
      setLoading(true);
      const res = await fetch(`/api/exams/${examId}/generate`, {
        method: "POST",
      });

      if (res.status === 200) {
        toast.success("Paper generated successfully!");
      } else {
        const errorData = await res.json();
        toast.error("Failed to generate paper.");
        throw new Error(
          errorData.error || "Generation failed with an unknown error"
        );
      }
      const updated = await res.json();
      setExams((prev) =>
        prev.map((e) => (e._id === updated._id ? updated : e))
      );
    } catch (err: any) {
      console.error("Generation Error:", err);
      alert(`Failed to generate: ${err.message}`);
    } finally {
      setGenerating(null);
      setLoading(false);
    }
  };

  const handlePublish = async (examId: string) => {
    if (!confirm("Publish this exam to students?")) return;
    try {
      const res = await fetch(`/api/exams/${examId}/publish`, {
        method: "PUT",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Publish failed");
      }
      const updated = await res.json();
      setExams((prev) =>
        prev.map((e) => (e._id === updated._id ? updated : e))
      );
      alert("Exam published.");
    } catch (err: any) {
      console.error("Publish Error:", err);
      alert(`Publish done: ${err.message}`);
    }
  };

  const handleDelete = async (examId: string) => {
    if (!confirm("Delete this exam?")) return;
    try {
      const res = await fetch(`/api/exams/${examId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setExams((prev) => prev.filter((e) => e._id !== examId));
      alert("Exam deleted.");
    } catch (err: any) {
      console.error("Delete Error:", err);
      alert(`Delete failed: ${err.message}`);
    }
  };

  const countQuestions = (paper: QuestionPaper | null | undefined): number => {
    if (!paper) return 0;
    return (
      (paper.MCQs?.length || 0) +
      (paper.Theory?.length || 0) +
      (paper.Coding?.length || 0)
    );
  };

  // generatng question paper loader
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-lg bg-black/40 text-white">
        {/* Animated laptop with glowing data lines */}
        <div className="relative flex flex-col items-center">
          {/* Outer pulse ring */}
          <div className="absolute h-40 w-40 rounded-full bg-indigo-500/20 animate-ping"></div>

          {/* Laptop icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-24 w-24 text-indigo-400 animate-bounce-slow"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v12H3V4zM2 18h20a1 1 0 01.894 1.447A2 2 0 0121 20H3a2 2 0 01-1.894-0.553A1 1 0 012 18z"
            />
          </svg>

          {/* Floating data dots */}
          <div className="absolute -top-6 flex space-x-2 animate-bounce">
            <div className="h-2 w-2 bg-indigo-400 rounded-full"></div>
            <div className="h-2 w-2 bg-purple-400 rounded-full delay-150"></div>
            <div className="h-2 w-2 bg-pink-400 rounded-full delay-300"></div>
          </div>
        </div>

        {/* Loader Text */}
        <h2 className="text-2xl mt-8 font-semibold bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent animate-pulse">
          Generating Question Paper...
        </h2>
        <p className="text-gray-300 mt-2 animate-fadeIn">
          Please wait while we fetch data from the AI server.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-black text-gray-100 p-6">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-800 to-indigo-600 p-8 shadow-xl mb-8">
        <h1 className="text-4xl font-bold">Faculty Dashboard</h1>
        <p className="mt-2 text-gray-200">
          Create and manage question papers for your students.
        </p>
        <p className="mt-4 text-lg">
          Faculty Name: <strong className="text-white">{facultyName}</strong>
        </p>
      </div>

      <div className="bg-[#0b1220] border border-indigo-900 rounded-xl p-6 shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-indigo-500" />
            <h2 className="text-2xl font-semibold">Create New Exam</h2>
          </div>
          <div>
            <Button
              onClick={openCreateModal}
              className="bg-indigo-700 hover:bg-indigo-600 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> New Exam
            </Button>
          </div>
        </div>
        <p className="text-gray-300">
          Quickly create an exam, generate questions automatically, preview,
          edit and publish.
        </p>
      </div>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
  <DialogContent
    className="
      bg-[#0b1220] text-gray-100 rounded-2xl
      w-[95vw] max-w-3xl max-h-[90vh]
      overflow-y-auto p-6 sm:p-8
      border border-slate-700 shadow-2xl
    "
  >
    <DialogHeader className="border-b border-slate-700 pb-4 mb-4">
      <DialogTitle className="text-indigo-400 text-2xl font-semibold tracking-wide">
        {editingExam ? "Edit Exam" : "Create New Exam"}
      </DialogTitle>
      <p className="text-gray-400 text-sm">
        Configure exam details, difficulty levels, and instructions below.
      </p>
    </DialogHeader>

    <div className="space-y-8">
      {/* BASIC DETAILS */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-indigo-400 border-b border-slate-700 pb-1">
          Basic Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Exam Title : </label>
            <Input
              placeholder="e.g., Mid-Term Exam"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-slate-900 border-gray-700 placeholder:text-gray-400 focus:ring-indigo-600 mt-2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Duration (minutes) : </label>
            <Input
              type="number"
              min={0}
              placeholder="e.g., 90"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              className="bg-slate-900 border-gray-700 placeholder:text-gray-400 mt-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Select Subject : </label>
            <Select
              value={form.subjectId}
              onValueChange={(v) => setForm({ ...form, subjectId: v })}
            >
              <SelectTrigger className="bg-slate-900 border-gray-700 placeholder:text-gray-400 mt-2">
                <SelectValue placeholder="Choose subject" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 text-white border-gray-700 placeholder:text-gray-400 mt-2">
                {subjects.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name} {s.code && `(${s.code})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Select Course : </label>
            <Select
              value={form.course}
              onValueChange={(v) => setForm({ ...form, course: v })}
            >
              <SelectTrigger className="bg-slate-900 border-gray-700 placeholder:text-gray-400 mt-2">
                <SelectValue placeholder="Choose course" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 text-white border-gray-700 placeholder:text-gray-400 mt-2">
                {courses.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* QUESTION COUNTS */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-indigo-400 border-b border-slate-700 pb-1">
          Question Distribution
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MCQs */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Multiple Choice Questions(MCQs) : </label>
            <div className="flex gap-3 flex-wrap">
              <Input
                type="number"
                min={0}
                className="w-28 bg-slate-900 border-gray-700 text-gray-400 mt-2"
                value={form.veryShortCount}
                onChange={(e) => setForm({ ...form, veryShortCount: Number(e.target.value) })}
              />
              <Select
                value={form.veryShortDifficulty}
                onValueChange={(v) => setForm({ ...form, veryShortDifficulty: v })}
              >
                <SelectTrigger className="bg-slate-900 border-gray-700 w-36 mt-2">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-gray-700">
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Short Questions */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Short Questions : </label>
            <div className="flex gap-3 flex-wrap">
              <Input
                type="number"
                min={0}
                className="w-28 bg-slate-900 border-gray-700 text-gray-400 mt-2"
                value={form.shortCount}
                onChange={(e) => setForm({ ...form, shortCount: Number(e.target.value) })}
              />
              <Select
                value={form.shortDifficulty}
                onValueChange={(v) => setForm({ ...form, shortDifficulty: v })}
              >
                <SelectTrigger className="bg-slate-900 border-gray-700 w-36 mt-2">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-gray-700">
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Long Questions */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Long Questions : </label>
            <div className="flex gap-3 flex-wrap">
              <Input
                type="number"
                min={0}
                className="w-28 bg-slate-900 border-gray-700 text-gray-400"
                value={form.longCount}
                onChange={(e) => setForm({ ...form, longCount: Number(e.target.value) })}
              />
              <Select
                value={form.longDifficulty}
                onValueChange={(v) => setForm({ ...form, longDifficulty: v })}
              >
                <SelectTrigger className="bg-slate-900 border-gray-700 w-36 mt-2">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-gray-700">
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Coding */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Coding Questions : </label>
            <Input
              type="number"
              min={0}
              placeholder="e.g., 2"
              className="w-28 bg-slate-900 border-gray-700 text-gray-400 mt-2 ml-2"
              value={form.codingCount}
              onChange={(e) => setForm({ ...form, codingCount: Number(e.target.value) })}
            />
          </div>
        </div>
      </section>
       <div className="px-2 pb-4 border-t border-gray-700 pt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.proctoringEnabled}
                onChange={(e) =>
                  setForm({ ...form, proctoringEnabled: e.target.checked })
                }
                // Tailwind CSS classes for styling a simple checkbox
                className="form-checkbox h-5 w-5 text-indigo-600 bg-transparent border-gray-700 rounded focus:ring-indigo-500"
              />
              <span className="text-lg font-semibold text-indigo-400">
                🔒 Enable Live Proctoring (Webcam & Security)
              </span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-8">
              Enabling this requires webcam access and enforces security measures.
            </p>
          </div>

      {/* INSTRUCTIONS */}
      <section className="space-y-3">
        <h3 className="text-lg font-medium text-indigo-400 border-b border-slate-700 pb-1">
          Instructions / Notes
        </h3>
        <Textarea
          placeholder="Add any specific instructions for this exam..."
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          className="bg-slate-900 border-gray-700 placeholder:text-gray-500 min-h-[100px]"
        />
      </section>
    </div>

    <DialogFooter className="mt-8 border-t border-slate-700 pt-4 flex flex-wrap justify-end gap-3">
      <Button
        onClick={() => setOpenModal(false)}
        variant="outline"
        className="border-gray-600  bg-gray-800 hover:bg-slate-800"
      >
        Cancel
      </Button>
      <Button
        onClick={handleSaveExam}
        disabled={saving}
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6"
      >
        {saving ? "Saving..." : "Save Exam"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loadingExams ? (
          <div className="col-span-full text-center py-10">
            Loading exams...
          </div>
        ) : exams.length === 0 ? (
          <div className="col-span-full text-center py-10">
            No exams created yet.
          </div>
        ) : (
          exams.map((exam) =>{
            const pendingCount = getPendingCount(exam._id);
            return(
            <div
              key={exam._id}
              className="bg-[#07101a] border border-indigo-900 rounded-lg p-5 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-blue-100 mb-4">{exam.title}</h3>
                  <div className="text-sm text-gray-200 mb-4">
                    {exam.subject?.name}{" "}
                    {exam.subject?.code ? `(${exam.subject.code})` : ""}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Course: {typeof exam.course === "object" ? exam.course?.name : exam.course}

                  </div>
                  <div className="text-sm text-gray-400">
                    Duration: {exam.duration} min
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      exam.status === "published"
                        ? "bg-green-800 text-green-200"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {(exam.status || "draft").toUpperCase()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => openEditModal(exam)}
                      className="bg-transparent border border-gray-700 hover:bg-indigo-800"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleGeneratePaper(exam._id)}
                      disabled={generating === exam._id}
                      className="bg-teal-600 hover:bg-teal-500"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Link href={`/faculty/question-paper/${exam._id}`} passHref>
                      <Button
                        className="bg-transparent border border-gray-700 hover:bg-indigo-800"
                        size="icon"
                        variant="outline"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      onClick={() => handlePublish(exam._id)}
                      className={`bg-indigo-700 hover:bg-indigo-600 ${
                        exam.status === "published"
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={exam.status === "published"}
                    >
                      Publish
                    </Button>{" "}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-300">
                {/* FIX 3: Use the helper function for an accurate count */}
                Questions: {countQuestions(exam.questions)}
              </div>
              <div className="mt-3 flex gap-2">

              <Link href={`/faculty/results/${exam._id}`} passHref>
    <Button
    
      className="relative bg-purple-700 hover:bg-purple-600 text-white border border-purple-600 cursor-pointer"

    >
      Results
   
      {pendingCount > 0 && (
        <span className="absolute top-[-8px] right-[-8px] h-5 min-w-5 bg-red-600 text-white rounded-full text-xs font-bold flex items-center justify-center p-1 leading-none">
          {pendingCount > 99 ? "99+" : pendingCount}
        </span>
      )}
    </Button>
  </Link>
                <Button
                  variant="outline"
                  onClick={() => handleDelete(exam._id)}
                  className="hover:bg-red-600 border border-red-600 text-white bg-red-500 cursor-pointer"
                >
                  Delete
                </Button>
              </div>
            </div>
          );
})
        )}
      </div>
    </div>
  );
}