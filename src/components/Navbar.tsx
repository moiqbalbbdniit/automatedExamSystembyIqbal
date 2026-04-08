"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Menu,
  User,
  LogOut,
  Settings,
  Home,
  ChevronUp,
  ChevronDown,
  Bell,
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
import ThemeToggle from "@/components/ThemeToggle";

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
        localStorage.removeItem("token");
        setUser(null);
        router.push("/");
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
      router.push("/login");
    } else {
      router.push(path);
    }
  };

  const navButtonClass =
    "rounded-full px-4 py-2 text-sm font-semibold text-foreground/85 transition-all duration-200 hover:bg-accent/35 hover:text-foreground hover:shadow-sm";

  return (
    <nav className="sticky top-0 z-40 border-b border-border/70 bg-background/80 shadow-[0_10px_30px_-20px_color-mix(in_oklch,var(--foreground)_35%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3">
        <Link
          href="/"
          className="group flex min-w-0 max-w-[calc(100%-4.25rem)] items-center gap-2 rounded-2xl border border-border/70 bg-card/72 px-2 py-1.5 pr-3 shadow-lg shadow-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-xl sm:gap-3 sm:px-2.5 sm:pr-4"
        >
          <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-border/70 bg-background/90 ring-1 ring-primary/20 shadow-md sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-[4.5rem] lg:w-[4.5rem]">
            <Image
              src="/newlogo.png"
              alt="TrueGrade AI Logo"
              fill
              sizes="(max-width: 640px) 48px, (max-width: 1024px) 64px, 72px"
              className="object-contain p-1.5"
              priority
            />
          </div>
          <div className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-extrabold tracking-tight text-foreground sm:text-base md:text-lg lg:text-xl">
              TrueGrade AI
            </span>
            <span className="hidden text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:block md:text-[0.68rem]">
              Assessment Intelligence
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/" className={navButtonClass}>
            <span className="inline-flex items-center gap-2">
              <Home className="size-4" /> Home
            </span>
          </Link>

          <button
            onClick={() => handleProtectedRoute("/notifications")}
            className={navButtonClass}
          >
            <span className="inline-flex items-center gap-2">
              <Bell className="size-4" /> Notifications
            </span>
          </button>

          {user && (
            <button
              onClick={() => handleProtectedRoute(getDashboardPath())}
              className={navButtonClass}
            >
              <span className="inline-flex items-center gap-2">
                <LayoutDashboard className="size-4" /> Dashboard
              </span>
            </button>
          )}

          <ThemeToggle />

          {!loading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 font-medium text-foreground transition-all duration-200 hover:bg-accent/30"
                    >
                      <User className="size-4" />
                      {user.firstName || user.email.split("@")[0]}
                      <ChevronDown className="size-4 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="mt-2 w-56 rounded-2xl border-border/70 bg-popover/95 p-2 text-popover-foreground shadow-xl"
                  >
                    <DropdownMenuLabel className="text-sm font-semibold">
                      Signed in as
                      <div className="truncate text-muted-foreground">{user.email}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => router.push("/profile")}
                      className="flex cursor-pointer items-center gap-2 rounded-lg"
                    >
                      <User className="size-4 text-primary" /> Profile
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => router.push("/settings")}
                      className="flex cursor-pointer items-center gap-2 rounded-lg"
                    >
                      <Settings className="size-4 text-primary" /> Settings
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="flex cursor-pointer items-center gap-2 rounded-lg text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="size-4" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button className="rounded-full bg-primary px-5 py-2 text-primary-foreground shadow-md hover:bg-primary/85">
                    Login
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>

        <button
          className="shrink-0 rounded-xl border border-border/70 bg-card/70 p-2.5 text-foreground shadow-sm transition hover:bg-accent/30 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <ChevronUp className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-3 overflow-hidden border-t border-border/70 bg-background/95 px-6 py-4 md:hidden"
          >
            <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent/30">
              <Home className="size-5" /> Home
            </Link>

            <button
              onClick={() => handleProtectedRoute("/notifications")}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent/30"
            >
              <Bell className="size-5" /> Notifications
            </button>

            {user && (
              <button
                onClick={() => handleProtectedRoute(getDashboardPath())}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent/30"
              >
                <LayoutDashboard className="size-5" /> Dashboard
              </button>
            )}

            <div className="px-2">
              <ThemeToggle />
            </div>

            <hr className="border-border/70" />

            {!loading && (
              <>
                {user ? (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => router.push("/profile")}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent/30"
                    >
                      <User className="size-5 text-primary" /> Profile
                    </button>

                    <button
                      onClick={() => router.push("/settings")}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent/30"
                    >
                      <Settings className="size-5 text-primary" /> Settings
                    </button>

                    <button
                      className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-destructive hover:bg-destructive/10"
                      onClick={handleLogout}
                    >
                      <LogOut className="size-5" /> Logout
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent/30">
                    <User className="size-5" /> Login
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