"use client";

import { useEffect, useState } from "react";
import { UserPlus, Trash2,ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Faculty = {
  _id: string;
  name: string;
  email: string;
  department: string;
};

type Department = {
  _id: string;
  name: string;
};

export default function AddFacultyPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");

  // Load faculties
  useEffect(() => {
    fetch("/api/faculty")
      .then((res) => res.json())
      .then(setFaculties);
  }, []);

  // Load departments
  useEffect(() => {
    fetch("/api/department")
      .then((res) => res.json())
      .then(setDepartments);
  }, []);

  const handleAdd = async () => {
    if (!name || !email || !department) return;
    const res = await fetch("/api/faculty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, department }),
    });
    if (res.ok) {
      const newFaculty = await res.json();
      setFaculties((prev) => [...prev, newFaculty]);
      setName("");
      setEmail("");
      setDepartment("");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/faculty/${id}`, { method: "DELETE" });
    if (res.ok) {
      setFaculties((prev) => prev.filter((f) => f._id !== id));
    }
  };

  return (
    <div className=" mx-auto p-6 bg-gray-950 min-h-screen text-gray-100">
      {/* Header + Back */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-400 ml-2">
          <UserPlus className="w-6 h-6 text-teal-400" /> Manage Faculties
        </h1>
        <Link href="/admin" className="w-full md:w-auto">
          <Button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Form */}
      <div className="flex gap-3 mb-8 flex-wrap mt-10">
        <Input
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
        />
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
        />
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-40 bg-gray-900 border-gray-700 text-white">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border border-gray-700 text-gray-100">
            {departments.map((d) => (
              <SelectItem key={d._id} value={d.name}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
        >
          Add
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-800 shadow">
        <table className="w-full">
          <thead className="bg-gray-900 text-sm text-gray-400">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Department</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {faculties.map((f, idx) => (
              <tr
                key={f._id}
                className={`border-t border-gray-800 ${
                  idx % 2 === 0 ? "bg-gray-950" : "bg-gray-900"
                }`}
              >
                <td className="py-3 px-4 font-medium text-gray-100">
                  {f.name}
                </td>
                <td className="py-3 px-4 text-gray-300">{f.email}</td>
                <td className="py-3 px-4 text-gray-300">{f.department}</td>
                <td className="py-3 px-4 text-right">
                  <button
                    className="text-red-500 hover:text-red-400 transition"
                    onClick={() => handleDelete(f._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
