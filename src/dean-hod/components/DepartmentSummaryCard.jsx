import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function TrendIndicator({ trend }) {
  if (trend === undefined || trend === null) {
    return null;
  }

  const value = Number(trend);

  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#36a66e]">
        <TrendingUp size={12} />+{value}%
      </span>
    );
  }

  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#e05252]">
        <TrendingDown size={12} />
        {value}%
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#8b98aa]">
      <Minus size={12} />0%
    </span>
  );
}

export default function DepartmentSummaryCard({
  department,
  totalStudents,
  avgAttendance,
  trend,
  pendingActions = 0,
  status = "active",
  onClick,
}) {
  const statusColors = {
    active: { bg: "bg-[#eaf8f2]", text: "text-[#27885e]" },
    warning: { bg: "bg-[#fff4e8]", text: "text-[#e58a27]" },
    critical: { bg: "bg-[#fff0f0]", text: "text-[#e05252]" },
  };

  const normalizedStatus = String(status || "active").toLowerCase();
  const colors = statusColors[normalizedStatus] || statusColors.active;

  return (
    <div
      className={`rounded-lg border border-[#e5eaf1] bg-white p-4 shadow-soft transition hover:shadow-md ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-[13px] font-bold text-[#1d4c86]">
              {department || "Unknown"}
            </h4>
            <span
              className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${colors.bg} ${colors.text}`}
            >
              {normalizedStatus}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase text-[#8b98aa]">
                Students
              </p>
              <p className="mt-0.5 text-[18px] font-bold text-[#1d4c86]">
                {totalStudents ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase text-[#8b98aa]">
                Avg Attendance
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <p className="text-[18px] font-bold text-[#1d4c86]">
                  {avgAttendance !== undefined && avgAttendance !== null
                    ? `${avgAttendance}%`
                    : "-"}
                </p>
                <TrendIndicator trend={trend} />
              </div>
            </div>
          </div>

          {pendingActions > 0 && (
            <div className="mt-3 rounded-md bg-[#fff4e8] px-2 py-1.5">
              <p className="text-[10px] font-semibold text-[#e58a27]">
                {pendingActions} pending action{pendingActions > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
