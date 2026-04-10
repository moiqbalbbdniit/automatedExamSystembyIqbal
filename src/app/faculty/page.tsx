"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, BookOpen, Play, Eye, Edit3, CheckCircle2, Clock3, Layers3, BarChart3, Upload, UserPlus, Trash2, Square, User, Search } from "lucide-react";
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
type Section = { _id: string; name: string; code: string };
type FacultyAssignment = { _id: string; course?: Course; section?: Section };
type FacultySubjectAssignment = { _id: string; subject?: Subject };

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
  targetSections?: Array<Section | string>;
  subject: Subject;
  duration: number;
  status: string;
  isPublished?: boolean;
  expiresAt?: string;
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
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);
  const [loadingAssignedSections, setLoadingAssignedSections] = useState(false);
  const [assignedSubjects, setAssignedSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [pendingCounts, setPendingCounts] = useState<PendingCountByExam[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [form, setForm] = useState({
    title: "",
    course: "",
    targetSections: [] as string[],
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
    expiryPreset: "none" as "none" | "5h" | "1d" | "custom",
    customExpiryAt: "",
  });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [examSearch, setExamSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "stopped" | "expired">("all");

  const normalizeSectionId = (section: Section | string): string => {
    if (!section) return "";
    return typeof section === "string" ? section : section._id;
  };

  const toArray = <T,>(data: unknown, key?: string): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (key && data && typeof data === "object") {
      const maybe = (data as Record<string, unknown>)[key];
      if (Array.isArray(maybe)) return maybe as T[];
    }
    return [];
  };

  const toDatetimeLocal = (date: Date): string => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  const getExpiryDateFromForm = (): Date | null => {
    if (form.expiryPreset === "5h") {
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 5);
      return expiry;
    }

    if (form.expiryPreset === "1d") {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 1);
      return expiry;
    }

    if (form.expiryPreset === "custom" && form.customExpiryAt) {
      const parsed = new Date(form.customExpiryAt);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  };

  //fetch pending submissions 
  async function fetchPendingCounts(id: string) {
    try {
      const res = await fetch(`/api/submissions/pending-count?facultyId=${id}`);
      if (!res.ok) throw new Error(`Pending count API failed: ${res.status}`);
      const data = await res.json();
      setPendingCounts(toArray<PendingCountByExam>(data, "pendingByExam"));
    } catch (err) {
      console.error("Pending counts fetch error", err);
      setPendingCounts([]);
    }
  }


   async function loadExams(id: string) {
    setLoadingExams(true);
    try {
      const res = await fetch(`/api/exams?facultyId=${id}`);
      if (!res.ok) {
        const errorPayload = await res.json().catch(() => ({}));
        throw new Error(
          (errorPayload as { error?: string })?.error || `Exams API failed: ${res.status}`
        );
      }
      const data = await res.json();
      setExams(toArray<Exam>(data, "exams"));
      await fetchPendingCounts(id);
    } catch (err) {
      console.error("Failed loading exams", err);
      setExams([]);
      setPendingCounts([]);
      toast.error("Unable to load faculty exams right now.");
    } finally {
      setLoadingExams(false);
    }
  }

 useEffect(() => {
    async function loadInitialData() {
      if (facultyId) {
        await Promise.all([
          loadExams(facultyId),
          fetchFacultyAssignments(facultyId),
          fetchFacultySubjectAssignments(facultyId),
        ]);
      }
    }
    loadInitialData();
  }, [facultyId]);


useEffect(() => {
    
    if (!facultyId) return;  
    fetchPendingCounts(facultyId); 
}, [facultyId]);

  async function fetchFacultySubjectAssignments(id: string) {
    try {
      const [subjectRes, assignmentRes] = await Promise.all([
        fetch("/api/subject"),
        fetch(`/api/admin/faculty-subject-assignments?facultyUserId=${id}`),
      ]);

      if (!subjectRes.ok || !assignmentRes.ok) {
        throw new Error("Unable to load assigned subjects");
      }

      const subjectData = await subjectRes.json();
      const assignmentData = await assignmentRes.json();

      const allSubjects = toArray<Subject>(subjectData, "subjects");
      const mappedAssignments = toArray<FacultySubjectAssignment>(assignmentData, "assignments");
      const assignedIds = new Set(
        mappedAssignments
          .map((item) => item.subject?._id)
          .filter((value): value is string => Boolean(value))
      );

      const filtered = allSubjects.filter((s) => assignedIds.has(s._id));
      setAssignedSubjects(filtered);
    } catch (err) {
      console.error("Faculty subject assignments fetch error", err);
      setAssignedSubjects([]);
      toast.error("Unable to load assigned subjects.");
    }
  }

  async function fetchFacultyAssignments(id: string) {
    setLoadingAssignments(true);
    try {
      const res = await fetch(`/api/admin/faculty-assignments?facultyUserId=${id}`);
      if (!res.ok) throw new Error(`Assignments API failed: ${res.status}`);
      const data = await res.json();
      setAssignments(toArray<FacultyAssignment>(data, "assignments"));
    } catch (err) {
      console.error("Faculty assignments fetch error", err);
      setAssignments([]);
      toast.error("Unable to load your class-section assignments.");
    } finally {
      setLoadingAssignments(false);
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
      course: "",
      targetSections: [],
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
      expiryPreset: "none",
      customExpiryAt: "",
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
      targetSections: Array.isArray(exam.targetSections)
        ? exam.targetSections.map((section) => normalizeSectionId(section)).filter(Boolean)
        : [],
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
      expiryPreset: exam.expiresAt ? "custom" : "none",
      customExpiryAt: exam.expiresAt ? toDatetimeLocal(new Date(exam.expiresAt)) : "",
    });
    setOpenModal(true);
  }

  useEffect(() => {
    const loadAssignedSections = async () => {
      if (!openModal || !facultyId || !form.course) {
        setAssignedSections([]);
        return;
      }

      setLoadingAssignedSections(true);
      try {
        const res = await fetch(
          `/api/admin/faculty-assignments?facultyUserId=${facultyId}&courseId=${form.course}`
        );
        if (!res.ok) throw new Error("Failed to load assigned sections");

        const data = await res.json();
        const sections = toArray<{ section?: Section }>(data, "assignments")
          .map((item) => item.section)
          .filter((item): item is Section => Boolean(item?._id));

        const unique = Array.from(new Map(sections.map((s) => [s._id, s])).values());
        setAssignedSections(unique);
      } catch (err) {
        console.error("Assigned section fetch error", err);
        setAssignedSections([]);
      } finally {
        setLoadingAssignedSections(false);
      }
    };

    loadAssignedSections();
  }, [openModal, facultyId, form.course]);

  const handleSaveExam = async () => {
  if (!form.title || !form.subjectId || !form.course || form.targetSections.length === 0) {
    toast.error("Please provide exam title, subject, class, and at least one section.");
    return;
  }

  setSaving(true);
  try {
    const expiresAt = getExpiryDateFromForm();
    if (form.expiryPreset === "custom" && !expiresAt) {
      toast.error("Please choose a valid custom expiry date and time.");
      return;
    }

    const payload = {
      title: form.title,
      course: form.course,
      targetSections: form.targetSections,
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
      facultyUserId: facultyId,
      proctoringEnabled: form.proctoringEnabled,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
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
    setExams((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return editingExam
        ? safePrev.map((e) => (e._id === saved._id ? saved : e))
        : [saved, ...safePrev];
    });

    toast.success("Exam saved successfully!");
    setOpenModal(false);
    if (facultyId) await loadExams(facultyId);
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

      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error("Failed to generate paper.");
        throw new Error(
          (responseData as { error?: string }).error || "Generation failed with an unknown error"
        );
      }

      toast.success("Paper generated successfully!");
      const updated = responseData as Exam;
      setExams((prev) =>
        (Array.isArray(prev) ? prev : []).map((e) => (e._id === updated._id ? updated : e))
      );
    } catch (err: any) {
      console.error("Generation Error:", err);
      toast.error(`Failed to generate paper: ${err.message}`);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Publish failed");
      }
      const updated = await res.json();
      setExams((prev) =>
        (Array.isArray(prev) ? prev : []).map((e) => (e._id === updated._id ? updated : e))
      );
      toast.success("Exam published successfully.");
    } catch (err: any) {
      console.error("Publish Error:", err);
      toast.error(`Publish failed: ${err.message}`);
    }
  };

  const handleStopExam = async (examId: string) => {
    if (!confirm("Stop this exam now? Students will no longer be able to submit.")) return;
    try {
      const res = await fetch(`/api/exams/${examId}/publish`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Stop failed");
      }
      const updated = await res.json();
      setExams((prev) =>
        (Array.isArray(prev) ? prev : []).map((e) => (e._id === updated._id ? updated : e))
      );
      toast.success("Exam has been stopped.");
    } catch (err: any) {
      console.error("Stop Error:", err);
      toast.error(`Unable to stop exam: ${err.message}`);
    }
  };

  const handleQuickExpiry = async (examId: string, hours: 5 | 24) => {
    try {
      const res = await fetch(`/api/exams/${examId}/publish`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", expiryHours: hours }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Expiry update failed");
      }
      const updated = await res.json();
      setExams((prev) =>
        (Array.isArray(prev) ? prev : []).map((e) => (e._id === updated._id ? updated : e))
      );
      toast.success(hours === 5 ? "Expiry set to 5 hours." : "Expiry set to 1 day.");
    } catch (err: any) {
      console.error("Quick expiry error:", err);
      toast.error(`Unable to update expiry: ${err.message}`);
    }
  };

  const handleDelete = async (examId: string) => {
    if (!confirm("Delete this exam?")) return;
    try {
      const res = await fetch(`/api/exams/${examId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setExams((prev) => (Array.isArray(prev) ? prev : []).filter((e) => e._id !== examId));
      toast.success("Exam deleted.");
    } catch (err: any) {
      console.error("Delete Error:", err);
      toast.error(`Delete failed: ${err.message}`);
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
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-lg bg-background/70 text-foreground">
        {/* Animated laptop with glowing data lines */}
        <div className="relative flex flex-col items-center">
          {/* Outer pulse ring */}
          <div className="absolute h-40 w-40 rounded-full bg-primary/20 animate-ping"></div>

          {/* Laptop icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-24 w-24 text-primary animate-bounce-slow"
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
            <div className="h-2 w-2 bg-primary rounded-full"></div>
            <div className="h-2 w-2 bg-accent rounded-full delay-150"></div>
            <div className="h-2 w-2 bg-chart-2 rounded-full delay-300"></div>
          </div>
        </div>

        {/* Loader Text */}
        <h2 className="text-2xl mt-8 font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-pulse">
          Generating Question Paper...
        </h2>
        <p className="text-muted-foreground mt-2 animate-fadeIn">
          Please wait while we fetch data from the AI server.
        </p>
      </div>
    );
  }

  const safeExams = Array.isArray(exams) ? exams : [];
  const totalExams = safeExams.length;
  const publishedExams = safeExams.filter((exam) => exam.status === "published").length;
  const draftExams = totalExams - publishedExams;
  const stoppedExams = safeExams.filter((exam) => exam.status === "stopped").length;
  const totalPending = (Array.isArray(pendingCounts) ? pendingCounts : []).reduce((acc, item) => acc + item.count, 0);

  const uniqueClassMap = new Map<string, string>();
  const uniqueSectionMap = new Map<string, string>();
  const classWiseSectionMap = new Map<string, Set<string>>();
  const assignedCourseOptions: Course[] = [];

  for (const assignment of assignments) {
    const courseId = assignment.course?._id;
    const courseName = assignment.course?.name;
    const sectionId = assignment.section?._id;
    const sectionLabel = assignment.section
      ? `${assignment.section.name} (${assignment.section.code})`
      : "";

    if (courseId && courseName) uniqueClassMap.set(courseId, courseName);
    if (sectionId && sectionLabel) uniqueSectionMap.set(sectionId, sectionLabel);

    if (courseName && sectionLabel) {
      if (!classWiseSectionMap.has(courseName)) {
        classWiseSectionMap.set(courseName, new Set());
      }
      classWiseSectionMap.get(courseName)?.add(sectionLabel);
    }
  }

  for (const [courseId, courseName] of uniqueClassMap.entries()) {
    assignedCourseOptions.push({ _id: courseId, name: courseName });
  }

  const getDisplayStatus = (exam: Exam): "draft" | "published" | "stopped" | "expired" => {
    const expiresAtTime = exam.expiresAt ? new Date(exam.expiresAt).getTime() : null;
    const isExpired = exam.status !== "stopped" && Boolean(expiresAtTime && expiresAtTime <= Date.now());
    if (isExpired) return "expired";
    if (exam.status === "published") return "published";
    if (exam.status === "stopped") return "stopped";
    return "draft";
  };

  const normalizedSearch = examSearch.trim().toLowerCase();
  const filteredExams = safeExams.filter((exam) => {
    const examCourseName = typeof exam.course === "object" ? exam.course?.name : exam.course;
    const title = String(exam.title || "").toLowerCase();
    const subject = String(exam.subject?.name || "").toLowerCase();
    const course = String(examCourseName || "").toLowerCase();
    const status = getDisplayStatus(exam);

    const matchesSearch =
      normalizedSearch.length === 0 ||
      title.includes(normalizedSearch) ||
      subject.includes(normalizedSearch) ||
      course.includes(normalizedSearch);

    const matchesStatus = statusFilter === "all" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen aurora-page text-foreground p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="panel h-fit rounded-2xl p-5 shadow-xl lg:sticky lg:top-6">
          <div className="mb-6 border-b border-border/70 pb-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Faculty Console</p>
            <h1 className="mt-2 text-2xl font-bold">{facultyName || "Faculty"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage exams, sections, results, and student workflows.</p>
          </div>

          <nav className="space-y-2">
            <Button onClick={openCreateModal} className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/85">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Exam
            </Button>
            <Link href="/faculty/analytics" className="block">
              <Button variant="outline" className="w-full justify-start border-border bg-card hover:bg-accent/20">
                <BarChart3 className="mr-2 h-4 w-4" /> Analytics
              </Button>
            </Link>
            <Link href="/faculty/bulk/manage" className="block">
              <Button variant="outline" className="w-full justify-start border-border bg-card hover:bg-accent/20">
                <UserPlus className="mr-2 h-4 w-4" /> User Creation
              </Button>
            </Link>
            <Link href="/profile" className="block">
              <Button variant="outline" className="w-full justify-start border-border bg-card hover:bg-accent/20">
                <User className="mr-2 h-4 w-4" /> Profile
              </Button>
            </Link>
          </nav>

          <div className="mt-6 rounded-xl border border-border/70 bg-card/70 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Assignment Snapshot</p>
            {loadingAssignments ? (
              <p className="mt-2 text-sm text-muted-foreground">Loading assignments...</p>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                  <p className="text-muted-foreground">Classes</p>
                  <p className="text-xl font-bold">{uniqueClassMap.size}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                  <p className="text-muted-foreground">Sections</p>
                  <p className="text-xl font-bold">{uniqueSectionMap.size}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                  <p className="text-muted-foreground">Subjects</p>
                  <p className="text-xl font-bold">{assignedSubjects.length}</p>
                </div>
              </div>
            )}
          </div>
        </aside>

        <main>
      <div className="panel rounded-2xl p-6 shadow-xl mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Faculty Dashboard</h2>
            <p className="mt-1 text-muted-foreground">Create, publish, stop, and evaluate exams across assigned class-sections.</p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Link href="/faculty/analytics" className="w-full sm:w-auto">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/85 sm:w-auto">
                <BarChart3 className="mr-2 h-4 w-4" /> View Analytics
              </Button>
            </Link>
            <Link href="/faculty/bulk/manage" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full border-border bg-card hover:bg-accent/20 sm:w-auto">
                <Upload className="mr-2 h-4 w-4" /> Manage Users
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="panel p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Exams</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-3xl font-black text-foreground">{totalExams}</p>
            <Layers3 className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="panel p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Published</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-3xl font-black text-chart-2">{publishedExams}</p>
            <CheckCircle2 className="h-5 w-5 text-chart-2" />
          </div>
        </div>
        <div className="panel p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Drafts</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-3xl font-black text-accent">{draftExams}</p>
            <Clock3 className="h-5 w-5 text-accent" />
          </div>
        </div>
        <div className="panel p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending Evaluations</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-3xl font-black text-primary">{totalPending}</p>
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="panel p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Stopped</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-3xl font-black text-destructive">{stoppedExams}</p>
            <Square className="h-5 w-5 text-destructive" />
          </div>
        </div>
      </div>

      <div className="panel rounded-xl p-5 shadow-md mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Assigned Classes and Sections</h3>
          <span className="text-sm text-muted-foreground">{assignments.length} assignments</span>
        </div>
        {loadingAssignments ? (
          <p className="text-sm text-muted-foreground">Loading assignment details...</p>
        ) : classWiseSectionMap.size === 0 ? (
          <p className="text-sm text-muted-foreground">No class-section assignments available yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from(classWiseSectionMap.entries()).map(([courseName, sectionSet]) => (
              <div key={courseName} className="rounded-lg border border-border/60 bg-card/60 p-4">
                <p className="font-semibold text-foreground">{courseName}</p>
                <p className="mt-2 text-sm text-muted-foreground">{Array.from(sectionSet).join(", ")}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel rounded-xl p-6 shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Create New Exam</h2>
          </div>
          <div>
            <Button
              onClick={openCreateModal}
              className="bg-primary hover:bg-primary/85 cursor-pointer text-primary-foreground"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> New Exam
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Quickly create an exam, generate questions automatically, preview,
          edit and publish.
        </p>
      </div>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
  <DialogContent
    className="
      bg-popover text-popover-foreground rounded-2xl
      w-[95vw] max-w-3xl max-h-[90vh]
      overflow-y-auto p-6 sm:p-8
      border border-border shadow-2xl
    "
  >
    <DialogHeader className="border-b border-border pb-4 mb-4">
      <DialogTitle className="text-primary text-2xl font-semibold tracking-wide">
        {editingExam ? "Edit Exam" : "Create New Exam"}
      </DialogTitle>
      <p className="text-muted-foreground text-sm">
        Configure exam details, difficulty levels, and instructions below.
      </p>
    </DialogHeader>

    <div className="space-y-8">
      {/* BASIC DETAILS */}
      <section className="space-y-4">
        <h3 className="border-b border-border pb-1 text-lg font-medium text-primary">
          Basic Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/85">Exam Title : </label>
            <Input
              placeholder="e.g., Mid-Term Exam"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-2 border-input bg-background/70 placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/85">Duration (minutes) : </label>
            <Input
              type="number"
              min={0}
              placeholder="e.g., 90"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              className="mt-2 border-input bg-background/70 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/85">Select Subject : </label>
            <Select
              value={form.subjectId}
              onValueChange={(v) => setForm({ ...form, subjectId: v })}
            >
              <SelectTrigger className="mt-2 border-input bg-background/70 placeholder:text-muted-foreground">
                <SelectValue placeholder="Choose subject" />
              </SelectTrigger>
              <SelectContent className="mt-2 border-border bg-popover text-popover-foreground">
                {assignedSubjects.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name} {s.code && `(${s.code})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assignedSubjects.length === 0 && (
              <p className="text-xs text-destructive">No subject is assigned to your account. Contact admin.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/85">Select Course : </label>
            <Select
              value={form.course}
              onValueChange={(v) => setForm({ ...form, course: v })}
            >
              <SelectTrigger className="mt-2 border-input bg-background/70 placeholder:text-muted-foreground">
                <SelectValue placeholder="Choose course" />
              </SelectTrigger>
              <SelectContent className="mt-2 border-border bg-popover text-popover-foreground">
                {assignedCourseOptions.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assignedCourseOptions.length === 0 && (
              <p className="text-xs text-destructive">No class is assigned to your account. Contact admin.</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/85">Select Section(s) :</label>
          <div className="mt-2 rounded-lg border border-input bg-background/70 p-3">
            {!form.course ? (
              <p className="text-sm text-muted-foreground">Select class first to load assigned sections.</p>
            ) : loadingAssignedSections ? (
              <p className="text-sm text-muted-foreground">Loading assigned sections...</p>
            ) : assignedSections.length === 0 ? (
              <p className="text-sm text-destructive">No sections assigned to you for this class.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {assignedSections.map((section) => {
                  const isChecked = form.targetSections.includes(section._id);
                  return (
                    <label
                      key={section._id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border/70 bg-card/60 px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((prev) => ({
                            ...prev,
                            targetSections: checked
                              ? [...prev.targetSections, section._id]
                              : prev.targetSections.filter((id) => id !== section._id),
                          }));
                        }}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-foreground">
                        {section.name} ({section.code})
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/85">Exam Expiry :</label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              value={form.expiryPreset}
              onValueChange={(v: "none" | "5h" | "1d" | "custom") =>
                setForm((prev) => ({
                  ...prev,
                  expiryPreset: v,
                  customExpiryAt: v === "custom" ? prev.customExpiryAt : "",
                }))
              }
            >
              <SelectTrigger className="mt-2 border-input bg-background/70 placeholder:text-muted-foreground">
                <SelectValue placeholder="Select expiry" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover text-popover-foreground">
                <SelectItem value="none">No auto-expiry</SelectItem>
                <SelectItem value="5h">Expire after 5 hours</SelectItem>
                <SelectItem value="1d">Expire after 1 day</SelectItem>
                <SelectItem value="custom">Custom date and time</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="datetime-local"
              value={form.customExpiryAt}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, customExpiryAt: e.target.value, expiryPreset: "custom" }))
              }
              disabled={form.expiryPreset !== "custom"}
              className="mt-2 border-input bg-background/70 placeholder:text-muted-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Expired or stopped exams are automatically blocked from submission.
          </p>
        </div>
      </section>

      {/* QUESTION COUNTS */}
      <section className="space-y-4">
        <h3 className="border-b border-border pb-1 text-lg font-medium text-primary">
          Question Distribution
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MCQs */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/85">Multiple Choice Questions(MCQs) : </label>
            <div className="flex gap-3 flex-wrap">
              <Input
                type="number"
                min={0}
                className="mt-2 w-28 border-input bg-background/70 text-foreground"
                value={form.veryShortCount}
                onChange={(e) => setForm({ ...form, veryShortCount: Number(e.target.value) })}
              />
              <Select
                value={form.veryShortDifficulty}
                onValueChange={(v) => setForm({ ...form, veryShortDifficulty: v })}
              >
                <SelectTrigger className="mt-2 w-36 border-input bg-background/70">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover text-popover-foreground">
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Short Questions */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/85">Short Questions : </label>
            <div className="flex gap-3 flex-wrap">
              <Input
                type="number"
                min={0}
                className="mt-2 w-28 border-input bg-background/70 text-foreground"
                value={form.shortCount}
                onChange={(e) => setForm({ ...form, shortCount: Number(e.target.value) })}
              />
              <Select
                value={form.shortDifficulty}
                onValueChange={(v) => setForm({ ...form, shortDifficulty: v })}
              >
                <SelectTrigger className="mt-2 w-36 border-input bg-background/70">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover text-popover-foreground">
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Long Questions */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/85">Long Questions : </label>
            <div className="flex gap-3 flex-wrap">
              <Input
                type="number"
                min={0}
                className="w-28 border-input bg-background/70 text-foreground"
                value={form.longCount}
                onChange={(e) => setForm({ ...form, longCount: Number(e.target.value) })}
              />
              <Select
                value={form.longDifficulty}
                onValueChange={(v) => setForm({ ...form, longDifficulty: v })}
              >
                <SelectTrigger className="mt-2 w-36 border-input bg-background/70">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover text-popover-foreground">
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Coding */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/85">Coding Questions : </label>
            <Input
              type="number"
              min={0}
              placeholder="e.g., 2"
              className="ml-2 mt-2 w-28 border-input bg-background/70 text-foreground"
              value={form.codingCount}
              onChange={(e) => setForm({ ...form, codingCount: Number(e.target.value) })}
            />
          </div>
        </div>
      </section>
      <div className="border-t border-border px-2 pb-4 pt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.proctoringEnabled}
                onChange={(e) =>
                  setForm({ ...form, proctoringEnabled: e.target.checked })
                }
                // Tailwind CSS classes for styling a simple checkbox
                className="form-checkbox h-5 w-5 rounded border-input bg-transparent text-primary focus:ring-primary"
              />
              <span className="text-lg font-semibold text-primary">
                🔒 Enable Live Proctoring (Webcam & Security)
              </span>
            </label>
            <p className="ml-8 mt-1 text-sm text-muted-foreground">
              Enabling this requires webcam access and enforces security measures.
            </p>
          </div>

      {/* INSTRUCTIONS */}
      <section className="space-y-3">
        <h3 className="border-b border-border pb-1 text-lg font-medium text-primary">
          Instructions / Notes
        </h3>
        <Textarea
          placeholder="Add any specific instructions for this exam..."
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          className="min-h-[100px] border-input bg-background/70 placeholder:text-muted-foreground"
        />
      </section>
    </div>

    <DialogFooter className="mt-8 flex flex-wrap justify-end gap-3 border-t border-border pt-4">
      <Button
        onClick={() => setOpenModal(false)}
        variant="outline"
        className="border-border bg-card text-foreground hover:bg-accent/20"
      >
        Cancel
      </Button>
      <Button
        onClick={handleSaveExam}
        disabled={saving}
        className="bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/85"
      >
        {saving ? "Saving..." : "Save Exam"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


      <div className="panel mb-4 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px] md:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={examSearch}
              onChange={(e) => setExamSearch(e.target.value)}
              placeholder="Search exams by title, subject, or class"
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v: "all" | "draft" | "published" | "stopped" | "expired") => setStatusFilter(v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="stopped">Stopped</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Showing {filteredExams.length} of {safeExams.length} exams
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {loadingExams ? (
          <div className="col-span-full text-center py-10">
            Loading exams...
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="col-span-full text-center py-10">
            No exams match your current search/filter.
          </div>
        ) : (
          filteredExams.map((exam) =>{
            const pendingCount = getPendingCount(exam._id);
            const displayStatus = getDisplayStatus(exam);
            return(
            <div
              key={exam._id}
              className="rounded-lg border border-border bg-card/80 p-5 shadow-sm transition-colors hover:bg-card"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-2 break-words text-xl font-semibold text-foreground">{exam.title}</h3>
                    <div className="text-sm text-muted-foreground">
                    {exam.subject?.name}{" "}
                    {exam.subject?.code ? `(${exam.subject.code})` : ""}
                  </div>
                  </div>
                  <div
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      displayStatus === "published"
                        ? "border border-chart-2/30 bg-chart-2/15 text-chart-2"
                        : displayStatus === "expired"
                        ? "border border-amber-500/50 bg-amber-500/15 text-amber-600"
                        : displayStatus === "stopped"
                        ? "border border-destructive/40 bg-destructive/10 text-destructive"
                        : "border border-border/70 bg-accent/40 text-muted-foreground"
                    }`}
                  >
                    {displayStatus.toUpperCase()}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => openEditModal(exam)}
                    className="border-border bg-transparent hover:bg-accent/20"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleGeneratePaper(exam._id)}
                    disabled={generating === exam._id}
                    className="border-chart-2/40 bg-chart-2/15 text-chart-2 hover:bg-chart-2/25"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Link href={`/faculty/question-paper/${exam._id}`} passHref>
                    <Button
                      className="border-border bg-transparent hover:bg-accent/20"
                      size="icon"
                      variant="outline"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    onClick={() => handlePublish(exam._id)}
                    className={`border border-primary/35 bg-primary/12 text-primary hover:bg-primary/20 ${
                      displayStatus === "published"
                        ? "cursor-not-allowed opacity-50"
                        : ""
                    }`}
                    disabled={displayStatus === "published"}
                  >
                    Publish
                  </Button>
                  <Button
                    onClick={() => handleQuickExpiry(exam._id, 5)}
                    variant="outline"
                    className="border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
                  >
                    +5h
                  </Button>
                  <Button
                    onClick={() => handleQuickExpiry(exam._id, 24)}
                    variant="outline"
                    className="border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
                  >
                    +1d
                  </Button>
                  <Button
                    onClick={() => handleStopExam(exam._id)}
                    className={`border border-destructive/45 bg-destructive/10 text-destructive hover:bg-destructive/20 ${
                      displayStatus !== "published" ? "cursor-not-allowed opacity-50" : ""
                    }`}
                    disabled={displayStatus !== "published"}
                  >
                    <Square className="mr-1 h-4 w-4" /> Stop
                  </Button>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Course: {typeof exam.course === "object" ? exam.course?.name : exam.course}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Duration: {exam.duration} min
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Expiry: {exam.expiresAt ? new Date(exam.expiresAt).toLocaleString() : "No auto-expiry"}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {/* FIX 3: Use the helper function for an accurate count */}
                Questions: {countQuestions(exam.questions)}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Sections: {Array.isArray(exam.targetSections) && exam.targetSections.length > 0
                  ? exam.targetSections
                      .map((section) => (typeof section === "string" ? section : `${section.name} (${section.code})`))
                      .join(", ")
                  : "All assigned sections"}
              </div>
              <div className="mt-3 flex gap-2">

              <Link href={`/faculty/results/${exam._id}`} passHref>
    <Button
    
      className="relative cursor-pointer border border-primary/40 bg-primary text-primary-foreground hover:bg-primary/85"

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
                  className="cursor-pointer border border-destructive/60 bg-destructive/90 text-destructive-foreground hover:bg-destructive"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          );
})
        )}
      </div>
      </main>
    </div>
    </div>
  );
}