"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Option = { id: string; name: string };

type AdminAnalyticsResponse = {
  summary: {
    totalResults: number;
    totalStudents: number;
    totalCourses: number;
    totalFaculties: number;
    totalExams: number;
    totalSubmissions: number;
    avgPercentage: number;
    passRate: number;
  };
  filterOptions: {
    courses: Option[];
    faculties: Option[];
    students: Option[];
  };
  coursePerformance: {
    courseId: string;
    courseName: string;
    attempts: number;
    students: number;
    avgPercentage: number;
    passRate: number;
  }[];
  facultyPerformance: {
    facultyId: string;
    facultyName: string;
    attempts: number;
    uniqueStudents: number;
    avgPercentage: number;
    topStudents: { studentId: string; studentName: string; avgPercentage: number }[];
  }[];
  topPerformers: {
    studentId: string;
    studentName: string;
    courseName: string;
    attempts: number;
    avgPercentage: number;
    bestPercentage: number;
  }[];
  studentsTable: {
    studentId: string;
    studentName: string;
    studentEmail: string;
    courseName: string;
    attempts: number;
    avgPercentage: number;
    bestPercentage: number;
    passRate: number;
    lastExamDate: string;
  }[];
  studentOverview: null | {
    studentId: string;
    studentName: string;
    courseName: string;
    attempts: number;
    avgPercentage: number;
    bestPercentage: number;
    trend: { label: string; percentage: number; examTitle: string }[];
    recentExams: {
      examId: string;
      examTitle: string;
      subjectName: string;
      facultyName: string;
      percentage: number;
      marksObtained: number;
      maxMarks: number;
      date: string;
    }[];
  };
  areaData: { course: string; totalExams: number; avgPercentage: number }[];
  pieData: { name: string; value: number }[];
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

const PIE_COLORS = ["#ff6b35", "#0ea5e9", "#22c55e", "#f59e0b", "#6366f1", "#ef4444"]; 

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminAnalyticsResponse | null>(null);
  const [days, setDays] = useState("90");
  const [courseId, setCourseId] = useState("all");
  const [facultyId, setFacultyId] = useState("all");
  const [studentId, setStudentId] = useState("all");
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [studentRecord, setStudentRecord] = useState<StudentRecordResponse | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentScoreBand, setStudentScoreBand] = useState("all");
  const [tablePage, setTablePage] = useState(1);

  const PAGE_SIZE = 10;

  const handleViewRecord = async (selectedStudentId: string) => {
    setRecordOpen(true);
    setRecordLoading(true);
    setStudentRecord(null);
    try {
      const res = await fetch(`/api/analytics/student-record?studentId=${selectedStudentId}`);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Failed to load student record");
      setStudentRecord(payload as StudentRecordResponse);
    } catch (err) {
      console.error("Admin student record fetch error", err);
      setStudentRecord(null);
    } finally {
      setRecordLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        days,
        courseId,
        facultyId,
        studentId,
      });
      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Failed to load admin analytics");
      setData(payload);
    } catch (err) {
      console.error("Admin analytics load error", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, courseId, facultyId, studentId]);

  useEffect(() => {
    setTablePage(1);
  }, [studentSearch, studentScoreBand, data?.studentsTable?.length]);

  const filteredStudentsTable = (data?.studentsTable || []).filter((row) => {
    const q = studentSearch.trim().toLowerCase();
    const searchMatch =
      q.length === 0 ||
      row.studentName.toLowerCase().includes(q) ||
      row.studentEmail.toLowerCase().includes(q) ||
      row.courseName.toLowerCase().includes(q);

    const bandMatch =
      studentScoreBand === "all" ||
      (studentScoreBand === "high" && row.avgPercentage >= 75) ||
      (studentScoreBand === "mid" && row.avgPercentage >= 40 && row.avgPercentage < 75) ||
      (studentScoreBand === "low" && row.avgPercentage < 40);

    return searchMatch && bandMatch;
  });

  const totalTablePages = Math.max(1, Math.ceil(filteredStudentsTable.length / PAGE_SIZE));
  const safeTablePage = Math.min(tablePage, totalTablePages);
  const pagedStudentsTable = filteredStudentsTable.slice(
    (safeTablePage - 1) * PAGE_SIZE,
    safeTablePage * PAGE_SIZE
  );

  return (
    <div className="min-h-screen aurora-page p-4 sm:p-6 md:p-8 text-foreground">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-center text-xl font-bold sm:text-left sm:text-2xl">
          Admin Analytics Dashboard
        </h1>
        <Link href="/admin" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full border-border bg-card hover:bg-accent/20 sm:w-auto">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Card className="mb-6 border-border/70 bg-card/75">
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger>
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="180">Last 180 Days</SelectItem>
              <SelectItem value="365">Last 1 Year</SelectItem>
              <SelectItem value="0">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {(data?.filterOptions?.courses || []).map((course) => (
                <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={facultyId} onValueChange={setFacultyId}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Faculty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Faculties</SelectItem>
              {(data?.filterOptions?.faculties || []).map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger>
              <SelectValue placeholder="Student Drill-down" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              {(data?.filterOptions?.students || []).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex h-[45vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary"></div>
        </div>
      ) : !data ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-6 text-sm text-destructive">Unable to load analytics data.</CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/70 bg-card/75"><CardHeader><CardTitle className="text-sm">Avg Score</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-primary">{data.summary.avgPercentage}%</CardContent></Card>
            <Card className="border-border/70 bg-card/75"><CardHeader><CardTitle className="text-sm">Pass Rate</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-chart-2">{data.summary.passRate}%</CardContent></Card>
            <Card className="border-border/70 bg-card/75"><CardHeader><CardTitle className="text-sm">Students Evaluated</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.summary.totalStudents}</CardContent></Card>
            <Card className="border-border/70 bg-card/75"><CardHeader><CardTitle className="text-sm">Total Evaluations</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{data.summary.totalResults}</CardContent></Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/70 bg-card/75">
              <CardHeader><CardTitle>Course-wise Performance</CardTitle></CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.coursePerformance.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="courseName" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgPercentage" fill="#ff6b35" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/75">
              <CardHeader><CardTitle>Subject Distribution</CardTitle></CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.pieData.slice(0, 8)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}>
                      {data.pieData.slice(0, 8).map((entry, i) => (
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
            <CardHeader>
              <CardTitle>Student Directory (Search, Filter, View Record)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search by student, email, or course"
                />
                <Select value={studentScoreBand} onValueChange={setStudentScoreBand}>
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
                  Showing {pagedStudentsTable.length} of {filteredStudentsTable.length} students
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Avg</TableHead>
                    <TableHead>Best</TableHead>
                    <TableHead>Pass Rate</TableHead>
                    <TableHead>Last Exam</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedStudentsTable.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No students found for this filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedStudentsTable.map((row) => (
                      <TableRow key={row.studentId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{row.studentName}</p>
                            <p className="text-xs text-muted-foreground">{row.studentEmail || "No email"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{row.courseName}</TableCell>
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
              <CardHeader><CardTitle>Top Performers</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.topPerformers.slice(0, 8).map((s) => (
                  <div key={s.studentId} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-semibold">{s.studentName}</p>
                      <p className="text-xs text-muted-foreground">{s.courseName} • Attempts: {s.attempts}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{s.avgPercentage}%</p>
                      <p className="text-xs text-muted-foreground">Best {s.bestPercentage}%</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 border-border bg-card hover:bg-accent/20"
                        onClick={() => handleViewRecord(s.studentId)}
                      >
                        View Record
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/75">
              <CardHeader><CardTitle>Teacher Performance</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.facultyPerformance.slice(0, 8).map((f) => (
                  <div key={f.facultyId} className="rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-semibold">{f.facultyName}</p>
                      <p className="font-bold text-primary">{f.avgPercentage}%</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Attempts: {f.attempts} • Students: {f.uniqueStudents}</p>
                    {f.topStudents.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Top Student: {f.topStudents[0].studentName} ({f.topStudents[0].avgPercentage}%)
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {data.studentOverview && (
            <Card className="border-border/70 bg-card/75">
              <CardHeader>
                <CardTitle>Student Deep Dive: {data.studentOverview.studentName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Course</p><p className="font-semibold">{data.studentOverview.courseName}</p></div>
                  <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Average</p><p className="font-semibold text-primary">{data.studentOverview.avgPercentage}%</p></div>
                  <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Best Score</p><p className="font-semibold">{data.studentOverview.bestPercentage}%</p></div>
                </div>

                <div className="h-64 rounded-lg border border-border p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.studentOverview.trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="percentage" stroke="#ff6b35" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  {data.studentOverview.recentExams.slice(0, 8).map((exam) => (
                    <div key={`${exam.examId}-${exam.date}`} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="font-medium">{exam.examTitle}</p>
                        <p className="text-xs text-muted-foreground">{exam.subjectName} • {exam.facultyName}</p>
                      </div>
                      <p className="font-bold text-primary">{exam.percentage}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
                        <p className="text-xs text-muted-foreground">Teacher: {r.facultyName}</p>
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
