"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, FileSpreadsheet } from "lucide-react";

export default function BulkUserManagement() {
  
  const [activeTab, setActiveTab] = useState("create");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // ✅ Read Excel file and preview data
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    setFile(uploaded);
    setStatusMsg("Reading file...");
    try {
      const buffer = await uploaded.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      setPreviewData(jsonData.slice(0, 10)); // show first 10 rows
      setStatusMsg(`Previewing ${jsonData.length} records...`);
    } catch (err) {
      setStatusMsg("❌ Failed to read file");
      console.error(err);
    }
  };

  // ✅ Handle upload (create/delete)
  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    const url =
      activeTab === "create"
        ? "/api/bulk/user/create"
        : "/api/bulk/user/delete";

    setLoading(true);
    setStatusMsg("Processing, please wait...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Operation successful!");
        setStatusMsg(" Done! " + (data.message || ""));
        setPreviewData([]);
        setFile(null);
      } else {
        toast.error(data.error || "Something went wrong.");
        setStatusMsg("❌ " + (data.error || "Failed to process file"));
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Server error occurred.");
      setStatusMsg("❌ Server error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center py-10 px-6">
      <Card className="w-full max-w-5xl bg-slate-900 border border-slate-800 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">
            Bulk User Management
          </CardTitle>
          <CardDescription className="text-slate-400">
            Upload Excel files to create or delete multiple users at once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
              <TabsTrigger
                value="create"
                className="data-[state=active]:bg-green-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" /> Bulk Create
              </TabsTrigger>
              <TabsTrigger
                value="delete"
                className="data-[state=active]:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Bulk Delete
              </TabsTrigger>
            </TabsList>

            {/* ✅ Bulk Create */}
            <TabsContent value="create" className="mt-6">
              <Card className="bg-slate-900 border border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg text-green-400">
                    Bulk Create Users
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Upload an Excel file with columns like:{" "}
                    <code>firstName, lastName, email, courseName</code>.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="text-slate-300 file:bg-slate-800 file:border file:border-slate-700 file:rounded-md file:px-3 file:py-1 file:cursor-pointer"
                    />
                    <Button
                      disabled={!file || loading}
                      onClick={handleSubmit}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Start Upload"
                      )}
                    </Button>
                  </div>

                  {/* ✅ Status message */}
                  {statusMsg && (
                    <p className="mt-4 text-sm text-slate-400">{statusMsg}</p>
                  )}

                  {/* ✅ Preview Table */}
                  {previewData.length > 0 && (
                    <div className="mt-6 overflow-x-auto rounded-lg border border-slate-700">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-800 text-slate-300">
                          <tr>
                            {Object.keys(previewData[0]).map((key) => (
                              <th key={key} className="px-4 py-2">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, idx) => (
                            <tr
                              key={idx}
                              className="border-t border-slate-700 hover:bg-slate-800/60"
                            >
                              {Object.values(row).map((val, i) => (
                                <td key={i} className="px-4 py-2 text-slate-400">
                                  {String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 🗑️ Bulk Delete */}
            <TabsContent value="delete" className="mt-6">
              <Card className="bg-slate-900 border border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg text-red-400">
                    Bulk Delete Users
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Upload an Excel file with a single column:{" "}
                    <code>email</code> to remove users.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="text-slate-300 file:bg-slate-800 file:border file:border-slate-700 file:rounded-md file:px-3 file:py-1 file:cursor-pointer"
                    />
                    <Button
                      disabled={!file || loading}
                      onClick={handleSubmit}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Users"
                      )}
                    </Button>
                  </div>

                  {/* ✅ Status message */}
                  {statusMsg && (
                    <p className="mt-4 text-sm text-slate-400">{statusMsg}</p>
                  )}

                  {/* ✅ Preview Table */}
                  {previewData.length > 0 && (
                    <div className="mt-6 overflow-x-auto rounded-lg border border-slate-700">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-800 text-slate-300">
                          <tr>
                            {Object.keys(previewData[0]).map((key) => (
                              <th key={key} className="px-4 py-2">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, idx) => (
                            <tr
                              key={idx}
                              className="border-t border-slate-700 hover:bg-slate-800/60"
                            >
                              {Object.values(row).map((val, i) => (
                                <td key={i} className="px-4 py-2 text-slate-400">
                                  {String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
