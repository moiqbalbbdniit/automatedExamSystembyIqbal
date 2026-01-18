"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function BulkUserUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return toast.error("Please select an Excel file first");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/bulk/user/create", { method: "POST", body: formData });
    const data = await res.json();

    setLoading(false);
    if (res.ok) {
      toast.success(data.message);
    } else {
      toast.error(data.error || "Failed to process file");
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-semibold">📥 Bulk User Upload</h2>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-sm border border-gray-300 rounded-md p-2 focus:outline-none"
      />
      <Button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload & Import"}
      </Button>
    </div>
  );
}
