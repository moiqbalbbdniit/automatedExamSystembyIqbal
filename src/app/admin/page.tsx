"use client";

import StatsCard from "@/components/admin/StatsCard";
import UsersTable from "@/components/admin/UsersTable";
import ExamMonitor from "@/components/admin/ExamMonitor";
import Link from "next/link";import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react"; // optional icon




export default function AdminPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalActiveExams: 0,
    totalUnevaluatedExams: 0,
    totalSubmissions: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      }
    };
    fetchStats();
  }, []);


  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="flex flex-col p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-blue-400">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Comprehensive system oversight and management
            </p>
          </div>

          {/* Action Menu */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link
              href="/admin/question-bank"
              className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-800 text-sm sm:text-base"
            >
              Question Bank
            </Link>
            <Link
              href="/admin/addFaculty"
              className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 text-sm sm:text-base"
            >
              Add Faculty
            </Link>
            <Link
              href="/admin/addSubject"
              className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-blue-700 text-sm sm:text-base"
            >
              Add Subject
            </Link>
            <Link
              href="/admin/addDepartment"
              className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 text-sm sm:text-base"
            >
              Add Department
            </Link>
            <Link
              href="/admin/addCourses"
              className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 text-sm sm:text-base"
            >
              Add Course
            </Link>
            <Link
              href="/admin/notifications"
              className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 text-sm sm:text-base"
            >
              Post Notification
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
          <StatsCard
            title="Total Student"
            value={stats.totalStudents.toString()}
            subtitle="Active students"
            // trend="+12.5%"
            icon="users"
          />
          <StatsCard
            title="Active Exams"
            value={stats.totalActiveExams.toString()}
            subtitle="Currently running examinations"
            // trend="+3%"
            icon="file"
          />
          <StatsCard
            title="Unevaluated Exams"
            value={stats.totalUnevaluatedExams.toString()}
            subtitle="Pending evaluation"
            // trend="+2.1%"
            icon="pulse"
          />
          <StatsCard
            title="Submissions"
            value={stats.totalSubmissions.toString()}
            subtitle="All submitted exams"
            icon="file"
          />
          {/* <StatsCard
            title="Unevaluated Exams"
            value={stats.totalUnevaluatedExams.toString()}
            subtitle="Pending evaluation"
            icon="pulse"
          />
          <StatsCard
            title="Total Submissions"
            value={stats.totalSubmissions.toString()}
            subtitle="All submitted exams"
            icon="database"
          /> */}

          {/* New "Show Analytics" Card */}
          <Link href="/admin/analytics" className="lg:col-span-1">
            <div className="bg-gray-800 hover:bg-gray-700 rounded-lg shadow-md text-white flex flex-col justify-center items-center text-center p-8 transition-all duration-300 cursor-pointer border border-black">
              <BarChart3 className="w-8 h-8 mb-3" />
              <h3 className="text-lg font-semibold">View Analytics</h3>
              <p className="text-sm opacity-90">Detailed insights & trends</p>
            </div>
          </Link>
        </div>

        {/* User Management + Exam Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-gray-900 rounded-lg shadow-md p-4 sm:p-6 border border-gray-800 overflow-x-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <div>
                  <h2 className="text-lg font-medium text-blue-300">
                    User Management
                  </h2>
                  <p className="text-sm text-gray-400">
                    Manage faculty and student accounts
                  </p>
                </div>
              </div>
              <UsersTable />
            </div>

            <ExamMonitor />
          </div>

          {/* Removed ChartsPanel (moved to /admin/analytics) */}
        </div>
      </div>
    </div>
  );
}