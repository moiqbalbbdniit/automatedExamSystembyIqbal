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
    <div className="mx-auto p-6 min-h-screen aurora-page text-foreground">
      {/* Header + Back */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-primary ml-2">
          <UserPlus className="w-6 h-6 text-chart-2" /> Manage Faculties
        </h1>
        <Link href="/admin" className="w-full md:w-auto">
          <Button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/85 text-primary-foreground">
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
          className="bg-background border-border text-foreground placeholder:text-muted-foreground"
        />
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-background border-border text-foreground placeholder:text-muted-foreground"
        />
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-40 bg-background border-border text-foreground">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border text-popover-foreground">
            {departments.map((d) => (
              <SelectItem key={d._id} value={d.name}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleAdd}
          className="bg-primary hover:bg-primary/85 text-primary-foreground shadow-md"
        >
          Add
        </Button>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-card text-sm text-muted-foreground">
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
                className={`border-t border-border ${
                  idx % 2 === 0 ? "bg-card/75" : "bg-card/55"
                }`}
              >
                <td className="py-3 px-4 font-medium text-foreground">
                  {f.name}
                </td>
                <td className="py-3 px-4 text-muted-foreground">{f.email}</td>
                <td className="py-3 px-4 text-muted-foreground">{f.department}</td>
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
