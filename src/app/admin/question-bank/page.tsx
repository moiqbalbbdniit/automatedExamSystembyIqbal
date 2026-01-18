/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  PlusCircle,
  Edit3,
  Trash2,
  BookOpen,
  Upload,
  ArrowLeft,
  X,
  Loader2,
  Eye
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";




type Subject = {
  _id: string;
  name: string;
  code: string;
  topics: string[];
  faculty: { _id: string; name: string; email: string; department: string } | null;
};

type Faculty = {
  _id: string;
  name: string;
  email: string;
  department: string;
};

type ExtractedData = {
  
  subjectCode: string;
  subjectName: string;
  topics: string[];
};

export default function QuestionBankPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [search, setSearch] = useState("");

  // Upload & extraction states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  // Review dialog states
  const [reviewName, setReviewName] = useState("");
  const [reviewCode, setReviewCode] = useState("");
  const [reviewTopics, setReviewTopics] = useState<string[]>([]);
  const [reviewFacultyId, setReviewFacultyId] = useState("");
  const [newReviewTopic, setNewReviewTopic] = useState("");

  // Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editFacultyId, setEditFacultyId] = useState("");
  const [editTopics, setEditTopics] = useState<string[]>([]);
  const [newEditTopic, setNewEditTopic] = useState("");

  useEffect(() => {
    fetch("/api/subject").then(res => res.json()).then(setSubjects).catch(console.error);
    fetch("/api/faculty").then(res => res.json()).then(setFaculties).catch(console.error);
  }, []);

  // ----------------------------
  // 📘 PDF Upload + Extraction
  // ----------------------------

