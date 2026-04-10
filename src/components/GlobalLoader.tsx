"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/35 backdrop-blur-[2px]">
      <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/90 px-4 py-2 text-sm text-muted-foreground shadow-lg">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Loading...
      </div>
    </div>
  );
}
