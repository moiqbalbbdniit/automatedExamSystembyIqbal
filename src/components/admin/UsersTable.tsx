"use client";

import { useEffect, useState, useMemo } from "react";
import { Edit3, Trash2, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

interface UserType {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: string;
  password?: string;
}

export default function UsersTable() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [filterRole, setFilterRole] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [editUser, setEditUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Save edited user
  const handleSave = async () => {
    if (!editUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${editUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editUser),
      });
      if (res.ok) {
        toast.success("User updated successfully");
        setEditUser(null);
        fetchUsers();
      } else {
        toast.error("Failed to update user");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update user");
    }
    setLoading(false);
  };

  // Delete user
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("User deleted successfully");
        setUsers(users.filter((u) => u._id !== id));
      } else {
        toast.error("Failed to delete user");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user");
    }
    setLoading(false);
  };

  // ✅ Use useMemo for stable filtering
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      const searchMatch =
        fullName.includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()));

      const roleMatch =
        filterRole === "All" ||
        (u.role && u.role.toLowerCase() === filterRole.toLowerCase());

      return searchMatch && roleMatch;
    });
  }, [users, searchTerm, filterRole]);

  return (
    <div className="space-y-4 text-white">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <p className="text-white text-lg">Loading...</p>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-wrap gap-4 items-center placeholder:text-gray-300">
        <Input
          placeholder="Search by name, email or username..."
          className="w-60 placeholder:text-gray-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Select onValueChange={(val) => setFilterRole(val)} defaultValue="All">
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white">
            <SelectItem value="All">All Roles</SelectItem>
            <SelectItem value="Faculty">Faculty</SelectItem>
            <SelectItem value="Student">Student</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scrollable Table */}
      <div className="overflow-x-auto max-h-[600px] border border-gray-700 rounded">
        <table className="w-full text-left">
          <thead className="text-sm text-white sticky top-0 bg-gray-900 z-10">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Username</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filteredUsers.map((u) => (
              <tr key={u._id} className="bg-gray-800 text-white">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                      <User className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="font-medium">{u.firstName} {u.lastName}</div>
                      <div className="text-sm text-gray-300">{u.email}</div>
                    </div>
                  </div>
                </td>

                <td className="py-4 px-4">{u.username}</td>
                <td className="py-4 px-4">{u.role}</td>

                <td className="py-4 px-4 text-right">
                  <div className="inline-flex items-center gap-3">
                    {/* Edit Dialog */}
                    <Dialog open={editUser?._id === u._id} onOpenChange={(open) => !open && setEditUser(null)}>
                      <DialogTrigger asChild>
                        <button className="text-white hover:text-indigo-400" onClick={() => setEditUser(u)}>
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </DialogTrigger>
                      {editUser && editUser._id === u._id && (
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <Input
                              value={editUser.firstName}
                              onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
                              placeholder="First Name"
                            />
                            <Input
                              value={editUser.lastName}
                              onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
                              placeholder="Last Name"
                            />
                            <Input
                              value={editUser.email}
                              onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                              placeholder="Email"
                            />
                            <Input
                              value={editUser.username}
                              onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                              placeholder="Username"
                            />
                            <Input
                              type="password"
                              value={editUser.password || ""}
                              onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                              placeholder="Password"
                            />
                          </div>
                          <DialogFooter>
                            <Button onClick={handleSave}>Save</Button>
                          </DialogFooter>
                        </DialogContent>
                      )}
                    </Dialog>

                    <button className="text-red-500 hover:text-red-600" onClick={() => handleDelete(u._id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-400">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
