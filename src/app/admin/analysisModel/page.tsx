"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function AnalyticsIframe() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center">
      {!loaded && (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin text-blue-400 w-8 h-8" />
          <span className="ml-3">Loading Analytics Dashboard...</span>
        </div>
      )}
      <iframe
        src="https://analyticsmodel.onrender.com"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full border-0 ${loaded ? "block" : "hidden"}`}
        title="Exam Analytics Dashboard"
      />
    </div>
  );
}
