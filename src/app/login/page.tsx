"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { setUser } = useAuth(); // <-- directly update user

  const roles = ["student", "faculty", "admin"];

  const getRoleColor = (r: string) => {
    switch (r) {
      case "student":
        return "bg-blue-600";
      case "faculty":
        return "bg-green-600";
      case "admin":
        return "bg-purple-600";
      default:
        return "bg-gray-500";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Login successful! 🎉");
        setUser(data.user); // <-- update context immediately
        router.push(`/${data.user.role}`); // <-- role-based redirect
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900  to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <h1 className="text-3xl font-bold text-center text-white mb-6">Welcome Back</h1>
        <p className="text-center text-gray-300 mb-8 text-sm">Login to continue to your dashboard</p>

        {/* Role Switcher */}
        <div className="flex justify-center mb-6">
          <div className="flex justify-between items-center p-1 bg-gray-800/70 rounded-full shadow-inner w-full max-w-xs">
            {roles.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`w-1/3 py-2 text-sm font-semibold capitalize rounded-full transition-all duration-300 ${
                  role === r
                    ? "text-white shadow-lg " + getRoleColor(r)
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-gray-900/60 text-white placeholder-gray-400 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-gray-900/60 text-white placeholder-gray-400 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-3 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-xl cursor-pointer shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Processing..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300">
            Don&apos;t have an account?
            <Link
              href="/signup"
              className="text-indigo-400 hover:text-indigo-300 font-semibold ml-1 transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