const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadedFileName(file.name);
        setIsUploading(true);
        setIsReviewOpen(false); // Close review if open

        const formData = new FormData();
        formData.append('pdfFile', file);

        try {
            const res = await fetch("/api/extract-pdf", {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Extraction failed on server.");
            }

            const extractedData: ExtractedData = await res.json();
            console.log("Data received on frontend:", extractedData);
            
            // Set review states with extracted data
            setReviewName(extractedData.subjectName);
            setReviewCode(extractedData.subjectCode);
            setReviewTopics(extractedData.topics);
            setReviewFacultyId(""); // Reset faculty selection
            setNewReviewTopic("");
            setIsReviewOpen(true); // Open the review dialog

        } catch (err) {
            console.error("PDF extraction failed:", err);
            alert(`Extraction failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = ""; // Reset file input
        }
    };

  // Add / remove topics in review
  const handleAddReviewTopic = () => {
    const trimmed = newReviewTopic.trim();
    if (trimmed && !reviewTopics.includes(trimmed)) {
      setReviewTopics(prev => [...prev, trimmed]);
    }
    setNewReviewTopic("");
  };
  const handleRemoveReviewTopic = (topic: string) => {
    setReviewTopics(prev => prev.filter(t => t !== topic));
  };

  // Publish new subject
  const handlePublishSubject = async () => {
    if (!reviewName || !reviewCode || !reviewFacultyId) return;
    const res = await fetch("/api/subject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: reviewName,
        code: reviewCode,
        topics: reviewTopics,
        faculty: reviewFacultyId,
      }),
    });
    if (res.ok) {
      const newSub = await res.json();
      setSubjects(prev => [...prev, newSub]);
      setIsReviewOpen(false);
      setUploadedFile(null);
      setExtractedData(null);
    }
  };

  // Edit handlers
  const handleEditClick = (s: Subject) => {
    setEditingSubject(s);
    setEditName(s.name);
    setEditCode(s.code);
    setEditFacultyId(s.faculty?._id || "");
    setEditTopics([...s.topics]);
    setIsEditOpen(true);
  };
  const handleAddEditTopic = () => {
    const trimmed = newEditTopic.trim();
    if (trimmed && !editTopics.includes(trimmed)) setEditTopics([...editTopics, trimmed]);
    setNewEditTopic("");
  };
  const handleRemoveEditTopic = (t: string) => setEditTopics(editTopics.filter(x => x !== t));
  const handleSaveEdit = async () => {
    if (!editingSubject) return;
    const res = await fetch(`/api/subject/${editingSubject._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        code: editCode,
        topics: editTopics,
        faculty: editFacultyId || null,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSubjects(prev => prev.map(s => (s._id === updated._id ? updated : s)));
      setIsEditOpen(false);
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subject?")) return;
    const res = await fetch(`/api/subject/${id}`, { method: "DELETE" });
    if (res.ok) setSubjects(subjects.filter(s => s._id !== id));
  };

  const filtered = subjects.filter(s =>
    [s.name, s.code, s.faculty?.name, s.topics.join(",")]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // --------------------------------
  // Render
  // --------------------------------
  return (
    <div className="p-4 md:p-6 bg-gray-950 min-h-screen text-gray-100 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-400">
          <BookOpen className="w-6 h-6 text-teal-400" /> Question Bank & Subjects
        </h1>
        <Link href="/admin">
          <Button className="bg-blue-600 hover:bg-blue-700 flex gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
      </div>

      {/* Upload section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer bg-gray-900 hover:bg-gray-800 text-gray-100 w-full sm:w-auto">
          <Upload className="w-4 h-4 text-blue-400" />
          <span>{isUploading ? "Extracting..." : "Upload Question Bank (PDF)"}</span>
          <input type="file" accept="application/pdf" hidden onChange={handleUpload} />
        </label>
        {isUploading && <Loader2 className="animate-spin text-blue-400" />}
      {uploadedFileName && !isUploading && (
    <span className="text-sm text-gray-400">
        Ready to review: {uploadedFileName} 
    </span>
)}
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-blue-500 flex gap-2 items-center">
              <Eye className="w-4 h-4" /> Review Extracted Subject
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
           
            <Input
              placeholder="Subject Code"
              value={reviewCode}
              onChange={(e) => setReviewCode(e.target.value)}
              className="bg-gray-800 border-gray-700"
            />


             <Input
              placeholder="Subject Name"
              value={reviewName}
              onChange={(e) => setReviewName(e.target.value)}
              className="bg-gray-800 border-gray-700"
            />

            <Select value={reviewFacultyId} onValueChange={setReviewFacultyId}>
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue placeholder="Assign Faculty"  className="text-white"/>
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-white">
                {faculties.map(f => (
                  <SelectItem key={f._id} value={f._id}>
                    {f.name} ({f.department})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Topics */}
            <div>
              <p className="text-sm font-medium text-gray-300">Topics:</p>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add topic"
                  value={newReviewTopic}
                  onChange={(e) => setNewReviewTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddReviewTopic()}
                  className="bg-gray-800 border-gray-700 flex-1"
                />
                <Button onClick={handleAddReviewTopic} className="bg-blue-600 hover:bg-blue-700">
                  <PlusCircle className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 max-h-28 overflow-y-auto">
                {reviewTopics.map((t, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gray-800 border border-blue-600 text-sm rounded-full flex items-center gap-2"
                  >
                    {t}
                    <X className="w-3 h-3 text-red-400 cursor-pointer" onClick={() => handleRemoveReviewTopic(t)} />
                  </span>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReviewOpen(false)}
              className="bg-gray-800 border-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublishSubject}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!reviewName || !reviewCode || !reviewFacultyId || reviewTopics.length === 0}
            >
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <Input
        placeholder="Search subjects..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-gray-900 border-gray-700 w-full md:w-72"
      />

      {/* Subjects Table */}
      <div className="overflow-x-auto bg-gray-900 rounded-lg border border-gray-800 mt-4">
        <table className="w-full text-left">
          <thead className="text-gray-400 text-sm border-b border-gray-800">
            <tr>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Topics</th>
              <th className="py-3 px-4">Faculty</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map((s, idx) => (
              <tr key={s._id} className={idx % 2 ? "bg-gray-950" : ""}>
                <td className="py-3 px-4 text-gray-300">{s.code}</td>
                <td className="py-3 px-4 text-gray-100 font-medium">{s.name}</td>
                <td className="py-3 px-4 text-gray-400 truncate">{s.topics?.join(", ")}</td>
                <td className="py-3 px-4 text-gray-300">{s.faculty?.name || "—"}</td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button onClick={() => handleEditClick(s)} className="text-blue-500 hover:text-blue-400">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(s._id)} className="text-red-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  No subjects found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
