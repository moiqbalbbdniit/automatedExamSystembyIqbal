// components/admin/StatsCard.tsx
"use client";

type Props = {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  icon?: "users" | "file" | "pulse" | "database";
};

function Icon({ name }: { name?: Props["icon"] }) {
  const cls = "w-6 h-6 text-red-700";
  switch (name) {
    case "users": return <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case "file": return <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case "pulse": return <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M22 12h-4l-3 8-4-16-3 8H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    default: return <svg className={cls} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" /></svg>;
  }
}

export default function StatsCard({ title, value, subtitle, trend, icon }: Props) {
  return (
    <div className="bg-gray-800 text-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-white">{title}</div>
          <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
          {subtitle && <div className="text-sm text-white mt-2">{subtitle}</div>}
        </div>
        <div className="flex flex-col items-end">
          <div className="p-2  rounded-md">
            <Icon name={icon} />
          </div>
          {trend && <div className="text-sm text-green-500 mt-2">{trend}</div>}
        </div>
      </div>
    </div>
  );
}
