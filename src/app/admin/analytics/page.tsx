"use client";

import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);

  const handleIframeLoad = () => {
    // hide loader once iframe is ready
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen aurora-page p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-foreground mb-6 text-center">
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
        height="900"
        className="rounded-xl border border-slate-800 shadow-xl bg-white w-full"
        onLoad={handleIframeLoad}
      ></iframe>
    </div>
  );
}
