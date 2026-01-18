"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

type Course = {
  _id: string;
  name: string;
//   courseId: string;
  description?: string;
};

export default function ManageCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [name, setName] = useState("");
//   const [courseId, setCourseId] = useState("");
  const [description, setDescription] = useState("");

  // Load courses
  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then(setCourses)
      .catch((err) => console.error(err));
  }, []);

  // Add new course
  const handleAdd = async () => {
    if (!name) return;
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    if (res.ok) {
      const newCourse = await res.json();
      setCourses((prev) => [...prev, newCourse]);
      setName("");
    //   setCourseId("");
      setDescription("");
    }
  };

  // Delete course
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCourses(courses.filter((c) => c._id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-blue-100">
      {/* Header + Back Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-blue-400">
          <GraduationCap className="w-6 h-6 text-blue-500" /> Manage Courses
        </h1>
        <Link href="/admin">
          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Add Course Form */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full">
        <Input
          placeholder="Course Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-slate-900 text-blue-100 placeholder-blue-300 border-blue-800"
        />
        {/* <Input
          placeholder="Course ID"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="w-full sm:w-36 bg-slate-900 text-blue-100 placeholder-blue-300 border-blue-800"
        /> */}
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex-1 bg-slate-900 text-blue-100 placeholder-blue-300 border-blue-800"
        />
        <Button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto font-semibold"
        >
          Add
        </Button>
      </div>

      {/* Courses Table */}
      <div className="overflow-x-auto rounded-lg shadow-lg border border-blue-900 bg-slate-900">
        <table className="w-full text-left text-blue-100">
          <thead className="text-sm text-blue-300 border-b border-blue-800">
            <tr>
              <th className="py-3 px-4">Name</th>
              {/* <th className="py-3 px-4">Course ID</th> */}
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-900">
            {courses.length > 0 ? (
              courses.map((c) => (
                <tr key={c._id} className="hover:bg-slate-800 transition">
                  <td className="py-3 px-4 font-medium">{c.name}</td>
                  {/* <td className="py-3 px-4">{c.courseId}</td> */}
                  <td className="py-3 px-4 text-sm text-blue-300">
                    {c.description || "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(c._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-6 text-blue-400 italic"
                >
                  No courses added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
