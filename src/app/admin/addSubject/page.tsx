"use client";

import { useEffect, useState } from "react";
import { Trash2, BookOpen, ArrowLeft, PlusCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Link from "next/link";

type Subject = {
  _id: string;
  name: string;
  code: string;
  topics: string[];
  faculty: {
    _id: string;
    name: string;
    email: string;
    department: string;
  } | null;
};

type Faculty = {
  _id: string;
  name: string;
  email: string;
  department: string;
};

export default function AddSubjectPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [search, setSearch] = useState("");

  // Load subjects + faculties
  useEffect(() => {
    fetch("/api/subject")
      .then((res) => res.json())
      .then(setSubjects)
      .catch(console.error);

    fetch("/api/faculty")
      .then((res) => res.json())
      .then(setFaculties)
      .catch(console.error);
  }, []);

  // Add topic
  const handleAddTopic = () => {
    const trimmed = newTopic.trim();
    if (trimmed && !topics.includes(trimmed)) setTopics((prev) => [...prev, trimmed]);
    setNewTopic("");
  };

  // Remove topic
  const handleRemoveTopic = (topic: string) => {
    setTopics((prev) => prev.filter((t) => t !== topic));
  };

  // Add new subject
  const handleAddSubject = async () => {
    if (!subjectName || !subjectCode || !selectedFaculty) return;

    const finalTopics = newTopic.trim() ? [...topics, newTopic.trim()] : topics;

    const res = await fetch("/api/subject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: subjectName,
        code: subjectCode,
        topics: finalTopics,
        faculty: selectedFaculty,
      }),
    });

    if (res.ok) {
      const newSubject = await res.json();
      setSubjects((prev) => [...prev, newSubject]);
      setSubjectName("");
      setSubjectCode("");
      setSelectedFaculty("");
      setTopics([]);
      setNewTopic("");
    }
  };

  // Delete subject
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/subject/${id}`, { method: "DELETE" });
    if (res.ok) setSubjects((prev) => prev.filter((s) => s._id !== id));
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.topics.join(", ").toLowerCase().includes(search.toLowerCase()) ||
      s.faculty?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen aurora-page p-4 md:p-8 text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-primary">
          <BookOpen className="w-6 h-6 text-primary" /> Manage Subjects
        </h1>
        <Link href="/admin">
          <Button className="flex items-center gap-2 bg-primary hover:bg-primary/85 w-full md:w-auto text-primary-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-3 mb-8 w-full">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <Input
            placeholder="Enter subject name"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            className="flex-1 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          <Input
            placeholder="Enter subject code"
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value)}
            className="flex-1 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />

          <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
            <SelectTrigger className="w-full sm:w-60 bg-background border border-border text-foreground focus:ring-2 focus:ring-ring">
              <SelectValue placeholder="Assign Faculty" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border text-popover-foreground">
              {faculties.map((f) => (
                <SelectItem key={f._id} value={f._id}>
                  {f.name} ({f.department})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          
        </div>

        {/* Topics Input */}
        <div className="flex flex-col gap-2 mt-3">
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="Add topic"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTopic()}
              className="flex-1 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <Button
              onClick={handleAddTopic}
              className="bg-primary hover:bg-primary/85 text-primary-foreground flex items-center justify-center"
            >
              <PlusCircle className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {topics.map((t, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-muted text-sm rounded-full flex items-center gap-2"
              >
                {t}
                <X
                  className="w-3 h-3 cursor-pointer text-red-400"
                  onClick={() => handleRemoveTopic(t)}
                />
              </span>
            ))}
          </div>
        </div>
      </div>
            <Button
            onClick={handleAddSubject}
            className="bg-primary hover:bg-primary/85 text-primary-foreground cursor-pointer w-full sm:w-auto flex items-center gap-2 justify-center mb-6"
          >
            <PlusCircle className="w-4 h-4" /> Add Subject
          </Button>

      {/* Search */}
      <Input
        placeholder="Search subjects..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-64 mb-4 bg-background border border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
      />

      {/* Subjects Table */}
      <div className="panel overflow-x-auto rounded-lg shadow-lg">
        <table className="w-full text-foreground">
          <thead className="bg-card text-sm text-muted-foreground">
            <tr>
              <th className="py-3 px-4 text-left">Code</th>
              <th className="py-3 px-4 text-left">Subject</th>
              <th className="py-3 px-4 text-left">Topics</th>
              <th className="py-3 px-4 text-left">Faculty</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredSubjects.map((s, idx) => (
              <tr
                key={s._id}
                className={`${
                  idx % 2 === 0 ? "bg-card/75" : "bg-card/55"
                } transition hover:bg-accent/15`}
              >
                <td className="py-3 px-4 text-muted-foreground">{s.code}</td>
                <td className="py-3 px-4 font-medium text-foreground">{s.name}</td>
                <td className="py-3 px-4 text-muted-foreground">
                  {s.topics?.length ? s.topics.join(", ") : "—"}
                </td>
                <td className="py-3 px-4 text-muted-foreground">{s.faculty?.name || "—"}</td>
                <td className="py-3 px-4 text-right">
                  <button
                    className="text-red-500 hover:text-red-400 transition"
                    onClick={() => handleDelete(s._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredSubjects.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-muted-foreground">
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
