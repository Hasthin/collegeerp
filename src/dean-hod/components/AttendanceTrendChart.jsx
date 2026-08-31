import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = {
  primary: "#1b78ff",
  success: "#36a66e",
  warning: "#e58a27",
  danger: "#e05252",
  purple: "#7654c7",
  grid: "#edf0f4",
  text: "#8b98aa",
  tooltipBg: "#092f6d",
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-[#e5eaf1] bg-white px-3 py-2 shadow-soft">
      <p className="mb-1 text-[11px] font-semibold text-[#344c69]">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-[11px]">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[#68778c]">{entry.name}:</span>
          <span className="font-semibold text-[#1d4c86]">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend({ payload }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
      {payload?.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5 text-[11px]">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[#68778c]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AttendanceTrendChart({
  data = [],
  title = "Attendance Trend",
  description = "Monthly attendance percentage across departments",
  height = 280,
  lines = [
    { key: "classroom", name: "Classroom", color: COLORS.primary },
    { key: "clinical", name: "Clinical", color: COLORS.success },
  ],
}) {
  if (!data.length) {
    return (
      <div className="rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        <div className="border-b border-[#edf0f4] px-4 py-3">
          <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
            {title}
          </h3>
          <p className="mt-[2px] text-[11px] text-[#8d9aac]">{description}</p>
        </div>
        <div className="flex items-center justify-center py-12 text-[12px] text-[#8b98aa]">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
      <div className="border-b border-[#edf0f4] px-4 py-3">
        <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
          {title}
        </h3>
        <p className="mt-[2px] text-[11px] text-[#8d9aac]">{description}</p>
      </div>

      <div className="p-4">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={COLORS.grid}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: COLORS.text }}
              axisLine={{ stroke: COLORS.grid }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: COLORS.text }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={2.5}
                dot={{ r: 4, fill: line.color, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, stroke: line.color, strokeWidth: 2, stroke: "#fff" }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
