"use client";

import { useEffect, useState, useMemo } from "react";
import { Edit3, Trash2, User, Loader2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";

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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [editUser, setEditUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Fetch users
  const fetchUsers = async () => {
    setInitialLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch users");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
      const normalizedSearch = debouncedSearchTerm.toLowerCase();
      const searchMatch =
        fullName.includes(normalizedSearch) ||
        u.email.toLowerCase().includes(normalizedSearch) ||
        (u.username && u.username.toLowerCase().includes(normalizedSearch));

      const roleMatch =
        filterRole === "All" ||
        (u.role && u.role.toLowerCase() === filterRole.toLowerCase());

      return searchMatch && roleMatch;
    });
  }, [users, debouncedSearchTerm, filterRole]);

  const roleOptions = useMemo(() => {
    const roles = Array.from(new Set(users.map((u) => String(u.role || "").toLowerCase()).filter(Boolean)));
    return roles;
  }, [users]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, filterRole, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-4 text-foreground">
      {loading && (
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          Processing user action
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-wrap gap-4 items-center placeholder:text-gray-300">
        <Input
          placeholder="Search by name, email or username..."
          className="w-72 bg-background/80 border-border placeholder:text-muted-foreground"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Select onValueChange={(val) => setFilterRole(val)} defaultValue="All">
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value="All">All Roles</SelectItem>
            {roleOptions.includes("faculty") && <SelectItem value="Faculty">Faculty</SelectItem>}
            {roleOptions.includes("student") && <SelectItem value="Student">Student</SelectItem>}
            {roleOptions.includes("admin") && <SelectItem value="Admin">Admin</SelectItem>}
          </SelectContent>
        </Select>

        <Select onValueChange={(val) => setPageSize(Number(val))} defaultValue="25">
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="25">25 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
            <SelectItem value="100">100 per page</SelectItem>
          </SelectContent>
        </Select>

        <p className="text-xs text-muted-foreground">
          Showing {paginatedUsers.length} of {filteredUsers.length} users
        </p>
      </div>

      {/* Scrollable Table */}
      {initialLoading ? (
        <div className="space-y-3 rounded-xl border border-border panel p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : (
      <div className="overflow-x-auto max-h-[600px] border border-border rounded-xl panel">
        <table className="w-full text-left">
          <thead className="text-sm text-muted-foreground sticky top-0 bg-card z-10">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Username</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/70">
            {paginatedUsers.map((u) => (
              <tr key={u._id} className="bg-card/65 text-foreground hover:bg-accent/12 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{u.firstName} {u.lastName}</div>
                      <div className="text-sm text-muted-foreground">{u.email}</div>
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
                        <button className="text-foreground hover:text-primary" onClick={() => setEditUser(u)}>
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

            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-muted-foreground">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {!initialLoading && filteredUsers.length > 0 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            className="border-border bg-card hover:bg-accent/20"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            className="border-border bg-card hover:bg-accent/20"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
