"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function GlobalLoader() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Trigger loader when route changes
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 1000); // smooth exit delay
    return () => clearTimeout(timeout);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-md bg-black/40 text-white">
      {/* Glowing laptop + data bubbles */}
      <div className="relative flex flex-col items-center">
        <div className="absolute h-40 w-40 rounded-full bg-indigo-500/20 animate-ping"></div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-24 w-24 text-indigo-400 animate-bounce-slow"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v12H3V4zM2 18h20a1 1 0 01.894 1.447A2 2 0 0121 20H3a2 2 0 01-1.894-0.553A1 1 0 012 18z"
          />
        </svg>

        <div className="absolute -top-6 flex space-x-2 animate-bounce">
          <div className="h-2 w-2 bg-indigo-400 rounded-full"></div>
          <div className="h-2 w-2 bg-purple-400 rounded-full delay-150"></div>
          <div className="h-2 w-2 bg-pink-400 rounded-full delay-300"></div>
        </div>
      </div>

      <h2 className="text-2xl mt-8 font-semibold bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent animate-pulse">
        Fetching Data from Server...
      </h2>
      <p className="text-gray-300 mt-2 animate-fadeIn">
        Please wait while we load your content.
      </p>
    </div>
  );
}
