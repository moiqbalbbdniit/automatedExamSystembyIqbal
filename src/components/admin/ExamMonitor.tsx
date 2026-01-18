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
      <div className="flex justify-center items-center h-40 text-gray-300">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="ml-2">Loading exam monitor...</p>
      </div>
    );

  // Error UI (component-specific, not breaking whole site)
  if (error)
    return (
      <div className="bg-gray-900 p-6 rounded-lg border border-red-700 text-red-400 text-center">
        <div className="flex flex-col items-center space-y-2">
          <AlertTriangle className="w-6 h-6" />
          <p className="text-lg font-semibold">Error loading exam data</p>
          <p className="text-sm text-gray-400">{error}</p>
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
    <div className="bg-gray-900 p-6 rounded-lg shadow-md text-white border border-gray-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold">Exam Monitor</h2>

        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        <p className="text-gray-400 text-center py-10">
          No exams found for {selectedDate}.
        </p>
      ) : (
        <div className="space-y-4">
          {exams.map((exam: any) => (
            <div
              key={exam.id}
              className="bg-gray-800 p-4 rounded-md border border-gray-700"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h4 className="text-lg font-semibold">{exam.title}</h4>
                  <p className="text-sm text-gray-400">
                    {exam.subject} • {exam.faculty}
                  </p>
                </div>
                <Button variant="ghost" className="text-gray-300">
                  <Eye className="w-4 h-4 mr-1" /> View
                </Button>
              </div>

              <div className="grid grid-cols-3 text-center mt-3">
                <div>
                  <p className="text-xl font-semibold">
                    {exam.totalStudents ?? 0}
                  </p>
                  <p className="text-xs text-gray-400">Unique Students</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-emerald-500">
                    {exam.totalSubmissions ?? 0}
                  </p>
                  <p className="text-xs text-gray-400">Submissions</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-yellow-500">
                    {exam.unevaluated ?? 0}
                  </p>
                  <p className="text-xs text-gray-400">Unevaluated</p>
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
    <div className="bg-gray-800 p-4 rounded-lg text-center">
      <h3 className="text-sm text-gray-400">{title}</h3>
      <p className={`text-2xl font-bold ${color || "text-white"}`}>
        {value ?? 0}
      </p>
    </div>
  );
}
