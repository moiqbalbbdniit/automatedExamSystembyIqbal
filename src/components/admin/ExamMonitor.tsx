"use client";

import { useEffect, useState } from "react";
import { Loader2, CalendarDays, Eye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExamMonitor() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const fetchData = async (date: string) => {
    try {
      setLoading(true);
      setError(null); // Reset previous errors

      const res = await fetch(`/api/admin/exam-monitor?date=${date}`);
      if (!res.ok) {
        throw new Error(`Failed to load data: ${res.statusText}`);
      }

      const json = await res.json();

      // If the backend sends an error field
      if (json.error) throw new Error(json.error);

      setData(json);
    } catch (err: any) {
      console.error("❌ ExamMonitor fetch error:", err);
      setError(err.message || "Error loading exam data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  // Loading UI
  if (loading)
    return (
      <div className="flex justify-center items-center h-40 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="ml-2">Loading exam monitor...</p>
      </div>
    );

  // Error UI (component-specific, not breaking whole site)
  if (error)
    return (
      <div className="panel p-6 rounded-lg border border-destructive/70 text-destructive text-center">
        <div className="flex flex-col items-center space-y-2">
          <AlertTriangle className="w-6 h-6" />
          <p className="text-lg font-semibold">Error loading exam data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(selectedDate)}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );

  const { kpis, exams } = data || { kpis: {}, exams: [] };

  return (
    <div className="panel p-6 rounded-2xl shadow-md text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold">Exam Monitor</h2>

        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-muted-foreground" />
          <input
            type="date"
            className="bg-background border border-border text-foreground rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total Exams" value={kpis.totalExams || 0} />
        <KpiCard title="Total Students" value={kpis.totalStudents || 0} />
        <KpiCard
          title="Total Submissions"
          value={kpis.totalSubmissions || 0}
          color="text-emerald-500"
        />
        <KpiCard
          title="Unevaluated Exams"
          value={kpis.totalUnevaluated || 0}
          color="text-yellow-500"
        />
      </div>

      {/* Exam Details */}
      {!exams || exams.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">
          No exams found for {selectedDate}.
        </p>
      ) : (
        <div className="space-y-4">
          {exams.map((exam: any) => (
            <div
              key={exam.id}
              className="bg-card/70 p-4 rounded-xl border border-border"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h4 className="text-lg font-semibold">{exam.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {exam.subject} • {exam.faculty}
                  </p>
                </div>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <Eye className="w-4 h-4 mr-1" /> View
                </Button>
              </div>

              <div className="grid grid-cols-3 text-center mt-3">
                <div>
                  <p className="text-xl font-semibold">
                    {exam.totalStudents ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Unique Students</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-emerald-500">
                    {exam.totalSubmissions ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Submissions</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-yellow-500">
                    {exam.unevaluated ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Unevaluated</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KpiCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="bg-card/75 border border-border p-4 rounded-xl text-center">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground">{title}</h3>
      <p className={`text-2xl font-bold ${color || "text-foreground"}`}>
        {value ?? 0}
      </p>
    </div>
  );
}
