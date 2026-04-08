"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const SignupPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  // const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<{ _id: string; name: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const router = useRouter();

  // Fetch available courses
  useEffect(() => {
    if (role === "student" || role === "faculty") {
      fetch("/api/courses")
        .then((res) => res.json())
        .then((data) => setCourses(data))
        .catch((err) => console.error("Error loading courses:", err));
    }
  }, [role]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          // username,
          email,
          password,
          role,
          course: selectedCourse || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("🎉 User created successfully!");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        if (res.status === 400 && data.error?.includes("exists")) {
          toast.warning("⚠️ User already registered. Please login instead.");
        } else {
          toast.error(data.error || "❌ Signup failed. Try again later.");
        }
      }
    } catch (err) {
      console.error("Signup Error:", err);
      toast.error("🚨 Server error! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roles = ["student", "faculty", "admin"];

  const getRoleColor = (r: string) => {
    switch (r) {
      case "student":
        return "bg-blue-500";
      case "faculty":
        return "bg-green-500";
      case "admin":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen aurora-page px-4 py-8 sm:py-10 md:px-6">
      <div className="mx-auto grid w-full max-w-6xl gap-6 sm:gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="panel hidden p-10 lg:block">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            New Journey
          </span>
          <h2 className="mt-6 text-4xl font-black leading-tight xl:text-5xl">Build your identity in the exam workspace.</h2>
          <p className="mt-5 max-w-md text-muted-foreground">
            Choose your role, map to your course, and step into a redesigned AI-assisted exam platform.
          </p>
        </section>

      <div className="panel w-full p-5 sm:p-8 md:p-10">
        <h1 className="mb-6 text-center text-2xl font-extrabold sm:text-3xl">Sign Up</h1>

        {/* Role Tabs */}
        <div className="flex justify-center mb-6">
          <div className="flex w-full max-w-xs items-center justify-between rounded-full border border-border/70 bg-muted/60 p-1">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                type="button"
                className={`w-1/3 rounded-full py-2 text-xs font-semibold capitalize transition-all duration-300 sm:text-sm ${
                  role === r
                    ? "text-white shadow-md " + getRoleColor(r)
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-muted-foreground">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              placeholder="Enter First Name"
              onChange={(e) => setFirstName(e.target.value)}
              required

              

              className="w-full rounded-xl border border-input bg-background/70 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition"

            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-muted-foreground">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              placeholder="Enter Last Name"
              onChange={(e) => setLastName(e.target.value)}
              required

              

              className="w-full rounded-xl border border-input bg-background/70 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition"

            />
          </div>
          {/* <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              placeholder="Enter Username"
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-gray-900/60 text-white placeholder-gray-400 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div> */}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required

              

              className="w-full rounded-xl border border-input bg-background/70 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition"

            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              id="password"
                placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required

              

              className="w-full rounded-xl border border-input bg-background/70 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition"

            />
          </div>

          {/* Course Dropdown (only for student/faculty) */}
          {(role === "student" || role === "faculty") && (
            <div>
              <label htmlFor="course" className="mb-1 block text-sm font-medium text-muted-foreground">
                Select Course
              </label>
              <select
                id="course"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                required
                className="w-full rounded-xl border border-input bg-background/70 px-4 py-3 text-foreground"
              >
                <option value="">-- Choose a Course --</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/85"
            disabled={loading}
          >
            {loading ? "Processing..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?
            <a href="/login" className="ml-1 font-semibold text-primary transition-colors hover:text-primary/80">
              Login
            </a>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SignupPage;
