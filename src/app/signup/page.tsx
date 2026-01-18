"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <h1 className="text-3xl font-bold text-center text-indigo-400 mb-6">Sign Up</h1>

        {/* Role Tabs */}
        <div className="flex justify-center mb-6">
          <div className="flex justify-between items-center p-1 bg-gray-800/70 rounded-full shadow-inner w-full max-w-xs">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                type="button"
                className={`w-1/3 py-2 text-sm font-semibold capitalize rounded-full transition-all duration-300 ${
                  role === r
                    ? "text-white shadow-md " + getRoleColor(r)
                    : "text-gray-400 hover:text-white"
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
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              placeholder="Enter First Name"
              onChange={(e) => setFirstName(e.target.value)}
              required

              

              className="w-full px-4 py-3 rounded-lg bg-gray-900/60 text-white placeholder-gray-400 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"

            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              placeholder="Enter Last Name"
              onChange={(e) => setLastName(e.target.value)}
              required

              

              className="w-full px-4 py-3 rounded-lg bg-gray-900/60 text-white placeholder-gray-400 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"

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
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required

              

              className="w-full px-4 py-3 rounded-lg bg-gray-900/60 text-white placeholder-gray-400 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"

            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
                placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required

              

              className="w-full px-4 py-3 rounded-lg bg-gray-900/60 text-white placeholder-gray-400 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"

            />
          </div>

          {/* Course Dropdown (only for student/faculty) */}
          {(role === "student" || role === "faculty") && (
            <div>
              <label htmlFor="course" className="block text-sm font-medium text-gray-300 mb-1">
                Select Course
              </label>
              <select
                id="course"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            disabled={loading}
          >
            {loading ? "Processing..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            Already have an account?
            <a href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold ml-1 transition-colors">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
