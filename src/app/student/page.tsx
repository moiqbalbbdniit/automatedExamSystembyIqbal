"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  BookOpen,
  BarChart2,
  Calendar,
  FileText,
  CheckCircle,
  User,
  Settings,
  Bell,
  Sparkles,
  AlertTriangle,
  Timer,
} from "lucide-react";

type Subject = { name?: string; code?: string };
type Section = { _id?: string; name?: string; code?: string };
type Course = { _id?: string; name?: string };
type Exam = {
  _id: string;
  title?: string;
  subject?: Subject | null;
  course?: Course | null;
  targetSections?: Section[];
  duration?: number;
  date?: string;
  questions?: { MCQs?: Array<unknown>; Theory?: Array<unknown>; Coding?: Array<unknown> } | null;
  isPublished?: boolean;
  publishedAt?: string;
  expiresAt?: string;
};

type SubmissionStats = {
  totalSubmissions: number;
  lastExam: { subjectName?: string } | null;
  averageScore: string;
};

type ExamStatusMeta = {
  label: string;
  badgeClass: string;
  cardClass: string;
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const studentId = user?.id ? String(user.id) : "";

  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [submittedExams, setSubmittedExams] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<SubmissionStats>({
    totalSubmissions: 0,
    lastExam: null,
    averageScore: "0",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    const fetchSubmissionStats = async () => {
      try {
        const { data } = await axios.get(`/api/submissions/stats?studentId=${studentId}`);
        setStats({
          totalSubmissions: data?.totalSubmissions ?? 0,
          lastExam: data?.lastExam ?? null,
          averageScore: data?.averageScore ?? "0",
        });
      } catch (err) {
        console.error("Failed to fetch submission stats:", err);
      }
    };

    fetchSubmissionStats();
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;

    const fetchSubmittedExams = async () => {
      try {
        const res = await axios.get(`/api/submit-exam/check?studentId=${studentId}`);
        const submittedIds: Set<string> = new Set(
          (res.data?.submissions || []).map((s: { examId: string }) => String(s.examId))
        );
        setSubmittedExams(submittedIds);
      } catch (err) {
        console.error("Failed to fetch submitted exams", err);
      }
    };

    fetchSubmittedExams();
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;

    const courseId = user?.course?._id;
    if (!courseId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const sectionId = user?.section?._id;
        const examUrl = sectionId
          ? `/api/exams?courseId=${courseId}&sectionId=${sectionId}`
          : `/api/exams?courseId=${courseId}`;

        const examsResponse = await axios.get(examUrl);
        const publishedExams = (examsResponse.data || []).filter((exam: Exam) => exam?.isPublished);
        setAvailableExams(publishedExams);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, user?.course?._id, user?.section?._id]);

  const getExamStatusMeta = (exam: Exam): ExamStatusMeta => {
    const isSubmitted = submittedExams.has(exam._id);
    const expiryTs = exam.expiresAt ? new Date(exam.expiresAt).getTime() : null;
    const now = Date.now();
    const sixHours = 6 * 60 * 60 * 1000;

    if (isSubmitted) {
      return {
        label: "Submitted",
        badgeClass: "border border-chart-2/40 bg-chart-2/15 text-chart-2",
        cardClass: "border-chart-2/30",
      };
    }

    if (expiryTs && expiryTs <= now) {
      return {
        label: "Expired",
        badgeClass: "border border-amber-500/50 bg-amber-500/15 text-amber-700",
        cardClass: "border-amber-500/35",
      };
    }

    if (expiryTs && expiryTs - now <= sixHours) {
      return {
        label: "Expiring Soon",
        badgeClass: "border border-destructive/40 bg-destructive/10 text-destructive",
        cardClass: "border-destructive/30",
      };
    }

    return {
      label: "Live",
      badgeClass: "border border-primary/35 bg-primary/12 text-primary",
      cardClass: "border-border",
    };
  };

  const MessageToast = () => (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.5 }}
          className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-xl"
        >
          <CheckCircle className="h-6 w-6 text-green-400" />
          <span>{message}</span>
          <Button onClick={() => setMessage(null)} variant="ghost" className="h-auto p-1 text-muted-foreground hover:text-foreground">
            x
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-foreground">
        <p>Loading dashboard...</p>
        <p className="mt-2 text-sm text-muted-foreground">If no data appears, please log in again.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-destructive">
        <p>Error: {error}</p>
      </div>
    );
  }

  const { totalSubmissions, lastExam, averageScore } = stats;

  return (
    <div className="min-h-screen aurora-page p-4 text-foreground sm:p-6">
      <MessageToast />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="panel h-fit rounded-2xl p-5 shadow-xl lg:sticky lg:top-6">
          <div className="mb-6 border-b border-border/70 pb-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Student Workspace</p>
            <h2 className="mt-2 text-2xl font-bold">{user?.firstName || "Student"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {user?.course?.name || "No class"} - {user?.section ? `${user.section.name} (${user.section.code})` : "No section"}
            </p>
          </div>

          <nav className="space-y-2">
            <a href="#student-exams" className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm hover:bg-accent/20">
              <BookOpen className="h-4 w-4" /> My Exams
            </a>
            <NextLink href="/student/achievements" className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm hover:bg-accent/20">
              <BookOpen className="h-4 w-4" /> Achievements
            </NextLink>
            <NextLink href={studentId ? `/student/results/${studentId}` : "#"} className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm hover:bg-accent/20">
              <FileText className="h-4 w-4" /> Results
            </NextLink>
            <NextLink href={studentId ? `/student/analytics/${studentId}` : "#"} className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm hover:bg-accent/20">
              <BarChart2 className="h-4 w-4" /> Analytics
            </NextLink>
            <NextLink href="/profile" className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm hover:bg-accent/20">
              <User className="h-4 w-4" /> Profile
            </NextLink>
            <NextLink href="/settings" className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm hover:bg-accent/20">
              <Settings className="h-4 w-4" /> Settings
            </NextLink>
            <NextLink href="/notifications" className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm hover:bg-accent/20">
              <Bell className="h-4 w-4" /> Notifications
            </NextLink>
          </nav>

          <div className="mt-6 rounded-xl border border-border/70 bg-card/70 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Personal Summary</p>
            <p className="mt-2 text-sm text-muted-foreground">Completed: <span className="font-semibold text-foreground">{totalSubmissions}</span></p>
            <p className="text-sm text-muted-foreground">Average: <span className="font-semibold text-foreground">{averageScore}%</span></p>
            <p className="text-sm text-muted-foreground">Last Subject: <span className="font-semibold text-foreground">{lastExam?.subjectName || "None"}</span></p>
          </div>
        </aside>

        <main className="space-y-6">
          <header className="panel rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold">Student Dashboard</h1>
                <p className="mt-1 text-muted-foreground">Your exam center, progress insights, and personal academic workspace.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Smart Exam Feed Active
              </div>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<BookOpen className="h-6 w-6 text-primary" />} title="Exams Available" value={availableExams.length} color="text-primary" />
            <StatCard icon={<BarChart2 className="h-6 w-6 text-chart-2" />} title="Average Score" value={`${averageScore}%`} color="text-chart-2" />
            <StatCard icon={<FileText className="h-6 w-6 text-accent" />} title="Exams Completed" value={totalSubmissions} color="text-accent" />
            <StatCard icon={<Calendar className="h-6 w-6 text-amber-600" />} title="Last Exam" value={lastExam?.subjectName ?? "None"} color="text-amber-600" />
          </section>

          <section id="student-exams" className="panel rounded-2xl p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Assigned Exams</h2>
              <span className="text-sm text-muted-foreground">Only class-section matched exams are shown</span>
            </div>

            {availableExams.length === 0 ? (
              <div className="rounded-xl border border-border/70 bg-card/60 p-6 text-sm text-muted-foreground">No active exams available right now.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {availableExams.map((exam) => {
                  const status = getExamStatusMeta(exam);
                  const isSubmitted = submittedExams.has(exam._id);
                  const hasQuestions =
                    (exam.questions?.MCQs?.length ?? 0) > 0 ||
                    (exam.questions?.Theory?.length ?? 0) > 0 ||
                    (exam.questions?.Coding?.length ?? 0) > 0;
                  const isExpired = status.label === "Expired";
                  const displayPublished = exam.publishedAt || exam.date
                    ? new Date(exam.publishedAt ?? exam.date!).toLocaleDateString()
                    : "N/A";
                  const displayExpiry = exam.expiresAt ? new Date(exam.expiresAt).toLocaleString() : "No auto-expiry";

                  return (
                    <Card key={exam._id} className={`rounded-2xl border ${status.cardClass} bg-card/75 p-5 shadow-sm`}>
                      <CardHeader className="p-0">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg font-semibold text-primary">{exam.title || "Untitled Exam"}</CardTitle>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.badgeClass}`}>{status.label}</span>
                        </div>
                      </CardHeader>

                      <CardContent className="mt-4 space-y-2 p-0 text-sm">
                        <p className="font-medium text-foreground">{exam.subject?.name || "Untitled Subject"}</p>
                        <p className="text-muted-foreground">Class: {exam.course?.name || "N/A"}</p>
                        <p className="text-muted-foreground">
                          Sections: {Array.isArray(exam.targetSections) && exam.targetSections.length > 0
                            ? exam.targetSections.map((section) => `${section.name || "Section"} (${section.code || "-"})`).join(", ")
                            : "All sections"}
                        </p>
                        <p className="text-muted-foreground">Duration: {exam.duration ?? "N/A"} min</p>
                        <p className="text-muted-foreground">Published: {displayPublished}</p>
                        <p className="text-muted-foreground">Expires: {displayExpiry}</p>
                      </CardContent>

                      <div className="mt-5 flex items-center gap-2">
                        {isSubmitted ? (
                          <div className="inline-flex items-center gap-2 rounded-full bg-chart-2 px-4 py-2 text-sm font-semibold text-background">
                            <CheckCircle className="h-4 w-4" /> Already Submitted
                          </div>
                        ) : isExpired ? (
                          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-700">
                            <AlertTriangle className="h-4 w-4" /> Exam Expired
                          </div>
                        ) : hasQuestions ? (
                          <Button
                            onClick={() => {
                              if (user?.id) sessionStorage.setItem("temp_exam_student_id", user.id);
                              window.open(`/student/exam/${exam._id}`, "_blank");
                            }}
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/85"
                          >
                            <UploadCloud className="h-4 w-4" /> Start Exam
                          </Button>
                        ) : (
                          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-sm text-muted-foreground">
                            <Timer className="h-4 w-4" /> Questions not ready
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="panel rounded-2xl p-5">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-card/80">
            {icon}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className={`text-3xl font-black ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
