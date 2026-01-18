"use client";

import Link from "next/link";
import { Book, PieChart, Grid, Shield } from "lucide-react";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: Grid, active: true },
  { href: "/admin/question-bank", label: "Question Bank", icon: Book },
  { href: "/admin/analytics", label: "Analytics", icon: PieChart },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen p-6 flex flex-col">
      {/* Logo / Header */}
      <div className="mb-8">
        <div className="text-lg font-bold text-teal-400">AI Exam System</div>
        <p className="text-sm text-gray-400 mt-1">Admin Console</p>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 flex-1">
        {navLinks.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 p-3 rounded-lg transition ${
              active
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "text-gray-200 hover:bg-gray-800"
            }`}
          >
            <Icon className="w-5 h-5" /> {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-6">
        <div className="border-t border-gray-800 pt-6">
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" /> Admin Access
          </div>
        </div>
      </div>
    </aside>
  );
}
