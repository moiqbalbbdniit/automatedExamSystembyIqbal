"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type FacultyAnalytics = {
  summary: {
    totalExams: number;
    totalEvaluatedSubmissions: number;
    pendingEvaluations: number;
    avgPercentage: number;
    passRate: number;
  };
  coursePerformance: {
    courseId: string;
    courseName: string;
    attempts: number;
    avgPercentage: number;
  }[];
  subjectPerformance: {
    subjectName: string;
    attempts: number;
    avgPercentage: number;
  }[];
  topStudents: {
    studentId: string;
    studentName: string;
    attempts: number;
    avgPercentage: number;
    bestPercentage: number;
  }[];
  studentsTable: {
    studentId: string;
    studentName: string;
    studentEmail: string;
    attempts: number;
    avgPercentage: number;
    bestPercentage: number;
    passRate: number;
    lastExamDate: string;
  }[];
  recentExamPerformance: {
    examId: string;
    examTitle: string;
    courseName: string;
    subjectName: string;
    evaluatedCount: number;
    avgPercentage: number;
    createdAt: string;
  }[];
};

type StudentRecordResponse = {
  student: { id: string; name: string; email: string };
  summary: { attempts: number; avgPercentage: number; bestPercentage: number; passRate: number };
  records: {
    id: string;
    examId: string;
    examTitle: string;
    subjectName: string;
    courseName: string;
    facultyName: string;
    percentage: number;
    marksObtained: number;
    maxMarks: number;
    date: string;
  }[];
};

