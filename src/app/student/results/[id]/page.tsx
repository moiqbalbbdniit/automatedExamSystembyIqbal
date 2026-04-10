"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  BookOpen,
  Clock,
  Loader2,
  Hourglass,
  CheckCircle2,
  TrendingUp,
  Star,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";

type EvaluationDetail = {
  questionText: string;
  scoreObtained: number;
  maximumScore: number;
  feedback: string;
};

type Submission = {
  _id: string;
  examTitle: string;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  percentage?: number;
  feedback?: string;
  strengths?: string[];
  weaknesses?: string[];
  durationInMinutes: number;
  status: string;
  evaluationDetails?: EvaluationDetail[];
};

export default function StudentResultsPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const studentId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const toArray = <T,>(data: unknown, key?: string): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (key && data && typeof data === "object") {
      const maybe = (data as Record<string, unknown>)[key];
      if (Array.isArray(maybe)) return maybe as T[];
    }
    return [];
  };

  useEffect(() => {
    if (authLoading) return;

    if (user?.role === "student" && user?.id && studentId && String(user.id) !== String(studentId)) {
      router.replace("/student");
      return;
    }

    if (!studentId) {
      console.error("Missing studentId in route or query params!");
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/results?studentId=${studentId}`);
        const data = res.data;
        const safeResults = toArray<any>(data, "results");

        const formatted: Submission[] = safeResults.map((result: any) => {
          const exam = result.examId || {};
          const subjectName = exam.subject?.name || "Unknown Subject";
          return {
            _id: result._id,
            examTitle: exam.title || "Untitled Exam",
            subject: subjectName,
            marksObtained: result.totalMarksObtained || 0,
            totalMarks: result.totalMaxMarks || 100,
            percentage: result.percentage || 0,
            feedback: result.feedback || "No feedback available",
            strengths: toArray<string>(result.strengths),
            weaknesses: toArray<string>(result.weaknesses),
            durationInMinutes: exam.duration || 0,
            status:
              result.totalMarksObtained != null
                ? "evaluated"
                : "pending_evaluation",
            evaluationDetails: toArray<any>(result.evaluationDetails).map((q: any) => ({
              questionText: q.questionText,
              scoreObtained: q.scoreObtained,
              maximumScore: q.maximumScore,
              feedback: q.feedback,
            })),
          };
        });

        setSubmissions(formatted);
      } catch (err) {
        console.error("Error fetching results:", err);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [studentId, authLoading, user, router]);

  const handleBack = () => (window.location.href = "/student");

  const safeSubmissions = Array.isArray(submissions) ? submissions : [];

  const groupedBySubject = safeSubmissions.reduce(
    (acc: Record<string, Submission[]>, sub) => {
      const subjectKey = sub.subject || "Unknown";
      if (!acc[subjectKey]) acc[subjectKey] = [];
      acc[subjectKey].push(sub);
      return acc;
    },
    {}
  );

  return (
    <div className="min-h-screen aurora-page text-foreground font-sans p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="panel rounded-3xl p-8 shadow-xl"
        >
          <div className="flex justify-between items-center mb-4">
            <Button
              onClick={handleBack}
              className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-full px-4 py-2 transition-all"
            >
              <ChevronLeft className="w-5 h-5" /> Back to Dashboard
            </Button>
            {!loading && safeSubmissions.length > 0 && (
              <Button
                onClick={() => router.push(`/student/analytics/${studentId}`)}
                className="flex items-center gap-2 bg-accent/20 hover:bg-accent/30 text-foreground rounded-full px-4 py-2 transition-all"
              >
                <TrendingUp className="w-5 h-5" /> View Analytics
              </Button>
            )}
          </div>

          <h1 className="text-4xl font-bold text-foreground">Your Exam Results</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Subject-wise performance overview
          </p>
        </motion.header>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-primary">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p>Loading your results...</p>
          </div>
        )}

        {/* No submissions */}
        {!loading && safeSubmissions.length === 0 && (
          <div className="text-center py-20 text-muted-foreground text-lg">
            No submissions found. Try completing an exam first.
          </div>
        )}

        {/* Results */}
        {!loading &&
          Object.keys(groupedBySubject).map((subject) => (
            <motion.section
              key={subject}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-primary" /> {subject}
                </h2>
                <div className="h-[1px] bg-gradient-to-r from-primary/60 to-accent/60 flex-1 ml-4"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedBySubject[subject].map((sub) => {
                  const percentage =
                    sub.totalMarks > 0
                      ? (sub.marksObtained / sub.totalMarks) * 100
                      : 0;

                  return (
                    <Card
                      key={sub._id}
                      className="panel rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all"
                    >
                      <CardHeader className="flex justify-between items-start">
                        <CardTitle className="text-lg text-primary font-semibold">
                          {sub.examTitle}
                        </CardTitle>
                        {sub.status === "evaluated" ? (
                          <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                        ) : (
                          <Hourglass className="w-6 h-6 text-yellow-400 shrink-0" />
                        )}
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <p className="text-muted-foreground">
                          <span className="font-semibold text-primary">
                            Score:
                          </span>{" "}
                          {sub.status === "evaluated" ? (
                            <>
                              {sub.marksObtained}/{sub.totalMarks}{" "}
                              <span className="text-muted-foreground">
                                ({percentage.toFixed(2)}%)
                              </span>
                            </>
                          ) : (
                            <span className="text-accent italic">
                              Pending Evaluation
                            </span>
                          )}
                        </p>

                        <p className="text-muted-foreground flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" /> Duration:{" "}
                          {sub.durationInMinutes} min
                        </p>

                        {sub.status === "evaluated" && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="mt-4 w-full bg-primary hover:bg-primary/85 text-primary-foreground">
                                View Results
                              </Button>
                            </DialogTrigger>

                            {/* Modal Content */}
                            <DialogContent className="max-w-4xl w-[90vw] sm:w-[80vw] lg:w-[60vw] max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-popover p-6 text-popover-foreground shadow-xl">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-foreground">
                                  {sub.examTitle} - Detailed Report
                                </DialogTitle>
                              </DialogHeader>

                              <div className="space-y-6 mt-4">
                                {/* Summary Section */}
                                <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
                                  <p className="mb-2 text-lg font-semibold text-primary">
                                    Overall Performance Summary
                                  </p>
                                  <div className="grid grid-cols-1 gap-4 text-foreground sm:grid-cols-3">
                                    <p>
                                      <span className="font-semibold text-primary">
                                        Marks Obtained:
                                      </span>{" "}
                                      {sub.marksObtained}/{sub.totalMarks}
                                    </p>
                                    <p>
                                      <span className="font-semibold text-primary">
                                        Percentage:
                                      </span>{" "}
                                      {percentage.toFixed(2)}%
                                    </p>
                                    <p>
                                      <span className="font-semibold text-primary">
                                        Feedback:
                                      </span>{" "}
                                      {sub.feedback}
                                    </p>
                                  </div>
                                </div>

                                {/* Strengths */}
                                {sub.strengths && sub.strengths.length > 0 && (
                                  <div>
                                    <h3 className="text-xl font-semibold text-green-400 flex items-center gap-2 mb-3">
                                      <Star className="w-5 h-5" /> Strengths
                                    </h3>
                                    <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                                      {sub.strengths.map((s, i) => (
                                        <li key={i}>{s}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Weaknesses */}
                                {sub.weaknesses && sub.weaknesses.length > 0 && (
                                  <div>
                                    <h3 className="text-xl font-semibold text-red-400 flex items-center gap-2 mb-3">
                                      <AlertTriangle className="w-5 h-5" /> Weaknesses
                                    </h3>
                                    <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                                      {sub.weaknesses.map((w, i) => (
                                        <li key={i}>{w}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              <DialogClose asChild>
                                <Button className="mt-6 w-full rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                  Close
                                </Button>
                              </DialogClose>
                            </DialogContent>
                          </Dialog>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.section>
          ))}
      </div>
    </div>
  );
}
