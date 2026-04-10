"use client";

import { useEffect, useState } from "react";
import { Building2, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

type Department = {
  _id: string;
  name: string;
  code: string;
};

export default function AddDepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  // Load departments
  useEffect(() => {
    fetch("/api/department")
      .then((res) => res.json())
      .then(setDepartments)
      .catch((err) => console.error(err));
  }, []);

  const handleAdd = async () => {
    if (!name || !code) return;
    const res = await fetch("/api/department", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code }),
    });
    if (res.ok) {
      const newDept = await res.json();
      setDepartments((prev) => [...prev, newDept]);
      setName("");
      setCode("");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/department/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDepartments(departments.filter((d) => d._id !== id));
    }
  };

  return (
    <div className="min-h-screen aurora-page p-4 md:p-8 text-foreground">
      {/* Header + Back Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-primary">
          <Building2 className="w-6 h-6 text-primary" /> Manage Departments
        </h1>
        <Link href="/admin">
          <Button className="flex items-center gap-2 bg-primary hover:bg-primary/85 w-full md:w-auto cursor-pointer text-primary-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Form */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full">
        <Input
          placeholder="Department Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-background text-foreground placeholder:text-muted-foreground border-border"
        />
        <Input
          placeholder="Code (e.g., CSE)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full sm:w-36 bg-background text-foreground placeholder:text-muted-foreground border-border"
        />
        <Button
          onClick={handleAdd}
          className="bg-primary hover:bg-primary/85 w-full sm:w-auto cursor-pointer text-primary-foreground"
        >
          Add
        </Button>
      </div>

      {/* Departments Table */}
      <div className="panel overflow-x-auto rounded-lg shadow-lg">
        <table className="w-full text-left text-foreground">
          <thead className="text-sm text-muted-foreground border-b border-border">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {departments.map((d) => (
              <tr key={d._id} className="transition-colors hover:bg-accent/15">
                <td className="py-3 px-4 font-medium">{d.name}</td>
                <td className="py-3 px-4">{d.code}</td>
                <td className="py-3 px-4 text-right">
                  <button
                    className="text-destructive/80 transition-colors hover:text-destructive"
                    onClick={() => handleDelete(d._id)}
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
