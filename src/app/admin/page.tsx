"use client";

import StatsCard from "@/components/admin/StatsCard";
import UsersTable from "@/components/admin/UsersTable";
import ExamMonitor from "@/components/admin/ExamMonitor";
import Sidebar from "@/components/admin/Sidebar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";




export default function AdminPage() {
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalActiveExams: 0,
    totalUnevaluatedExams: 0,
    totalSubmissions: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);


  return (
    <div className="min-h-screen aurora-page text-foreground">
      <div className="mx-auto flex w-full max-w-[1500px] gap-4 px-2 py-3 sm:px-3 sm:py-4 lg:px-4">
        <Sidebar />

        <div className="min-w-0 flex-1 space-y-6">
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:hidden">
            <Link href="/admin" className="rounded-lg border border-border/70 bg-card/80 px-3 py-2 text-center text-sm font-medium hover:bg-accent/20">Dashboard</Link>
            <Link href="/admin/question-bank" className="rounded-lg border border-border/70 bg-card/80 px-3 py-2 text-center text-sm font-medium hover:bg-accent/20">Question Bank</Link>
            <Link href="/admin/class-sections" className="rounded-lg border border-border/70 bg-card/80 px-3 py-2 text-center text-sm font-medium hover:bg-accent/20">Class Sections</Link>
            <Link href="/admin/analytics" className="rounded-lg border border-border/70 bg-card/80 px-3 py-2 text-center text-sm font-medium hover:bg-accent/20">Analytics</Link>
          </section>

          <header className="panel rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-primary sm:text-3xl">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-muted-foreground">Comprehensive system oversight and management</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
                {statsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="h-2 w-2 rounded-full bg-chart-2" />}
                {statsLoading ? "Refreshing metrics" : "System metrics updated"}
              </div>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {statsLoading ? (
              <>
                <KpiSkeleton />
                <KpiSkeleton />
                <KpiSkeleton />
                <KpiSkeleton />
                <KpiSkeleton />
              </>
            ) : (
              <>
                <StatsCard title="Total Student" value={stats.totalStudents.toString()} subtitle="Active students" icon="users" />
                <StatsCard title="Active Exams" value={stats.totalActiveExams.toString()} subtitle="Currently running examinations" icon="file" />
                <StatsCard title="Unevaluated Exams" value={stats.totalUnevaluatedExams.toString()} subtitle="Pending evaluation" icon="pulse" />
                <StatsCard title="Submissions" value={stats.totalSubmissions.toString()} subtitle="All submitted exams" icon="file" />
                <Link href="/admin/analytics" className="panel flex cursor-pointer flex-col items-center justify-center rounded-2xl p-6 text-center transition-colors duration-200 hover:bg-accent/15">
                  <BarChart3 className="mb-3 h-8 w-8" />
                  <h3 className="text-lg font-semibold">View Analytics</h3>
                  <p className="text-sm text-muted-foreground">Detailed insights and trends</p>
                </Link>
              </>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="panel rounded-2xl p-5">
              <h3 className="text-base font-semibold text-primary">Quick Actions</h3>
              <p className="mt-1 text-sm text-muted-foreground">Jump directly to your most-used admin tasks.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <ActionLink href="/admin/addFaculty" label="Add Faculty" />
                <ActionLink href="/admin/addSubject" label="Add Subject" />
                <ActionLink href="/admin/addDepartment" label="Department" />
                <ActionLink href="/admin/addCourses" label="Courses" />
                <ActionLink href="/admin/class-sections" label="Class Sections" />
                <ActionLink href="/admin/question-bank" label="Question Bank" />
              </div>
            </div>

            <div className="panel rounded-2xl p-5">
              <h3 className="text-base font-semibold text-primary">Operational Checklist</h3>
              <p className="mt-1 text-sm text-muted-foreground">Live status without charts for day-to-day monitoring.</p>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                  <span className="text-sm text-foreground">Pending Evaluations</span>
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                    {stats.totalUnevaluatedExams}
                  </span>
                </li>
                <li className="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                  <span className="text-sm text-foreground">Active Exam Sessions</span>
                  <span className="rounded-full bg-chart-2/20 px-2.5 py-0.5 text-xs font-semibold text-chart-2">
                    {stats.totalActiveExams}
                  </span>
                </li>
                <li className="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 px-3 py-2">
                  <span className="text-sm text-foreground">Total Submissions Tracked</span>
                  <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {stats.totalSubmissions}
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <div className="panel rounded-2xl p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-medium text-primary">User Management</h2>
                <p className="text-sm text-muted-foreground">Manage faculty and student accounts</p>
              </div>
              <UsersTable />
            </div>

            <ExamMonitor />
          </section>
        </div>
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="panel rounded-2xl p-5">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="mt-3 h-10 w-14" />
      <Skeleton className="mt-3 h-3.5 w-32" />
    </div>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border/70 bg-background/75 px-3 py-2 text-center text-sm font-medium text-foreground transition-colors hover:bg-accent/15"
    >
      {label}
    </Link>
  );
}