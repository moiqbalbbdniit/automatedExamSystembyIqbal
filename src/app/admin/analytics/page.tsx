"use client";

import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);

  const handleIframeLoad = () => {
    // hide loader once iframe is ready
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center aurora-page p-4 sm:p-6 md:p-8">
      <h1 className="mb-5 text-center text-xl font-bold text-foreground sm:mb-6 sm:text-2xl">
        Admin Analytics Dashboard
      </h1>

      {/* Loader Overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-50 transition-opacity">
          <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin mb-3"></div>
          <p className="text-muted-foreground text-sm">Loading analytics dashboard...</p>
        </div>
      )}

      <iframe
        src={process.env.NEXT_PUBLIC_ANALYTICS_MODEL_URL}
        width="100%"
        className="h-[70vh] w-full rounded-xl border border-slate-800 bg-white shadow-xl sm:h-[76vh] md:h-[82vh]"
        onLoad={handleIframeLoad}
      ></iframe>
    </div>
  );
}
