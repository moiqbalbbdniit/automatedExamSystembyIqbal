import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Submission from "@/lib/models/Submission";
import { authorizeApiRoles } from "@/lib/apiAuth";

type LeanSubmission = {
  createdAt?: Date | string;
  total_score?: number;
  max_score?: number;
};

const toUtcDay = (date: Date) => date.toISOString().slice(0, 10);

const dayFromKey = (dayKey: string) => new Date(`${dayKey}T00:00:00.000Z`);

const dayDiff = (a: string, b: string) => {
  const ms = dayFromKey(a).getTime() - dayFromKey(b).getTime();
  return Math.round(ms / 86400000);
};

function computeLongestStreak(sortedDays: string[]): number {
  if (sortedDays.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < sortedDays.length; i += 1) {
    const diff = dayDiff(sortedDays[i], sortedDays[i - 1]);
    if (diff === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else if (diff > 1) {
      current = 1;
    }
  }

  return longest;
}

function computeCurrentStreak(activeDaySet: Set<string>, todayKey: string): number {
  const yesterday = new Date(`${todayKey}T00:00:00.000Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = toUtcDay(yesterday);

  const hasToday = activeDaySet.has(todayKey);
  const hasYesterday = activeDaySet.has(yesterdayKey);

  // The streak remains active if the student submitted today or yesterday.
  if (!hasToday && !hasYesterday) return 0;

  let streak = 0;
  const cursor = new Date(`${hasToday ? todayKey : yesterdayKey}T00:00:00.000Z`);

  while (activeDaySet.has(toUtcDay(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

export async function GET(req: NextRequest) {
  try {
    const auth = authorizeApiRoles(req, ["student", "faculty", "admin"]);
    if (!auth.ok) return auth.response;

    await connectDB();

    const url = new URL(req.url);
    const studentId = url.searchParams.get("studentId");

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ error: "Invalid or missing student ID" }, { status: 400 });
    }

    if (auth.user.role === "student" && studentId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const submissions = (await Submission.find({ studentId })
      .select("createdAt total_score max_score")
      .sort({ createdAt: 1 })
      .lean()) as LeanSubmission[];

    const dayCounts = new Map<string, number>();
    let bestScorePercent = 0;

    submissions.forEach((submission) => {
      if (!submission?.createdAt) return;

      const created = new Date(submission.createdAt);
      const dayKey = toUtcDay(created);
      dayCounts.set(dayKey, (dayCounts.get(dayKey) || 0) + 1);

      const maxScore = Number(submission.max_score || 0);
      const totalScore = Number(submission.total_score || 0);
      if (maxScore > 0) {
        bestScorePercent = Math.max(bestScorePercent, (totalScore / maxScore) * 100);
      }
    });

    const sortedDays = Array.from(dayCounts.keys()).sort();
    const activeDaySet = new Set(sortedDays);

    const now = new Date();
    const todayKey = toUtcDay(now);
    const currentStreak = computeCurrentStreak(activeDaySet, todayKey);
    const longestStreak = computeLongestStreak(sortedDays);

    const last7Cutoff = new Date(now);
    last7Cutoff.setDate(last7Cutoff.getDate() - 6);

    const last30Cutoff = new Date(now);
    last30Cutoff.setDate(last30Cutoff.getDate() - 29);

    const testsLast7Days = submissions.filter((submission) => submission.createdAt && new Date(submission.createdAt) >= last7Cutoff).length;
    const testsLast30Days = submissions.filter((submission) => submission.createdAt && new Date(submission.createdAt) >= last30Cutoff).length;

    const recentActivity = Array.from({ length: 14 }, (_, i) => {
      const day = new Date();
      day.setUTCDate(day.getUTCDate() - (13 - i));
      const key = toUtcDay(day);
      return {
        date: key,
        count: dayCounts.get(key) || 0,
      };
    });

    const lastSubmissionAt = submissions.length > 0 && submissions[submissions.length - 1]?.createdAt
      ? new Date(submissions[submissions.length - 1].createdAt as string | Date).toISOString()
      : null;

    return NextResponse.json({
      totalSubmissions: submissions.length,
      activeDays: sortedDays.length,
      currentStreak,
      longestStreak,
      testsLast7Days,
      testsLast30Days,
      bestScorePercent: Number(bestScorePercent.toFixed(2)),
      lastSubmissionAt,
      recentActivity,
    });
  } catch (error: any) {
    console.error("Achievements API error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch achievements" }, { status: 500 });
  }
}
