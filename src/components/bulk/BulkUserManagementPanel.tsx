"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Loader2, Trash2, Upload, FileSpreadsheet, Plus, UserPlus, Eraser } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Mode = "create" | "delete";
type Actor = "admin" | "faculty";
type ParsedRow = Record<string, unknown>;

type ProcessMeta = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
};

type ManualCreateRow = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type AssignmentOption = {
  key: string;
  courseId: string;
  courseName: string;
  sectionId: string;
  sectionLabel: string;
};

const REQUIRED_BY_MODE: Record<Mode, string[]> = {
  create: ["firstName", "lastName", "email"],
  delete: ["email"],
};

const TEMPLATE_COLUMNS: Record<Actor, Record<Mode, string[]>> = {
  admin: {
    create: ["firstName", "lastName", "email", "password"],
    delete: ["email"],
  },
  faculty: {
    create: ["firstName", "lastName", "email", "password", "courseName", "sectionCode"],
    delete: ["email"],
  },
};

const emptyManualRow = (): ManualCreateRow => ({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
});

function normalizeCell(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function hasRequiredFields(row: ParsedRow, mode: Mode): boolean {
  const required = REQUIRED_BY_MODE[mode];
  return required.every((field) => normalizeCell(row[field]).length > 0);
}

function parseEmails(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(/[\n,;]+/)
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length > 0)
    )
  );
}

function getManualValidRows(rows: ManualCreateRow[]): ManualCreateRow[] {
  return rows.filter((row) => row.firstName.trim() && row.lastName.trim() && row.email.trim());
}

