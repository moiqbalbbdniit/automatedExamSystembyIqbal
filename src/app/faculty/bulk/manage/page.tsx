"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import BulkUserManagementPanel from "@/components/bulk/BulkUserManagementPanel";

export default function FacultyBulkManagementPage() {
  return (
    <div className="min-h-screen aurora-page px-4 py-8 text-foreground sm:px-6 md:px-8">
      <div className="mx-auto mb-6 flex w-full max-w-6xl items-center justify-between">
        <h1 className="text-xl font-semibold text-primary sm:text-2xl">Bulk Operations</h1>
        <Link href="/faculty" className="w-auto">
          <Button variant="outline" className="border-border bg-card hover:bg-accent/20">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mx-auto w-full max-w-6xl">
        <BulkUserManagementPanel actor="faculty" />
      </div>
    </div>
  );
}
