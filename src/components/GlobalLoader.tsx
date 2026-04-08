"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

export default function GlobalLoader() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 850);
    return () => clearTimeout(timeout);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 px-4 backdrop-blur-lg">
      <div className="panel w-full max-w-2xl p-6 md:p-8">
        <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Sparkles className="size-4 text-primary" />
          Preparing your workspace
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-2/5 rounded-full" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <Skeleton className="h-9 w-1/3 rounded-full" />
        </div>

        <p className="mt-4 text-sm text-muted-foreground">Loading content securely...</p>
      </div>
    </div>
  );
}
