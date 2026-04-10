"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Course = { _id: string; name: string };
type Section = { _id: string; name: string; code: string; course?: Course };
type Faculty = { _id: string; firstName?: string; lastName?: string; email: string; role: string };
type Subject = { _id: string; name: string; code: string };
type Assignment = {
  _id: string;
  facultyUserId?: Faculty;
  course?: Course;
  section?: Section;
};
type SubjectAssignment = {
  _id: string;
  facultyUserId?: Faculty;
  subject?: Subject;
};

export default function ClassSectionManagementPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment[]>([]);

  const [selectedCourse, setSelectedCourse] = useState("");
  const [sectionCode, setSectionCode] = useState("");
  const [sectionName, setSectionName] = useState("");

  const [selectedFacultyUserId, setSelectedFacultyUserId] = useState("");
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  const selectedFacultyAssignments = useMemo(() => {
    if (!selectedFacultyUserId) return assignments;
    return assignments.filter((item) => item.facultyUserId?._id === selectedFacultyUserId);
  }, [assignments, selectedFacultyUserId]);

  const selectedFacultySubjectAssignments = useMemo(() => {
    if (!selectedFacultyUserId) return subjectAssignments;
    return subjectAssignments.filter((item) => item.facultyUserId?._id === selectedFacultyUserId);
  }, [subjectAssignments, selectedFacultyUserId]);

  const loadCourses = async () => {
    const res = await fetch("/api/courses");
    const data = await res.json();
    setCourses(Array.isArray(data) ? data : []);
  };

  const loadFaculties = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    const users = Array.isArray(data) ? data : [];
    setFaculties(users.filter((u: Faculty) => u.role === "faculty"));
  };

  const loadSections = async (courseId?: string) => {
    const query = courseId ? `?courseId=${courseId}` : "";
    const res = await fetch(`/api/admin/sections${query}`);
    const data = await res.json();
    setSections(Array.isArray(data?.sections) ? data.sections : []);
  };

  const loadSubjects = async () => {
    const res = await fetch("/api/subject");
    const data = await res.json();
    setSubjects(Array.isArray(data) ? data : []);
  };

  const loadSubjectAssignments = async () => {
    const res = await fetch("/api/admin/faculty-subject-assignments");
    const data = await res.json();
    setSubjectAssignments(Array.isArray(data?.assignments) ? data.assignments : []);
  };

  const loadAssignments = async () => {
    const res = await fetch("/api/admin/faculty-assignments");
    const data = await res.json();
    setAssignments(Array.isArray(data?.assignments) ? data.assignments : []);
  };

  useEffect(() => {
    Promise.all([loadCourses(), loadFaculties(), loadAssignments(), loadSubjects(), loadSubjectAssignments()]).catch((err) =>
      console.error("Admin class-section init load error", err)
    );
  }, []);

  useEffect(() => {
    if (!selectedCourse) {
      setSections([]);
      setSelectedSectionIds([]);
      return;
    }
    loadSections(selectedCourse).catch((err) =>
      console.error("Section load error", err)
    );
    setSelectedSectionIds([]);
  }, [selectedCourse]);

  const handleCreateSection = async () => {
    if (!selectedCourse || !sectionCode.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course: selectedCourse,
          code: sectionCode.trim().toUpperCase(),
          name: sectionName.trim() || `Section ${sectionCode.trim().toUpperCase()}`,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to create section");
      }
      setSectionCode("");
      setSectionName("");
      await loadSections(selectedCourse);
    } catch (err) {
      console.error(err);
      alert("Unable to create section.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Delete this section?")) return;
    const res = await fetch(`/api/admin/sections/${sectionId}`, { method: "DELETE" });
    if (res.ok) {
      await Promise.all([loadSections(selectedCourse), loadAssignments()]);
    }
  };

  const handleAssignFaculty = async () => {
    if (!selectedCourse || !selectedFacultyUserId || selectedSectionIds.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/faculty-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facultyUserId: selectedFacultyUserId,
          course: selectedCourse,
          sections: selectedSectionIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to assign sections");
      }

      setSelectedSectionIds([]);
      await loadAssignments();
    } catch (err) {
      console.error(err);
      alert("Unable to assign sections.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Remove this faculty assignment?")) return;
    const res = await fetch(`/api/admin/faculty-assignments/${assignmentId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await loadAssignments();
    }
  };

  const handleAssignSubjects = async () => {
    if (!selectedFacultyUserId || selectedSubjectIds.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/faculty-subject-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facultyUserId: selectedFacultyUserId,
          subjects: selectedSubjectIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to assign subjects");
      }

      setSelectedSubjectIds([]);
      await loadSubjectAssignments();
    } catch (err) {
      console.error(err);
      alert("Unable to assign subjects.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubjectAssignment = async (assignmentId: string) => {
    if (!confirm("Remove this subject assignment?")) return;
    const res = await fetch(`/api/admin/faculty-subject-assignments/${assignmentId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await loadSubjectAssignments();
    }
  };

  return (
    <div className="min-h-screen aurora-page p-4 sm:p-6 md:p-8 text-foreground">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Class & Section Assignment</h1>
        <Link href="/admin">
          <Button variant="outline" className="border-border bg-card hover:bg-accent/20">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold">Create Sections</h2>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course._id} value={course._id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={sectionCode}
              onChange={(e) => setSectionCode(e.target.value)}
              placeholder="Section code (A/B/C)"
            />
            <Input
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="Section name (optional)"
            />
          </div>

          <Button
            onClick={handleCreateSection}
            disabled={!selectedCourse || !sectionCode.trim() || loading}
            className="bg-primary text-primary-foreground hover:bg-primary/85"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Section
          </Button>

          <div className="space-y-2">
            {sections.map((section) => (
              <div key={section._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium">{section.name}</p>
                  <p className="text-xs text-muted-foreground">Code: {section.code}</p>
                </div>
                <Button
                  variant="outline"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteSection(section._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {selectedCourse && sections.length === 0 && (
              <p className="text-sm text-muted-foreground">No sections created for this class yet.</p>
            )}
          </div>
        </div>

        <div className="panel rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold">Assign Class Sections to Faculty</h2>

          <Select value={selectedFacultyUserId} onValueChange={setSelectedFacultyUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select faculty" />
            </SelectTrigger>
            <SelectContent>
              {faculties.map((faculty) => (
                <SelectItem key={faculty._id} value={faculty._id}>
                  {`${faculty.firstName || ""} ${faculty.lastName || ""}`.trim() || faculty.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="rounded-lg border border-border p-3 space-y-2">
            {!selectedCourse ? (
              <p className="text-sm text-muted-foreground">Select class first to choose sections.</p>
            ) : sections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sections available in this class.</p>
            ) : (
              sections.map((section) => {
                const checked = selectedSectionIds.includes(section._id);
                return (
                  <label key={section._id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setSelectedSectionIds((prev) =>
                          isChecked
                            ? [...prev, section._id]
                            : prev.filter((id) => id !== section._id)
                        );
                      }}
                    />
                    <span>{section.name} ({section.code})</span>
                  </label>
                );
              })
            )}
          </div>

          <Button
            onClick={handleAssignFaculty}
            disabled={!selectedCourse || !selectedFacultyUserId || selectedSectionIds.length === 0 || loading}
            className="bg-primary text-primary-foreground hover:bg-primary/85"
          >
            Save Faculty Assignment
          </Button>

          <div className="space-y-2">
            {selectedFacultyAssignments.map((assignment) => (
              <div key={assignment._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium">
                    {`${assignment.facultyUserId?.firstName || ""} ${assignment.facultyUserId?.lastName || ""}`.trim() || assignment.facultyUserId?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.course?.name} • {assignment.section?.name} ({assignment.section?.code})
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteAssignment(assignment._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {selectedFacultyAssignments.length === 0 && (
              <p className="text-sm text-muted-foreground">No assignments found for this filter.</p>
            )}
          </div>
        </div>

        <div className="panel rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold">Assign Subjects to Faculty</h2>

          <Select value={selectedFacultyUserId} onValueChange={setSelectedFacultyUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select faculty" />
            </SelectTrigger>
            <SelectContent>
              {faculties.map((faculty) => (
                <SelectItem key={faculty._id} value={faculty._id}>
                  {`${faculty.firstName || ""} ${faculty.lastName || ""}`.trim() || faculty.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="rounded-lg border border-border p-3 space-y-2">
            {subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects available.</p>
            ) : (
              subjects.map((subject) => {
                const checked = selectedSubjectIds.includes(subject._id);
                return (
                  <label key={subject._id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setSelectedSubjectIds((prev) =>
                          isChecked
                            ? [...prev, subject._id]
                            : prev.filter((id) => id !== subject._id)
                        );
                      }}
                    />
                    <span>{subject.name} ({subject.code})</span>
                  </label>
                );
              })
            )}
          </div>

          <Button
            onClick={handleAssignSubjects}
            disabled={!selectedFacultyUserId || selectedSubjectIds.length === 0 || loading}
            className="bg-primary text-primary-foreground hover:bg-primary/85"
          >
            Save Subject Assignment
          </Button>

          <div className="space-y-2">
            {selectedFacultySubjectAssignments.map((assignment) => (
              <div key={assignment._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium">
                    {`${assignment.facultyUserId?.firstName || ""} ${assignment.facultyUserId?.lastName || ""}`.trim() || assignment.facultyUserId?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.subject?.name} ({assignment.subject?.code})
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteSubjectAssignment(assignment._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {selectedFacultySubjectAssignments.length === 0 && (
              <p className="text-sm text-muted-foreground">No subject assignments found for this filter.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
