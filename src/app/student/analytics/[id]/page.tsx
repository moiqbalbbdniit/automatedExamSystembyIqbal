"use client";

import { useParams , useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, BarChart3, ChevronLeft  } from "lucide-react";
export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  useEffect(() => {
    if (params?.id) {
      setStudentId(params.id as string);
    }
  }, [params]);

  if (!studentId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 text-blue-300 font-medium">
         <Loader2 className="w-6 h-6 mr-2 animate-spin" />  Loading analytics...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 p-6 sm:p-10 text-gray-100">
      {/* Loader overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/95 backdrop-blur-sm z-10">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg font-medium">Loading report...</p>
        </div>
      )}

          {/* Back Button */}
      <div className="flex justify-start mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center gap-2 bg-blue-600/20 cursor-pointer hover:bg-blue-600/30 text-blue-300 px-4 py-2 rounded-full font-medium transition-all duration-200 shadow-sm border border-blue-700/30 w-full sm:w-auto"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      
      {/* Header */}
       <div className="flex flex-col items-center mb-8 text-center">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <h1 className="text-3xl font-bold text-blue-400">
            Student Analytics Dashboard
          </h1>
        </div>
        <p className="text-gray-400 text-sm">
          Comprehensive performance overview and trends
        </p>
      </div>

      <iframe
        src={`${process.env.NEXT_PUBLIC_ANALYTICS_MODEL_URL}/report/${studentId}`}
        width="100%"
        height="800"
        className="rounded-lg border border-slate-700 shadow-lg bg-white"
        onLoad={handleIframeLoad}
      ></iframe>
    </div>
  );
}
