"use client";

import { useEffect, useState } from "react";
import { UserPlus, Trash2,ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";

type Faculty = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export default function AddFacultyPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loadFaculties = async () => {
    try {
      const res = await fetch("/api/users?role=faculty");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setFaculties(list.filter((item: Faculty) => item.role === "faculty"));
    } catch (error) {
      console.error("Failed to load faculties", error);
      toast.error("Failed to load faculty users.");
    }
  };

  // Load faculties
  useEffect(() => {
    loadFaculties();
  }, []);

  const handleAdd = async () => {
    if (!firstName || !lastName || !email) {
      toast.error("First name, last name and email are required.");
      return;
    }

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("Faculty account created successfully.");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      loadFaculties();
    } else {
      toast.error(data?.error || "Failed to create faculty account.");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setFaculties((prev) => prev.filter((f) => f._id !== id));
      toast.success("Faculty account deleted.");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error || "Failed to delete faculty account.");
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
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="bg-background border-border text-foreground placeholder:text-muted-foreground"
        />
        <Input
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="bg-background border-border text-foreground placeholder:text-muted-foreground"
        />
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-background border-border text-foreground placeholder:text-muted-foreground"
        />
        <Input
          placeholder="Password (optional)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-background border-border text-foreground placeholder:text-muted-foreground"
        />
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
              <th className="py-3 px-4 text-left">Type</th>
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
                  {f.firstName} {f.lastName}
                </td>
                <td className="py-3 px-4 text-muted-foreground">{f.email}</td>
                <td className="py-3 px-4 text-muted-foreground">Faculty User</td>
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