export default function FacultyAnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("180");
  const [analytics, setAnalytics] = useState<FacultyAnalytics | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [studentRecord, setStudentRecord] = useState<StudentRecordResponse | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [scoreBand, setScoreBand] = useState("all");
  const [tablePage, setTablePage] = useState(1);

  const PAGE_SIZE = 10;

  const handleViewRecord = async (studentId: string) => {
    if (!user?.id) return;
    setRecordOpen(true);
    setRecordLoading(true);
    setStudentRecord(null);
    try {
      const res = await fetch(`/api/analytics/student-record?studentId=${studentId}&facultyId=${user.id}`);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Failed to load student record");
      setStudentRecord(payload as StudentRecordResponse);
    } catch (err) {
      console.error("Student record fetch error", err);
      setStudentRecord(null);
    } finally {
      setRecordLoading(false);
    }
  };

  const fetchAnalytics = async (facultyId: string, selectedDays: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/faculty/analytics?facultyId=${facultyId}&days=${selectedDays}`);
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to load faculty analytics");
      }
      setAnalytics(payload as FacultyAnalytics);
    } catch (err) {
      console.error("Faculty analytics load error", err);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchAnalytics(user.id, days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, days]);

  useEffect(() => {
    setTablePage(1);
  }, [studentSearch, scoreBand, analytics?.studentsTable?.length]);

  const filteredStudents = (analytics?.studentsTable || []).filter((row) => {
    const q = studentSearch.trim().toLowerCase();
    const searchMatch =
      q.length === 0 ||
      row.studentName.toLowerCase().includes(q) ||
      row.studentEmail.toLowerCase().includes(q);
    const bandMatch =
      scoreBand === "all" ||
      (scoreBand === "high" && row.avgPercentage >= 75) ||
      (scoreBand === "mid" && row.avgPercentage >= 40 && row.avgPercentage < 75) ||
      (scoreBand === "low" && row.avgPercentage < 40);
    return searchMatch && bandMatch;
  });

  const totalTablePages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const safeTablePage = Math.min(tablePage, totalTablePages);
  const pagedStudents = filteredStudents.slice(
    (safeTablePage - 1) * PAGE_SIZE,
    safeTablePage * PAGE_SIZE
  );

  return (
    <div className="min-h-screen aurora-page p-4 text-foreground sm:p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Faculty Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dedicated analytics view for your exams and student performance.
          </p>
        </div>

        <div className="flex w-full gap-3 sm:w-auto">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="180">Last 180 Days</SelectItem>
              <SelectItem value="365">Last 1 Year</SelectItem>
              <SelectItem value="0">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/faculty" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full border-border bg-card hover:bg-accent/20 sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[45vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary"></div>
        </div>
      ) : !analytics ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-6 text-sm text-destructive">
            Unable to load analytics right now.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="border-border/70 bg-card/75"><CardHeader><CardTitle className="text-sm">Tracked Exams</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{analytics.summary.totalExams}</CardContent></Card>
            <Card className="border-border/70 bg-card/75"><CardHeader><CardTitle className="text-sm">Evaluated Submissions</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-primary">{analytics.summary.totalEvaluatedSubmissions}</CardContent></Card>
            <Card className="border-border/70 bg-card/75"><CardHeader><CardTitle className="text-sm">Pending Evaluations</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-accent">{analytics.summary.pendingEvaluations}</CardContent></Card>
            <Card className="border-border/70 bg-card/75"><CardHeader><CardTitle className="text-sm">Average Score</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-chart-2">{analytics.summary.avgPercentage}%</CardContent></Card>
            <Card className="border-border/70 bg-card/75"><CardHeader><CardTitle className="text-sm">Pass Rate</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{analytics.summary.passRate}%</CardContent></Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/70 bg-card/75">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <BarChart3 className="h-4 w-4" /> Course-wise Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.coursePerformance.slice(0, 10).map((course) => (
                  <div key={course.courseId} className="rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium">{course.courseName}</p>
                      <p className="text-sm font-semibold text-primary">{course.avgPercentage}%</p>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${Math.min(course.avgPercentage, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Attempts: {course.attempts}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/75">
              <CardHeader>
                <CardTitle>Top Students</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.topStudents.slice(0, 10).map((student) => (
                  <div key={student.studentId} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        Attempts: {student.attempts} • Best: {student.bestPercentage}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{student.avgPercentage}%</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 border-border bg-card hover:bg-accent/20"
                        onClick={() => handleViewRecord(student.studentId)}
                      >
                        View Record
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/70 bg-card/75">
            <CardHeader>
              <CardTitle>All Students (Search, Filter, View Record)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search by student name or email"
                />
                <Select value={scoreBand} onValueChange={setScoreBand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by score band" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{"All Score Bands"}</SelectItem>
                    <SelectItem value="high">{"High (75% and above)"}</SelectItem>
                    <SelectItem value="mid">{"Mid (40% - 74.99%)"}</SelectItem>
                    <SelectItem value="low">{"At Risk (< 40%)"}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground md:justify-self-end md:self-center">
                  Showing {pagedStudents.length} of {filteredStudents.length} students
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Avg</TableHead>
                    <TableHead>Best</TableHead>
                    <TableHead>Pass Rate</TableHead>
                    <TableHead>Last Exam</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No students found for this filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedStudents.map((row) => (
                      <TableRow key={row.studentId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{row.studentName}</p>
                            <p className="text-xs text-muted-foreground">{row.studentEmail || "No email"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{row.attempts}</TableCell>
                        <TableCell className="font-semibold text-primary">{row.avgPercentage}%</TableCell>
                        <TableCell>{row.bestPercentage}%</TableCell>
                        <TableCell>{row.passRate}%</TableCell>
                        <TableCell>{new Date(row.lastExamDate).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-border bg-card hover:bg-accent/20"
                            onClick={() => handleViewRecord(row.studentId)}
                          >
                            View Record
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-border bg-card hover:bg-accent/20"
                  disabled={safeTablePage <= 1}
                  onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {safeTablePage} of {totalTablePages}
                </span>
                <Button
                  variant="outline"
                  className="border-border bg-card hover:bg-accent/20"
                  disabled={safeTablePage >= totalTablePages}
                  onClick={() => setTablePage((p) => Math.min(totalTablePages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/70 bg-card/75">
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.subjectPerformance.slice(0, 10).map((subject) => (
                  <div key={subject.subjectName} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium">{subject.subjectName}</p>
                      <p className="text-xs text-muted-foreground">Attempts: {subject.attempts}</p>
                    </div>
                    <p className="text-sm font-semibold text-primary">{subject.avgPercentage}%</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/75">
              <CardHeader>
                <CardTitle>Recent Exam Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.recentExamPerformance.slice(0, 10).map((exam) => (
                  <div key={exam.examId} className="rounded-lg border border-border p-3">
                    <p className="font-medium">{exam.examTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {exam.subjectName} • {exam.courseName}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Evaluated: {exam.evaluatedCount}</span>
                      <span className="font-semibold text-primary">{exam.avgPercentage}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border border-border bg-popover text-popover-foreground sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Student Performance Record
              {studentRecord?.student?.name ? `: ${studentRecord.student.name}` : ""}
            </DialogTitle>
          </DialogHeader>

          {recordLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
            </div>
          ) : !studentRecord ? (
            <p className="text-sm text-muted-foreground">Unable to load this student record.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Attempts</p><p className="text-lg font-bold">{studentRecord.summary.attempts}</p></div>
                <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Average</p><p className="text-lg font-bold text-primary">{studentRecord.summary.avgPercentage}%</p></div>
                <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Best</p><p className="text-lg font-bold">{studentRecord.summary.bestPercentage}%</p></div>
                <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Pass Rate</p><p className="text-lg font-bold text-chart-2">{studentRecord.summary.passRate}%</p></div>
              </div>

              <div className="space-y-2">
                {studentRecord.records.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{r.examTitle}</p>
                        <p className="text-xs text-muted-foreground">{r.subjectName} • {r.courseName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{r.percentage}%</p>
                        <p className="text-xs text-muted-foreground">{r.marksObtained}/{r.maxMarks}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
