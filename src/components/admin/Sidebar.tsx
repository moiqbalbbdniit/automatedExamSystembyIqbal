"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Book,
  PieChart,
  Grid,
  Shield,
  Building2,
  BookOpenCheck,
  Bell,
  Users,
  GraduationCap,
  Layers3,
} from "lucide-react";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: Grid },
  { href: "/admin/question-bank", label: "Question Bank", icon: Book },
  { href: "/admin/addFaculty", label: "Manage Faculty", icon: Users },
  { href: "/admin/addSubject", label: "Add Subject", icon: BookOpenCheck },
  { href: "/admin/addDepartment", label: "Add Department", icon: Building2 },
  { href: "/admin/addCourses", label: "Add Course", icon: GraduationCap },
  { href: "/admin/class-sections", label: "Class Sections", icon: Layers3 },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/analytics", label: "Analytics", icon: PieChart },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 self-start rounded-xl border border-border/70 bg-card/80 p-3 shadow-xl backdrop-blur-sm lg:flex lg:flex-col xl:w-64 xl:p-4">
      {/* Logo / Header */}
      <div className="mb-4 rounded-lg border border-border/70 bg-background/70 p-3">
        <div className="text-base font-bold text-primary xl:text-lg">TrueGrade AI</div>
        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Admin Console</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/admin" && pathname?.startsWith(href));
          return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition xl:gap-3 xl:px-3 xl:py-2.5 ${
              isActive
                ? "bg-primary text-primary-foreground shadow"
                : "text-foreground/85 hover:bg-accent/20 hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        )})}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-6">
        <div className="border-t border-border/70 pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" /> Secure Admin Access
          </div>
        </div>
      </div>
    </aside>
  );
}
