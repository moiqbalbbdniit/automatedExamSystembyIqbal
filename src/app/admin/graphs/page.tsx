"use client";

import { useEffect, useState } from "react";
import ChartsPanel from "@/components/admin/ChartsPanel";
import Link from "next/link";

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-blue-400">
          Admin Analytics
        </h1>
      <Link
  href="/admin"
  className="bg-indigo-700 hover:bg-indigo-800 text-white 
             px-2 py-[7px] text-[10px] 
             sm:px-3 sm:py-[7px] sm:text-[10px] 
             md:px-4 md:py-[7px] md:text-[10px] 
             lg:px-4 lg:py-2 lg:text-sm 
             rounded-lg shadow transition-all"
>
  ← Back to Dashboard
</Link>

      </div>

      <p className="text-gray-400 mb-8 text-sm sm:text-base">
        Explore detailed insights about exam performance, student activity, and faculty trends.
      </p>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
        </div>
      ) : (
        <ChartsPanel />
      )}
    </div>
  );
}