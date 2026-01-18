"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRef } from "react";
import axios from "axios";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, Clock, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// --- Types ---
type Question = { Q_ID: string; question: string; options?: string[]; type?: string };
type QuestionPaper = { MCQs?: Question[]; Theory?: Question[]; Coding?: Question[] };
type Exam = { _id: string; title: string; subject: { name: string; code?: string }; duration: number; questions: QuestionPaper , proctoringEnabled?: boolean; };
type Answer = { questionText: string; studentAnswer: string; marks: number };

export default function ExamTaker() {
  const params = useParams();
  const { user } = useAuth();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [showReloadDialog, setShowReloadDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isProctoringStarted, setIsProctoringStarted] = useState(false);

  const authUserId =
    user?.id || (typeof window !== "undefined" ? sessionStorage.getItem("temp_exam_student_id") : null);

  useEffect(() => {
    if (videoRef.current) {
      console.log("🎬 Video element ready:", videoRef.current);
    }
  }, []);

  // --- Fetch Exam ---
  useEffect(() => {
    async function fetchExam() {
      try {
        const res = await axios.get(`/api/exams/${examId}`);
        const data: Exam = res.data;
        setExam(data);
        setTimeLeft(data.duration * 60);
      } catch {
        setError("Failed to load exam. It might not exist or be published.");
      } finally {
        setLoading(false);
      }
    }
    if (examId) fetchExam();
  }, [examId]);

  // --- Timer ---
  useEffect(() => {
    if (!exam) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleExamSubmission(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam]);

  //camera access and full screen

  useEffect(() => {
    // Disable copy, paste, right-click, inspect
    const disableActions = (e: any) => e.preventDefault();
    document.addEventListener("contextmenu", disableActions);
    document.addEventListener("copy", disableActions);
    document.addEventListener("cut", disableActions);
    document.addEventListener("paste", disableActions);
    document.onkeydown = function (e) {
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) return false;
    };

    // Detect tab change / visibility loss
    const handleVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("contextmenu", disableActions);
      document.removeEventListener("copy", disableActions);
      document.removeEventListener("cut", disableActions);
      document.removeEventListener("paste", disableActions);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);
  //  Always enforce fullscreen — ESC shows warning & re-enters
  useEffect(() => {
    const goFull = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {}
    };

    const escHandler = (e:any) => {
      if (e.key === "Escape") {
        e.preventDefault();
        toast.warning("⚠️ You must stay in fullscreen mode!");
        goFull(); 
      }
    };
    document.addEventListener("keydown", escHandler);
    return () => document.removeEventListener("keydown", escHandler);
  }, []);

  //auto submit on tab switch

  useEffect(() => {
    if (tabSwitchCount === 1) {
      toast.warning("⚠️ Warning: You switched tabs. Next time will auto-submit your exam!");
    } else if (tabSwitchCount >= 2) {
      toast.warning("⚠️ You switched tabs twice. Auto-submitting exam...");
      handleExamSubmission(true);
    }
  }, [tabSwitchCount]);

  //request for camera access

  const startProctoring = async () => {
    try {
      console.log("🎥 Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
      });

      if (!videoRef.current) {
        console.error("❌ videoRef is null — cannot attach stream.");
        return;
      }

      // Attach and play
      videoRef.current.srcObject = stream;
      setCameraStream(stream);

      // Try multiple times to start the feed (for autoplay issues)
      const tryPlay = async () => {
        try {
          await videoRef.current?.play();
          console.log("✅ Camera feed playing successfully");
        } catch (err) {
          console.warn("Retrying video play due to autoplay restriction...");
          setTimeout(tryPlay, 1000);
        }
      };
      tryPlay();

      // Fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Camera access denied or not available. Please enable your webcam and refresh.");
    }
  };

  useEffect(() => {
    const initCamera = async () => {
      if (document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
        } catch(err) {
          console.warn("Fullscreen blocked");
        }
      }
      if (!exam?.proctoringEnabled) return;
      if (!isProctoringStarted || !videoRef.current) return;
      try {
        console.log("🎥 Starting live camera after render...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
        });

        videoRef.current.srcObject = stream;
        setCameraStream(stream);

        await videoRef.current.play().catch((err) => {
          console.warn("Autoplay blocked, retrying...", err);
          setTimeout(() => videoRef.current?.play(), 1000);
        });

        console.log("✅ Camera live inside box now.");
      } catch (err) {
        console.error("Camera error:", err);
        alert("Camera access denied or unavailable. Please allow webcam.");
      }

      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    };

    initCamera();
  }, [isProctoringStarted , exam?.proctoringEnabled]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      stream.getTracks().forEach((t) => t.stop()); 
    }).catch(() => {
      console.warn("User denied camera permission initially");
    });
  }, []);

  // --- Save/Load Answers ---
  useEffect(() => {
    if (answers.length >= 0)
      localStorage.setItem(`exam_${examId}_answers`, JSON.stringify(answers));
  }, [answers, examId]);

  useEffect(() => {
    const saved = localStorage.getItem(`exam_${examId}_answers`);
    if (saved) setAnswers(JSON.parse(saved));
  }, [examId]);

  // --- Prevent Reload (keeps existing dialog behavior) ---
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      setShowReloadDialog(true);
      return "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // --- Answer Change ---
  const handleAnswerChange = (question: Question, studentAnswer: string) => {
    const marks = question.type === "MCQ" ? 2 : question.type === "Theory" ? 10 : 10;
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionText === question.question);
      if (existing) {
        return prev.map((a) =>
          a.questionText === question.question ? { questionText: question.question, studentAnswer, marks } : a
        );
      }
      return [...prev, { questionText: question.question, studentAnswer, marks }];
    });
  };

  // --- Submit Exam ---
  const handleExamSubmission = useCallback(
    async (auto = false) => {
      if (!exam || !authUserId) {
        setError("Exam or user not found.");
        return;
      }

      // if (answers.length === 0) {
      //   alert("You must answer at least one question before submitting.");
      //   return;
      // }

      if (!auto) {
        setShowSubmitDialog(true);
        return;
      }

      // AUTO submission path: use sendBeacon or fetch keepalive fallback
      setSubmitting(true);
      try {
        const payload = { examId: exam._id, studentId: authUserId, answers };

        // Try navigator.sendBeacon first
        let beaconSent = false;
        try {
          if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
            const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
            beaconSent = navigator.sendBeacon("/api/submit-exam", blob);
            console.log("🛰️ sendBeacon result:", beaconSent);
          }
        } catch (e) {
          console.warn("sendBeacon failed:", e);
          beaconSent = false;
        }

        // If sendBeacon failed, try fetch with keepalive (works in many browsers)
        if (!beaconSent) {
          try {
            await fetch("/api/submit-exam", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              keepalive: true,
            });
            console.log("🛰️ fetch keepalive fallback used");
          } catch (fetchErr) {
            console.warn("fetch keepalive failed:", fetchErr);
            // Final fallback: axios (may not complete if tab closes immediately)
            try {
              await axios.post("/api/submit-exam", payload);
            } catch (axErr) {
              console.error("Axios fallback failed:", axErr);
            }
          }
        }

        // Clear local storage copy of answers (best-effort)
        try {
          localStorage.removeItem(`exam_${examId}_answers`);
        } catch (e) {
          console.warn("Could not remove answers from localStorage:", e);
        }

        // show success dialog if page still open
        setShowSuccessDialog(true);
      } catch (err) {
        console.error("Submission failed:", err);
        if (axios.isAxiosError(err) && err.response?.status === 409) {
          toast.error("⚠️ You have already submitted this exam!");
        } else {
          toast.error("❌ Error submitting exam.");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [exam, authUserId, answers, examId]
  );

  // Add an effect that will attempt to submit via beacon when tab is being closed.
  useEffect(() => {
    const handleUnloadAndSubmit = (e: BeforeUnloadEvent) => {
      // Show native confirmation (some browsers ignore custom text)
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave? Your exam will be submitted automatically.";

      // Best-effort beacon submission synchronously
      try {
        if (!exam || !authUserId) return;

        const payload = { examId: exam._id, studentId: authUserId, answers };
        if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
          const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
          const ok = navigator.sendBeacon("/api/submit-exam", blob);
          console.log("beforeunload: sendBeacon ->", ok);
          if (ok) {
            try { localStorage.removeItem(`exam_${examId}_answers`); } catch {}
            return;
          }
        }

        // If beacon not available or failed, try fetch keepalive (best-effort)
        try {
          fetch("/api/submit-exam", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch((err) => console.warn("beforeunload fetch keepalive failed", err));
          try { localStorage.removeItem(`exam_${examId}_answers`); } catch {}
        } catch (err) {
          console.warn("beforeunload fallback fetch failed:", err);
        }
      } catch (outerErr) {
        console.error("Error during beforeunload submission:", outerErr);
      }
    };

    window.addEventListener("beforeunload", handleUnloadAndSubmit);
    return () => window.removeEventListener("beforeunload", handleUnloadAndSubmit);
  }, [exam, authUserId, answers, examId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const allQuestions = useMemo(() => {
    if (!exam?.questions) return [];
    const { MCQs = [], Theory = [], Coding = [] } = exam.questions;
    return [
      ...MCQs.map((q) => ({ ...q, type: "MCQ" })),
      ...Theory.map((q) => ({ ...q, type: "Theory" })),
      ...Coding.map((q) => ({ ...q, type: "Coding" })),
    ];
  }, [exam]);

  // --- UI Rendering ---
  if (loading)
    return <div className="min-h-screen flex items-center justify-center text-gray-300 text-lg">Loading Exam...</div>;

  if (error || !exam)
    return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error || "Exam not found."}</div>;

  return (
    <>

    {showInstructions && (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 text-white p-6">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-lg text-center space-y-6 shadow-2xl border border-gray-700">
          <h2 className="text-2xl font-bold text-blue-300">Exam Instructions</h2>
          <ul className="text-left text-gray-200 list-disc list-inside space-y-2">

            <ul className="list-disc pl-5 mb-2 text-lg space-y-1 text-gray-100 text-xs sm:text-sm leading-relaxed">
              <li>Keep your camera and microphone on throughout the exam - moving out of the frame may trigger a warning or auto-submit.</li>
              <li>Switching tabs or minimizing the window more than twice will result in automatic submission.</li>
              <li>Do not reload, copy, or navigate away from the exam window.</li>
              <li>Maintain eye contact with the screen — frequent looking away will be flagged.</li>
              <li>Ensure proper lighting and a quiet environment for clear detection.</li>
              <li>Submit your answers before time ends — system auto-submits when the timer expires.</li>
              <li>Leaving fullscreen mode may pause monitoring and lead to auto-submission.</li>
              <li>Any external assistance or use of devices is strictly prohibited.</li>
            </ul>

          </ul>
          <Button
            onClick={() => {
              setShowInstructions(false);
              setIsProctoringStarted(true); // 👈 Add this new state trigger
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-full"
          >
            I’m Ready
          </Button>

        </div>
      </div>
    )}
    {showInstructions && !exam?.proctoringEnabled && (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 text-white p-6">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-lg text-center space-y-6 shadow-2xl border border-gray-700">
          <h2 className="text-2xl font-bold text-blue-300">Exam Instructions</h2>
          <ul className="text-left text-gray-200 list-disc list-inside space-y-2">
            <ul className="list-disc pl-5 mb-2 text-lg space-y-1 text-gray-100 text-xs sm:text-sm leading-relaxed">

              <li>Switching tabs or minimizing the window more than twice will result in automatic submission.</li>
              <li>Do not reload, copy, or navigate away from the exam window.</li>
              <li>Maintain eye contact with the screen — frequent looking away will be flagged.</li>
              <li>Submit your answers before time ends — system auto-submits when the timer expires.</li>
              <li>Leaving fullscreen mode may pause monitoring and lead to auto-submission.</li>
              <li>Any external assistance or use of devices is strictly prohibited.</li>
            </ul>

          </ul>
          <Button
            onClick={() => {
              setShowInstructions(false);

              setIsProctoringStarted(true); // Triggers the non-proctoring exam flow
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-full"
          >
            Start Exam
          </Button>
        </div>
      </div>
    )}

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-blue-900 text-white font-sans p-6 sm:p-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <header className="flex flex-col sm:flex-row items-center justify-between p-6 bg-gradient-to-r from-gray-800 to-gray-700 rounded-3xl shadow-2xl border border-gray-600">
            <Button
              onClick={() => handleExamSubmission(false)}
              disabled={submitting}
              className="flex items-center gap-2 font-semibold rounded-full bg-red-600 border border-red-800 hover:bg-red-700 text-white shadow-xl px-5 py-3 order-3 sm:order-1 mt-4 sm:mt-0"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              {submitting ? "Submitting..." : "Finish Exam"}
            </Button>

            <div className="text-center flex-1 mt-4 sm:mt-0 order-1 sm:order-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-teal-400 drop-shadow-md">
                {exam.subject?.name} Exam
              </h1>
            </div>

            <div className="flex items-center space-x-2 text-red-600 font-bold bg-gradient-to-r from-red-200 to-red-100 px-5 py-2 rounded-full shadow-md mt-4 sm:mt-0 order-2 sm:order-3">
              <Clock className="w-5 h-5" />
              <span className="text-red-800">{formatTime(timeLeft)}</span>
            </div>
          </header>

          <section className="space-y-8">
            {allQuestions.map((q, i) => (
              <Card key={q.Q_ID || i} className="p-8 rounded-3xl shadow-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-xl font-bold text-blue-300">Question {i + 1}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-6">
                  <p className="text-lg font-medium text-white">{q.question}</p>

                  {q.type === "MCQ" && q.options && (
                    <div className="space-y-4">
                      {q.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer ${
                            answers.find((a) => a.questionText === q.question)?.studentAnswer === option
                              ? "bg-blue-700 border-blue-400"
                              : "bg-gray-800 border-gray-600 hover:bg-blue-700"
                          }`}
                          onClick={() => handleAnswerChange(q, option)}
                        >
                          <input
                            type="radio"
                            checked={answers.find((a) => a.questionText === q.question)?.studentAnswer === option}
                            readOnly
                            className="form-radio text-blue-500 w-4 h-4"
                          />
                          <label className="text-white font-medium flex-1 cursor-pointer">{option}</label>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === "Theory" && (
                    <textarea
                      rows={8}
                      placeholder="Write your answer..."
                      value={answers.find((a) => a.questionText === q.question)?.studentAnswer || ""}
                      onChange={(e) => handleAnswerChange(q, e.target.value)}
                      className="w-full p-4 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder-gray-300"
                    />
                  )}

                  {q.type === "Coding" && (
                    <textarea
                      rows={12}
                      placeholder="// Write your code here..."
                      value={answers.find((a) => a.questionText === q.question)?.studentAnswer || ""}
                      onChange={(e) => handleAnswerChange(q, e.target.value)}
                      className="w-full font-mono p-4 border border-gray-600 rounded-lg bg-gray-950 text-green-400 placeholder-gray-400"
                    />
                  )}
                </CardContent>
              </Card>
            ))}

            <Button
              onClick={() => handleExamSubmission(false)}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 py-4 text-white font-bold rounded-3xl shadow-lg bg-gradient-to-r from-blue-800 to-blue-900 hover:to-blue-800"
            >
              {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
              {submitting ? "Submitting..." : "Submit Exam"}
            </Button>
          </section>
        </div>

        {exam?.proctoringEnabled && (
          <div className="fixed bottom-5 right-5 w-32 h-32 sm:w-40 sm:h-40 bg-black border-2 border-blue-500 rounded-lg overflow-hidden shadow-lg z-[9999] flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            {!cameraStream && (
              <span className="text-xs text-gray-400 absolute">Loading camera...</span>
            )}
          </div>
        )}
      </div>

      {/* 🔒 Reload Confirmation Dialog */}
      <AlertDialog open={showReloadDialog} onOpenChange={setShowReloadDialog}>
        <AlertDialogContent className="bg-gray-900 border border-gray-700 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-white" >
              If you reload or leave this page, all unsaved answers may be lost. Please confirm before refreshing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowReloadDialog(false)} className="bg-gray-700 text-gray-200 hover:bg-gray-600">
              Stay on Page
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => window.location.reload()} className="bg-red-600 text-white hover:bg-red-700">
              Reload Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent className="bg-gray-900 border border-gray-700 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-700">Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription className="text-white">
              Are you sure you want to submit your exam? You won&lsquo;t be able to change your answers after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowSubmitDialog(false)} className="bg-gray-700 text-gray-200 hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowSubmitDialog(false);
                handleExamSubmission(true);
              }}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Yes, Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="bg-gray-900 border border-gray-700 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-100">✅ Exam Submitted</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Your exam has been submitted successfully. Click below to close this tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => window.close()} className="bg-green-600 text-white hover:bg-green-700">
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