export default function BulkUserManagementPanel({ actor }: { actor: Actor }) {
  const [mode, setMode] = useState<Mode>("create");
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [manualRows, setManualRows] = useState<ManualCreateRow[]>([emptyManualRow()]);
  const [manualDeleteEmails, setManualDeleteEmails] = useState("");
  const [assignmentOptions, setAssignmentOptions] = useState<AssignmentOption[]>([]);
  const [selectedAssignmentKey, setSelectedAssignmentKey] = useState("");

  const previewRows = useMemo(() => rows.slice(0, 10), [rows]);
  const previewColumns = useMemo(
    () => (previewRows.length > 0 ? Object.keys(previewRows[0]) : TEMPLATE_COLUMNS[actor][mode]),
    [previewRows, actor, mode]
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

  const manualValidRows = useMemo(() => getManualValidRows(manualRows), [manualRows]);

  const templateText =
    mode === "create"
      ? actor === "admin"
        ? "Expected columns: firstName, lastName, email, password(optional). Created accounts are faculty users."
        : "Expected columns: firstName, lastName, email, password(optional), courseName, sectionCode. Created accounts are student users."
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
    setStatusMsg("");
  };

  useEffect(() => {
    const fetchAssignments = async () => {
      if (actor !== "faculty") return;

      try {
        const res = await fetch("/api/admin/faculty-assignments");
        const data = await res.json();
        const assignments = Array.isArray(data?.assignments) ? data.assignments : [];
        const mapped = assignments
          .map((item: any) => {
            const courseId = String(item?.course?._id || "");
            const courseName = String(item?.course?.name || "");
            const sectionId = String(item?.section?._id || "");
            const sectionName = String(item?.section?.name || "Section");
            const sectionCode = String(item?.section?.code || "");
            if (!courseId || !sectionId) return null;
            return {
              key: `${courseId}|${sectionId}`,
              courseId,
              courseName,
              sectionId,
              sectionLabel: `${courseName} - ${sectionName} (${sectionCode})`,
            } as AssignmentOption;
          })
          .filter((item: AssignmentOption | null): item is AssignmentOption => Boolean(item));

        const unique = Array.from(new Map(mapped.map((item) => [item.key, item])).values());
        setAssignmentOptions(unique);
        if (unique.length > 0) {
          setSelectedAssignmentKey(unique[0].key);
        }
      } catch (error) {
        console.error("Failed to load faculty assignments", error);
      }
    };

    fetchAssignments();
  }, [actor]);

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
        ? ` Created: ${data.summary.created || 0}, Updated: ${data.summary.updated || 0}, Deleted: ${data.summary.deleted || data.summary.deletedCount || 0}, Skipped: ${data.summary.skipped || 0}`
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

  const handleAddManualRow = () => {
    setManualRows((prev) => [...prev, emptyManualRow()]);
  };

  const handleRemoveManualRow = (index: number) => {
    setManualRows((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length > 0 ? next : [emptyManualRow()];
    });
  };

  const handleManualRowChange = (index: number, field: keyof ManualCreateRow, value: string) => {
    setManualRows((prev) => prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row)));
  };

  const handleManualCreateSubmit = async () => {
    const validRows = getManualValidRows(manualRows);
    if (actor === "faculty" && assignmentOptions.length === 0) {
      toast.error("No class-section assignment found. Ask admin to assign class-section first.");
      return;
    }

    if (validRows.length === 0) {
      toast.error("Please fill at least one valid row (firstName, lastName, email).");
      return;
    }

    let selectedAssignment: AssignmentOption | undefined;
    if (actor === "faculty") {
      selectedAssignment = assignmentOptions.find((item) => item.key === selectedAssignmentKey);
      if (!selectedAssignment) {
        toast.error("Please select an assigned class-section before creating students.");
        return;
      }
    }

    setLoading(true);
    setStatusMsg("Creating users manually...");

    try {
      const payload = {
        users: validRows.map((row) => ({
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          email: row.email.trim().toLowerCase(),
          password: row.password.trim(),
          course: selectedAssignment?.courseId,
          section: selectedAssignment?.sectionId,
        })),
      };

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Manual creation failed.");
        setStatusMsg(data?.error || "Manual creation failed.");
        return;
      }

      const created = data?.summary?.created ?? 0;
      const skipped = data?.summary?.skipped ?? 0;
      const msg = `Manual create complete. Created: ${created}, Skipped: ${skipped}.`;
      toast.success(msg);
      setStatusMsg(msg);
      setManualRows([emptyManualRow()]);
    } catch (error) {
      console.error("Manual create error", error);
      toast.error("Server error while creating users manually.");
      setStatusMsg("Server error while creating users manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualDeleteSubmit = async () => {
    const emails = parseEmails(manualDeleteEmails);
    if (emails.length === 0) {
      toast.error("Please add at least one email for deletion.");
      return;
    }

    setLoading(true);
    setStatusMsg("Deleting users manually...");

    try {
      const res = await fetch("/api/users/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Manual delete failed.");
        setStatusMsg(data?.error || "Manual delete failed.");
        return;
      }

      const deleted = data?.summary?.deletedCount ?? 0;
      const skipped = data?.summary?.skipped ?? 0;
      const msg = `Manual delete complete. Deleted: ${deleted}, Skipped: ${skipped}.`;
      toast.success(msg);
      setStatusMsg(msg);
      setManualDeleteEmails("");
    } catch (error) {
      console.error("Manual delete error", error);
      toast.error("Server error while deleting users manually.");
      setStatusMsg("Server error while deleting users manually.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-border bg-card/80 shadow-2xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">User Management</CardTitle>
        <CardDescription className="text-muted-foreground">
          {actor === "admin"
            ? "Admin can create and delete faculty users (bulk or manual)."
            : "Faculty can create and delete students (bulk or manual) in assigned class-sections."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={mode} onValueChange={handleModeChange}>
          <TabsList className="grid w-full grid-cols-2 bg-muted/70">
            <TabsTrigger
              value="create"
              className="text-foreground data-[state=active]:bg-chart-2 data-[state=active]:text-background"
            >
              <Upload className="mr-2 h-4 w-4" /> Create
            </TabsTrigger>
            <TabsTrigger
              value="delete"
              className="text-foreground data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6 space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold text-chart-2">Bulk Create</h3>
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

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-primary">Manual Create (1 or many)</h3>
                <Button type="button" variant="outline" onClick={handleAddManualRow}>
                  <Plus className="mr-2 h-4 w-4" /> Add Row
                </Button>
              </div>

              {actor === "faculty" && (
                <div className="mt-4">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Assigned Class-Section</p>
                  <Select value={selectedAssignmentKey} onValueChange={setSelectedAssignmentKey}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class-section" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignmentOptions.map((option) => (
                        <SelectItem key={option.key} value={option.key}>
                          {option.sectionLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="mt-4 space-y-3">
                {manualRows.map((row, index) => (
                  <div key={index} className="grid gap-2 rounded-lg border border-border/70 bg-background/60 p-3 md:grid-cols-12">
                    <Input
                      value={row.firstName}
                      onChange={(e) => handleManualRowChange(index, "firstName", e.target.value)}
                      placeholder="First name"
                      className="md:col-span-2"
                    />
                    <Input
                      value={row.lastName}
                      onChange={(e) => handleManualRowChange(index, "lastName", e.target.value)}
                      placeholder="Last name"
                      className="md:col-span-2"
                    />
                    <Input
                      value={row.email}
                      onChange={(e) => handleManualRowChange(index, "email", e.target.value)}
                      placeholder="Email"
                      className="md:col-span-4"
                    />
                    <Input
                      value={row.password}
                      onChange={(e) => handleManualRowChange(index, "password", e.target.value)}
                      placeholder="Password (optional)"
                      className="md:col-span-3"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="md:col-span-1"
                      onClick={() => handleRemoveManualRow(index)}
                    >
                      <Eraser className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Ready rows: {manualValidRows.length} / {manualRows.length}. Default password is password123 when blank.
                </p>
                <Button disabled={loading} onClick={handleManualCreateSubmit}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />} Create Users
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="delete" className="mt-6 space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold text-destructive">Bulk Delete</h3>
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

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold text-destructive">Manual Delete (1 or many)</h3>
              <p className="mt-2 text-sm text-muted-foreground">Enter one or more emails separated by comma or new line.</p>
              <textarea
                value={manualDeleteEmails}
                onChange={(e) => setManualDeleteEmails(e.target.value)}
                rows={6}
                className="mt-3 w-full rounded-md border border-border bg-background p-3 text-sm"
                placeholder="student1@example.com\nstudent2@example.com"
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">Parsed emails: {parseEmails(manualDeleteEmails).length}</p>
                <Button variant="destructive" disabled={loading} onClick={handleManualDeleteSubmit}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete Users
                </Button>
              </div>
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

        <Button disabled={!file || loading} onClick={onSubmit} className="w-full md:w-auto">
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
