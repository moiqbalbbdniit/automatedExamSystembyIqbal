"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";
import { Sparkles, ShieldCheck } from "lucide-react";

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
    <div className="min-h-screen aurora-page px-4 py-8 sm:py-10 md:px-6">
      <div className="mx-auto grid w-full max-w-6xl gap-6 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel hidden p-10 lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-sm font-semibold text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            Smart Assessment Workspace
          </div>
          <h1 className="mt-6 text-4xl font-black leading-tight xl:text-5xl">Exams that feel modern, fast, and secure.</h1>
          <p className="mt-5 max-w-lg text-muted-foreground">
            Your new portal gives students, faculty, and admins a cleaner flow with AI-powered tools and a fresh interface.
          </p>
          <div className="mt-10 space-y-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-chart-2" /> Role-based access for student, faculty, and admin</p>
            <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-chart-2" /> Session-safe login and protected routes</p>
            <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-chart-2" /> Ready for dark/light productivity mode</p>
          </div>
        </section>

        <div className="panel w-full max-w-xl p-5 sm:p-8 md:p-10 lg:mx-auto">
        <h1 className="mb-3 text-center text-2xl font-extrabold sm:text-3xl">Welcome Back</h1>
        <p className="mb-7 text-center text-sm text-muted-foreground sm:mb-8">Login to continue to your dashboard</p>

        {/* Role Switcher */}
        <div className="flex justify-center mb-6">
          <div className="flex w-full max-w-xs items-center justify-between rounded-full border border-border/70 bg-muted/60 p-1">
            {roles.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`w-1/3 rounded-full py-2 text-xs font-semibold capitalize transition-all duration-300 sm:text-sm ${
                  role === r
                    ? "text-white shadow-lg " + getRoleColor(r)
                    : "text-muted-foreground hover:text-foreground"
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
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-input bg-background/70 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-input bg-background/70 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "Processing..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?
            <Link
              href="/signup"
              className="ml-1 font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default LoginPage;
