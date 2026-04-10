"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Loader2, Trash2, Upload, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

type Mode = "create" | "delete";
type ParsedRow = Record<string, unknown>;

type ProcessMeta = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
};

const REQUIRED_BY_MODE: Record<Mode, string[]> = {
  create: ["firstName", "lastName", "email"],
  delete: ["email"],
};

const TEMPLATE_COLUMNS: Record<Mode, string[]> = {
  create: ["firstName", "lastName", "email", "password", "role", "courseName", "sectionCode"],
  delete: ["email"],
};

function normalizeCell(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function hasRequiredFields(row: ParsedRow, mode: Mode): boolean {
  const required = REQUIRED_BY_MODE[mode];
  return required.every((field) => normalizeCell(row[field]).length > 0);
}

export default function BulkUserManagementPanel({ actor }: { actor: "admin" | "faculty" }) {
  const [mode, setMode] = useState<Mode>("create");
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);

  const previewRows = useMemo(() => rows.slice(0, 10), [rows]);
  const previewColumns = useMemo(
    () => (previewRows.length > 0 ? Object.keys(previewRows[0]) : TEMPLATE_COLUMNS[mode]),
    [previewRows, mode]
  );

  const processMeta = useMemo<ProcessMeta>(() => {
    if (rows.length === 0) return { totalRows: 0, validRows: 0, invalidRows: 0 };
    const validRows = rows.filter((row) => hasRequiredFields(row, mode)).length;
    return {
      totalRows: rows.length,
      validRows,
      invalidRows: rows.length - validRows,
    };
  }, [rows, mode]);

  const templateText =
    mode === "create"
      ? "Expected columns: firstName, lastName, email, password, role, courseName, sectionCode"
      : "Expected column: email";

  const resetFileState = () => {
    setFile(null);
    setRows([]);
    setStatusMsg("");
    setFileInputKey((key) => key + 1);
  };

  const handleModeChange = (next: string) => {
    const nextMode = next as Mode;
    setMode(nextMode);
    resetFileState();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    setFile(uploaded);
    setStatusMsg("Reading file...");

    try {
      const buffer = await uploaded.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsedRows = XLSX.utils.sheet_to_json<ParsedRow>(firstSheet, { defval: "" });

      setRows(parsedRows);

      if (parsedRows.length === 0) {
        setStatusMsg("File has no rows.");
        return;
      }

      const validRows = parsedRows.filter((row) => hasRequiredFields(row, mode)).length;
      setStatusMsg(
        `Loaded ${parsedRows.length} rows. Valid: ${validRows}, Invalid: ${parsedRows.length - validRows}.`
      );
    } catch (error) {
      console.error("Bulk file parse error", error);
      toast.error("Unable to read this file. Please upload a valid Excel file.");
      setStatusMsg("Unable to parse file.");
      setRows([]);
      setFile(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }

    const endpoint = mode === "create" ? "/api/bulk/user/create" : "/api/bulk/user/delete";

    setLoading(true);
    setStatusMsg("Processing upload...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        const message = data?.error || "Bulk operation failed.";
        toast.error(message);
        setStatusMsg(message);
        return;
      }

      toast.success(data?.message || "Bulk operation completed.");

      const summary = data?.summary
        ? ` Created: ${data.summary.created || 0}, Updated: ${data.summary.updated || 0}, Deleted: ${data.summary.deleted || 0}, Skipped: ${data.summary.skipped || 0}`
        : "";

      setStatusMsg((data?.message || "Bulk operation completed.") + summary);
      resetFileState();
    } catch (error) {
      console.error("Bulk operation error", error);
      toast.error("Server error while processing file.");
      setStatusMsg("Server error while processing file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-border bg-card/80 shadow-2xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">Bulk User Management</CardTitle>
        <CardDescription className="text-muted-foreground">
          {actor === "admin"
            ? "Admin can bulk create or delete users across the platform."
            : "Faculty can bulk create or delete student users for efficient onboarding."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={mode} onValueChange={handleModeChange}>
          <TabsList className="grid w-full grid-cols-2 bg-muted/70">
            <TabsTrigger
              value="create"
              className="text-foreground data-[state=active]:bg-chart-2 data-[state=active]:text-background"
            >
              <Upload className="mr-2 h-4 w-4" /> Bulk Create
            </TabsTrigger>
            <TabsTrigger
              value="delete"
              className="text-foreground data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Bulk Delete
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold text-chart-2">Bulk Create Users</h3>
              <p className="mt-2 text-sm text-muted-foreground">{templateText}</p>
              <BulkUploadForm
                fileInputKey={fileInputKey}
                file={file}
                loading={loading}
                statusMsg={statusMsg}
                previewColumns={previewColumns}
                previewRows={previewRows}
                processMeta={processMeta}
                onFileChange={handleFileChange}
                onSubmit={handleSubmit}
              />
            </div>
          </TabsContent>

          <TabsContent value="delete" className="mt-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold text-destructive">Bulk Delete Users</h3>
              <p className="mt-2 text-sm text-muted-foreground">{templateText}</p>
              <BulkUploadForm
                fileInputKey={fileInputKey}
                file={file}
                loading={loading}
                statusMsg={statusMsg}
                previewColumns={previewColumns}
                previewRows={previewRows}
                processMeta={processMeta}
                onFileChange={handleFileChange}
                onSubmit={handleSubmit}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

type BulkUploadFormProps = {
  fileInputKey: number;
  file: File | null;
  loading: boolean;
  statusMsg: string;
  previewColumns: string[];
  previewRows: ParsedRow[];
  processMeta: ProcessMeta;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onSubmit: () => Promise<void>;
};

function BulkUploadForm({
  fileInputKey,
  file,
  loading,
  statusMsg,
  previewColumns,
  previewRows,
  processMeta,
  onFileChange,
  onSubmit,
}: BulkUploadFormProps) {
  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <label className="w-full md:flex-1">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Excel file (.xlsx, .xls)</span>
          <input
            key={fileInputKey}
            type="file"
            accept=".xlsx,.xls"
            onChange={onFileChange}
            className="w-full cursor-pointer rounded-md border border-border bg-background p-2 text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1"
          />
        </label>

        <Button
          disabled={!file || loading}
          onClick={onSubmit}
          className="w-full md:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Start
            </>
          )}
        </Button>
      </div>

      {statusMsg && <p className="text-sm text-muted-foreground">{statusMsg}</p>}

      {processMeta.totalRows > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatPill title="Rows" value={processMeta.totalRows} />
          <StatPill title="Valid" value={processMeta.validRows} accent="text-chart-2" />
          <StatPill title="Invalid" value={processMeta.invalidRows} accent="text-destructive" />
        </div>
      )}

      {previewRows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                {previewColumns.map((column) => (
                  <th key={column} className="px-4 py-2 font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-border hover:bg-accent/15">
                  {previewColumns.map((column) => (
                    <td key={`${rowIndex}-${column}`} className="px-4 py-2 text-muted-foreground">
                      {normalizeCell(row[column]) || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatPill({ title, value, accent }: { title: string; value: number; accent?: string }) {
  return (
    <div className="rounded-md border border-border bg-background/80 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className={`mt-1 text-xl font-bold text-foreground ${accent || ""}`}>{value}</p>
    </div>
  );
}
