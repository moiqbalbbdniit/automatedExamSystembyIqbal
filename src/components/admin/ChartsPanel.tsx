// components/admin/ChartsPanel.tsx
"use client";



const areaData = [
  { week: "W1", Java: 60, DBMS: 45, OOPS: 30 },
  { week: "W2", Java: 68, DBMS: 50, OOPS: 35 },
  { week: "W3", Java: 72, DBMS: 55, OOPS: 40 },
  { week: "W4", Java: 78, DBMS: 60, OOPS: 50 },
];

const pieData = [
  { name: "Java", value: 40 },
  { name: "DBMS", value: 25 },
  { name: "OOPS", value: 20 },
  { name: "OS", value: 10 },
  { name: "Other", value: 5 },
];

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";


const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#9ca3af"];

export default function ChartsPanel() {

  const [lineData, setLineData] = useState([]);
  const [pieDataState, setPieDataState] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/analytics");
        const data = await res.json();
        setLineData(data.areaData || []);
        setPieDataState(data.pieData || []);
      } catch (err) {
        console.error("Failed to fetch chart data", err);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="w-full grid grid-cols-1 gap-6">
      {/* ===== Area Chart ===== */}
      <div className="bg-gray-700 rounded-lg p-4 shadow-sm border h-64">
        <h4 className="bg-gray-700 font-medium mb-2">Topic Performance (Last 4 weeks)</h4>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={areaData}>
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="Java" stroke="#4f46e5" fill="#eef2ff" />
            <Area type="monotone" dataKey="DBMS" stroke="#06b6d4" fill="#ecfeff" />
            <Area type="monotone" dataKey="OOPS" stroke="#10b981" fill="#ecfdf5" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ===== Line Chart ===== */}
      <div className="bg-gray-800 rounded-xl p-4 shadow-md border border-gray-700 flex flex-col h-[350px] sm:h-[400px]">
        <h4 className="text-white font-medium mb-3 text-sm sm:text-base text-center sm:text-left">
          Total Exams (Course-wise)
        </h4>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <XAxis dataKey="course" stroke="#ccc" tick={{ fontSize: 12 }} />
              <YAxis stroke="#ccc" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="totalExams"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ r: 5, fill: "#06b6d4" }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== Pie Chart ===== */}
        <div className="bg-gray-700 rounded-xl p-6 shadow-md border w-full max-w-full">
      <h4 className="text-lg font-semibold text-white mb-6 text-center">
        Course Distribution (B.Tech)
      </h4>

      <div className="w-full h-[260px] sm:h-[320px] md:h-[420px] lg:h-[500px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieDataState}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="70%"
              label={({ name, percent }) =>
                window.innerWidth >= 640 ? `${name} ${(percent as number * 100).toFixed(0)}%` : ""
              }
            >
              {pieDataState.map((entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="#1f2937"
                  strokeWidth={1}
                />
              ))}
            </Pie>

            <Tooltip
              wrapperStyle={{
                zIndex: 50,
              }}
              contentStyle={{
                backgroundColor: "#8eed21ff",
                border: "none",
                borderRadius: "8px",
                color: "#f3f4f6",
                fontSize: "0.85rem",
              }}
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
            />

            <Legend
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                color: "#f3f4f6",
                fontSize: "0.85rem",
                paddingTop: "10px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  


    </div>
  );
}