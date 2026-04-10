"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, BarChart3, ChevronLeft } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";

type StudentResult = {
  _id: string;
  totalMarksObtained?: number;
  totalMaxMarks?: number;
  percentage?: number;
  createdAt: string;
  examId?: {
    _id?: string;
    title?: string;
    duration?: number;
    subject?: { name?: string };
  };
};

const PIE_COLORS = ["#ff6b35", "#0ea5e9", "#22c55e", "#f59e0b", "#6366f1"];

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);

  const PAGE_SIZE = 10;

  useEffect(() => {
    if (params?.id) {
      setStudentId(params.id as string);
    }
  }, [params]);

  useEffect(() => {
    if (authLoading || !studentId || !user?.id) return;
    if (user.role === "student" && String(user.id) !== String(studentId)) {
      router.replace("/student");
    }
  }, [authLoading, studentId, user, router]);

  useEffect(() => {
    if (!studentId) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/results?studentId=${studentId}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load student analytics:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [studentId]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historySearch, results.length]);

  if (!studentId || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-primary font-medium">
        <Loader2 className="w-6 h-6 mr-2 animate-spin" /> Loading analytics...
      </div>
    );
  }

  const totalExams = results.length;
  const avgPercentage = totalExams
    ? Math.round(
        (results.reduce((acc, item) => acc + Number(item.percentage || 0), 0) / totalExams) * 100
      ) / 100
    : 0;
  const bestPercentage = totalExams
    ? Math.max(...results.map((item) => Number(item.percentage || 0)))
    : 0;

  const trendData = [...results]
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .map((item) => ({
      label: new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      percentage: Number(item.percentage || 0),
      exam: item.examId?.title || "Untitled",
    }));

  const subjectMap = new Map<string, { total: number; count: number }>();
  for (const item of results) {
    const subject = item.examId?.subject?.name || "Unknown Subject";
    const current = subjectMap.get(subject) || { total: 0, count: 0 };
    current.total += Number(item.percentage || 0);
    current.count += 1;
    subjectMap.set(subject, current);
  }

  const subjectPerformance = Array.from(subjectMap.entries()).map(([subject, value]) => ({
    subject,
    avgPercentage: Math.round((value.total / Math.max(value.count, 1)) * 100) / 100,
    attempts: value.count,
  }));

  const subjectDistribution = subjectPerformance.map((s) => ({ name: s.subject, value: s.attempts }));

  const filteredHistory = results.filter((item) => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return true;
    const title = (item.examId?.title || "").toLowerCase();
    const subject = (item.examId?.subject?.name || "").toLowerCase();
    return title.includes(q) || subject.includes(q);
  });

  const totalHistoryPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const safeHistoryPage = Math.min(historyPage, totalHistoryPages);
  const pagedHistory = filteredHistory.slice(
    (safeHistoryPage - 1) * PAGE_SIZE,
    safeHistoryPage * PAGE_SIZE
  );

  return (
    <div className="min-h-screen aurora-page p-6 sm:p-10 text-foreground">

          {/* Back Button */}
      <div className="flex justify-start mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center gap-2 bg-primary/20 cursor-pointer hover:bg-primary/30 text-primary px-4 py-2 rounded-full font-medium transition-all duration-200 shadow-sm border border-primary/30 w-full sm:w-auto"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold text-primary">
            Student Analytics Dashboard
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Built-in analytics for your historical exam performance
        </p>
      </div>

      {loading ? (
        <div className="flex h-[45vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border/70 bg-card/75"><CardHeader><CardTitle className="text-sm">Total Evaluated Exams</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{totalExams}</CardContent></Card>
            <Card className="border-border/70 bg-card/75"><CardHeader><CardTitle className="text-sm">Average Score</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-primary">{avgPercentage}%</CardContent></Card>
            <Card className="border-border/70 bg-card/75"><CardHeader><CardTitle className="text-sm">Best Score</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-chart-2">{bestPercentage}%</CardContent></Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/70 bg-card/75">
              <CardHeader><CardTitle>Performance Trend</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line dataKey="percentage" type="monotone" stroke="#ff6b35" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/75">
              <CardHeader><CardTitle>Subject Distribution</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={subjectDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                      {subjectDistribution.map((entry, i) => (
                        <Cell key={`${entry.name}-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/70 bg-card/75">
            <CardHeader><CardTitle>Subject-wise Average Score</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="avgPercentage" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/75">
            <CardHeader><CardTitle>Recent Exam History</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search by exam title or subject"
                />
                <div className="text-sm text-muted-foreground md:justify-self-end md:self-center">
                  Showing {pagedHistory.length} of {filteredHistory.length} records
                </div>
              </div>

              {pagedHistory.map((item) => (
                <div key={item._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium">{item.examId?.title || "Untitled Exam"}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.examId?.subject?.name || "Unknown Subject"} • {new Date(item.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{Number(item.percentage || 0)}%</p>
                    <p className="text-xs text-muted-foreground">
                      {Number(item.totalMarksObtained || 0)}/{Number(item.totalMaxMarks || 0)}
                    </p>
                  </div>
                </div>
              ))}

              {pagedHistory.length === 0 && (
                <p className="text-sm text-muted-foreground">No exam records found for this search.</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  className="border-border bg-card hover:bg-accent/20"
                  disabled={safeHistoryPage <= 1}
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {safeHistoryPage} of {totalHistoryPages}
                </span>
                <Button
                  variant="outline"
                  className="border-border bg-card hover:bg-accent/20"
                  disabled={safeHistoryPage >= totalHistoryPages}
                  onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
