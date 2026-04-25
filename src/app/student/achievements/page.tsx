"use client";

import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import axios from "axios";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Flame, Trophy, Target, TrendingUp, Sparkles } from "lucide-react";

type RecentActivityItem = {
  date: string;
  count: number;
};

type AchievementStats = {
  totalSubmissions: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  testsLast7Days: number;
  testsLast30Days: number;
  bestScorePercent: number;
  lastSubmissionAt: string | null;
  recentActivity: RecentActivityItem[];
};

const defaultStats: AchievementStats = {
  totalSubmissions: 0,
  activeDays: 0,
  currentStreak: 0,
  longestStreak: 0,
  testsLast7Days: 0,
  testsLast30Days: 0,
  bestScorePercent: 0,
  lastSubmissionAt: null,
  recentActivity: [],
};

export default function StudentAchievementsPage() {
  const { user } = useAuth();
  const studentId = user?.id ? String(user.id) : "";

  const [stats, setStats] = useState<AchievementStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;

    const fetchAchievements = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/submissions/achievements?studentId=${studentId}`);
        setStats({
          totalSubmissions: data?.totalSubmissions ?? 0,
          activeDays: data?.activeDays ?? 0,
          currentStreak: data?.currentStreak ?? 0,
          longestStreak: data?.longestStreak ?? 0,
          testsLast7Days: data?.testsLast7Days ?? 0,
          testsLast30Days: data?.testsLast30Days ?? 0,
          bestScorePercent: data?.bestScorePercent ?? 0,
          lastSubmissionAt: data?.lastSubmissionAt ?? null,
          recentActivity: Array.isArray(data?.recentActivity) ? data.recentActivity : [],
        });
      } catch (error) {
        console.error("Failed to fetch achievements", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [studentId]);

  const streakGoal = useMemo(() => {
    if (stats.currentStreak >= 14) return 30;
    if (stats.currentStreak >= 7) return 14;
    if (stats.currentStreak >= 3) return 7;
    return 3;
  }, [stats.currentStreak]);

  const streakProgress = Math.min((stats.currentStreak / streakGoal) * 100, 100);

  const badges = [
    {
      title: "3-Day Streak",
      hint: "Submit an exam for 3 days in a row",
      unlocked: stats.currentStreak >= 3,
    },
    {
      title: "Weekly Warrior",
      hint: "Attempt 5 exams in the last 7 days",
      unlocked: stats.testsLast7Days >= 5,
    },
    {
      title: "Consistency Master",
      hint: "Stay active for 14 consecutive days",
      unlocked: stats.longestStreak >= 14,
    },
    {
      title: "Top Scorer",
      hint: "Reach 85% or more in any exam",
      unlocked: stats.bestScorePercent >= 85,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-foreground">
        <p>Loading achievements...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen aurora-page p-4 text-foreground sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="panel rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Achievements</h1>
              <p className="mt-1 text-muted-foreground">Track your daily streaks, milestones, and consistency progress.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive">
                <Flame className="h-3.5 w-3.5" /> {stats.currentStreak} day streak
              </div>
              <NextLink href="/student" className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/25">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
              </NextLink>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<Flame className="h-6 w-6 text-destructive" />} title="Current Streak" value={`${stats.currentStreak} days`} color="text-destructive" />
          <StatCard icon={<Trophy className="h-6 w-6 text-amber-600" />} title="Longest Streak" value={`${stats.longestStreak} days`} color="text-amber-600" />
          <StatCard icon={<TrendingUp className="h-6 w-6 text-chart-2" />} title="Tests (7 Days)" value={stats.testsLast7Days} color="text-chart-2" />
          <StatCard icon={<Target className="h-6 w-6 text-primary" />} title="Active Days" value={stats.activeDays} color="text-primary" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card className="panel rounded-2xl border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle className="text-base">Streak Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Keep your streak alive. Reach <span className="font-semibold text-foreground">{streakGoal} days</span> to unlock your next milestone.
              </p>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-400 via-rose-500 to-red-500" style={{ width: `${streakProgress}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{stats.currentStreak} days done</span>
                <span>{Math.max(streakGoal - stats.currentStreak, 0)} days to go</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Last exam submitted: {stats.lastSubmissionAt ? new Date(stats.lastSubmissionAt).toLocaleString() : "No submissions yet"}
              </p>
            </CardContent>
          </Card>

          <Card className="panel rounded-2xl border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle className="text-base">Recent Activity (14 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {(stats.recentActivity.length > 0
                  ? stats.recentActivity
                  : Array.from({ length: 14 }, (_, idx) => ({ date: `day-${idx}`, count: 0 }))
                ).map((item) => (
                  <div
                    key={item.date}
                    title={`${item.date}: ${item.count} test${item.count === 1 ? "" : "s"}`}
                    className={`h-7 rounded-md border border-border/60 ${
                      item.count === 0
                        ? "bg-muted/30"
                        : item.count === 1
                        ? "bg-primary/35"
                        : item.count === 2
                        ? "bg-primary/55"
                        : "bg-primary/80"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Darker blocks mean more tests attempted on that day.</p>
            </CardContent>
          </Card>
        </section>

        <section className="panel rounded-2xl p-6 shadow-md">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Badge milestones
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {badges.map((badge) => (
              <div
                key={badge.title}
                className={`rounded-xl border p-4 ${
                  badge.unlocked ? "border-chart-2/50 bg-chart-2/10" : "border-border/70 bg-card/60"
                }`}
              >
                <p className="text-sm font-semibold text-foreground">{badge.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{badge.hint}</p>
                <p className={`mt-3 text-xs font-semibold ${badge.unlocked ? "text-chart-2" : "text-muted-foreground"}`}>
                  {badge.unlocked ? "Unlocked" : "Locked"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="panel rounded-2xl p-5">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-card/80">
            {icon}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className={`text-3xl font-black ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
