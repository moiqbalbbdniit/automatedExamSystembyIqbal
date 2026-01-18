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
    <div className="min-h-screen bg-gray-950 p-4 md:p-8 text-gray-100">
      {/* Header + Back Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-blue-400">
          <Building2 className="w-6 h-6 text-blue-400" /> Manage Departments
        </h1>
        <Link href="/admin">
          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 w-full md:w-auto cursor-pointer">
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
          className="flex-1 bg-gray-900 text-gray-100 placeholder:text-gray-300 border-gray-700"
        />
        <Input
          placeholder="Code (e.g., CSE)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full sm:w-36 bg-gray-900 text-gray-100 placeholder:text-gray-300 border-gray-700"
        />
        <Button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto cursor-pointer"
        >
          Add
        </Button>
      </div>

      {/* Departments Table */}
      <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-800 bg-gray-900">
        <table className="w-full text-left text-gray-100">
          <thead className="text-sm text-gray-400 border-b border-gray-700">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {departments.map((d) => (
              <tr key={d._id} className="hover:bg-gray-800 transition">
                <td className="py-3 px-4 font-medium">{d.name}</td>
                <td className="py-3 px-4">{d.code}</td>
                <td className="py-3 px-4 text-right">
                  <button
                    className="text-red-500 hover:text-red-600"
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
