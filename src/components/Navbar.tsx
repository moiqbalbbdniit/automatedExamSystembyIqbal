"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  User,
  LogOut,
  Settings,
  Home,
  BarChart2,
  ChevronUp,
  ChevronDown,
  Bell,
  Brain,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, setUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (pathname && pathname.startsWith("/student/exam/")) {
    return null;
  }

  const handleLogout = async () => {
  try {
    const res = await fetch("/api/auth/login", {
      method: "DELETE",
      credentials: "include",
    });

      if (res.ok) {
        toast.success("Logged out successfully!");
        localStorage.removeItem("token"); // ensure token removed
        setUser(null);
        router.push("/"); // ✅ client-side redirect (no reload)
      } else {
        toast.error("Logout failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    }
  };

  const getDashboardPath = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/admin";
    if (user.role === "faculty") return "/faculty";
    return "/student";
  };

  const handleProtectedRoute = (path: string) => {
    if (!user) {
      toast("Please login first!");
      router.push("/login"); // ✅ client-side navigation
    } else {
      router.push(path); // ✅ fixed: no full reload
    }
  };

  return (
    <nav className="bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-lg border-b border-blue-700">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center space-x-2 text-2xl font-bold tracking-wide text-white transition-all duration-300 hover:scale-105 hover:text-blue-400"
        >
          <div className="relative w-6 h-6 md:w-7 md:h-7">
            <Brain className="absolute top-0 left-0 w-full h-full text-blue-500 fill-blue-500/20" />
          </div>
          <span className="text-2xl md:text-lg lg:text-xl font-extrabold tracking-widest text-white drop-shadow-lg">
            AI Exam System
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-6 items-center">
          <Link href="/" className="flex items-center gap-1 font-medium hover:text-blue-200">
            <Home className="w-5 h-5" /> Home
          </Link>

          <button
            onClick={() => handleProtectedRoute("/notifications")}
            className="flex items-center gap-1 font-medium hover:text-blue-200"
          >
            <Bell className="w-5 h-5" /> Notifications
          </button>

          {/* <button
            onClick={() => handleProtectedRoute("/student/results")}
            className="flex items-center gap-1 font-medium hover:text-blue-200"
          >
            <BarChart2 className="w-5 h-5" /> Results
          </button> */}

          {user && (
            <button
              onClick={() => handleProtectedRoute(getDashboardPath())}
              className="flex items-center gap-1 font-medium hover:text-blue-200"
            >
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </button>
          )}

          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 rounded-full px-4 py-2 text-white font-medium hover:bg-blue-700/40 transition-all duration-200"
                    >
                      <User className="w-5 h-5" />
                      {user.firstName || user.email.split("@")[0]}
                      <ChevronDown className="w-4 h-4 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-gray-900 shadow-2xl rounded-xl p-2 mt-2 text-gray-100 "
                  >
                    <DropdownMenuLabel className="text-sm font-semibold text-gray-100">
                      Signed in as
                      <div className="truncate text-gray-100">{user.email}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => router.push("/profile")}
                      className="flex items-center gap-2 hover:bg-blue-50 rounded-lg"
                    >
                      <User className="w-4 h-4 text-blue-600 hover:text-white " /> Profile
                    </DropdownMenuItem>

                    <DropdownMenuItem
                     onClick={() => router.push("/settings")}
                     className="flex items-center gap-2 hover:bg-blue-50 rounded-lg"
                      >
                      <Settings className="w-4 h-4 text-blue-600" /> Settings
                      </DropdownMenuItem>


                    <DropdownMenuSeparator  />

                    <DropdownMenuItem
                      className="flex items-center gap-2 text-red-500 hover:bg-red-50 rounded-lg"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 text-red-400" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button className="bg-blue-600 hover:bg-blue-700 rounded-full px-5 py-2 shadow-md">
                    Login
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <button
          className="md:hidden p-2 rounded-lg text-white hover:bg-blue-700/40"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <ChevronUp className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-gradient-to-br from-indigo-900 to-gray-900 px-6 py-4 space-y-3 overflow-hidden"
          >
            <Link href="/" className="flex items-center gap-2 text-white hover:text-blue-200">
              <Home className="w-5 h-5" /> Home
            </Link>

            <button
              onClick={() => handleProtectedRoute("/notifications")}
              className="flex items-center gap-2 text-white hover:text-blue-200"
            >
              <Bell className="w-5 h-5" /> Notifications
            </button>

            {/* <button
              onClick={() => handleProtectedRoute("/student/results")}
              className="flex items-center gap-2 text-white hover:text-blue-200"
            >
              <BarChart2 className="w-5 h-5" /> Results
            </button> */}

            {user && (
              <button
                onClick={() => handleProtectedRoute(getDashboardPath())}
                className="flex items-center gap-2 text-white hover:text-blue-200"
              >
                <LayoutDashboard className="w-5 h-5" /> Dashboard
              </button>
            )}

            <hr className="border-blue-600" />

            {!loading && (
              <>
                {user ? (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => router.push("/profile")}
                      className="flex items-center gap-2 text-white hover:text-blue-200"
                    >
                      <User className="w-5 h-5 text-blue-400" /> Profile
                    </button>

                    <button
                      onClick={() => router.push("/settings")}
                      className="flex items-center gap-2 text-white hover:text-blue-200"
                    >
                      <Settings className="w-5 h-5 text-blue-400" /> Settings
                    </button>

                    <button
                      className="flex items-center gap-2 text-red-400 font-medium hover:text-red-200"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-5 h-5 text-red-400" /> Logout
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className="flex items-center gap-2 text-white hover:text-blue-200">
                    <User className="w-5 h-5" /> Login
                  </Link>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}