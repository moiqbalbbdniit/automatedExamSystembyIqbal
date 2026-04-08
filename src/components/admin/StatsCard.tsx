// components/admin/StatsCard.tsx
"use client";

import { Activity, Database, FileText, Users } from "lucide-react";

type Props = {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  icon?: "users" | "file" | "pulse" | "database";
};

function Icon({ name }: { name?: Props["icon"] }) {
  const cls = "h-4 w-4";
  switch (name) {
    case "users":
      return <Users className={cls} />;
    case "file":
      return <FileText className={cls} />;
    case "pulse":
      return <Activity className={cls} />;
    default:
      return <Database className={cls} />;
  }
}

export default function StatsCard({ title, value, subtitle, trend, icon }: Props) {
  return (
    <div className="panel group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/12 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</div>
          <div className="mt-2 text-3xl font-black text-foreground">{value}</div>
          {subtitle && <div className="mt-2 text-sm text-muted-foreground">{subtitle}</div>}
        </div>
        <div className="flex flex-col items-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-2 text-primary">
            <Icon name={icon} />
          </div>
          {trend && <div className="mt-2 text-xs font-semibold text-chart-2">{trend}</div>}
        </div>
      </div>
    </div>
  );
}
