import React from "react";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

function StatusBadge({ status }) {
  const config = {
    compliant: {
      bg: "bg-[#eaf8f2]",
      text: "text-[#27885e]",
      icon: CheckCircle,
    },
    partial: {
      bg: "bg-[#fff4e8]",
      text: "text-[#e58a27]",
      icon: AlertTriangle,
    },
    non_compliant: {
      bg: "bg-[#fff0f0]",
      text: "text-[#e05252]",
      icon: XCircle,
    },
  };

  const normalized = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  const {
    bg,
    text,
    icon: Icon,
  } = config[normalized] || config.compliant;

  const label = normalized
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${bg} ${text}`}
    >
      <Icon size={12} />
      {label || status}
    </span>
  );
}

export default function AcademicComplianceTable({
  data = [],
  title = "Academic Compliance",
  description = "Department-wise academic compliance status",
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
      <div className="border-b border-[#edf0f4] px-4 py-3">
        <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
          {title}
        </h3>
        <p className="mt-[2px] text-[11px] text-[#8d9aac]">{description}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
              <th className="border-b border-[#edf0f4] px-4 py-3">Department</th>
              <th className="border-b border-[#edf0f4] px-4 py-3">Attendance</th>
              <th className="border-b border-[#edf0f4] px-4 py-3">Internal Marks</th>
              <th className="border-b border-[#edf0f4] px-4 py-3">Clinical Hours</th>
              <th className="border-b border-[#edf0f4] px-4 py-3">Overall</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-[12px] text-[#8b98aa]"
                >
                  No compliance data available
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.id ?? row.department ?? index}
                  className="border-b border-[#f0f2f5] text-[12px] hover:bg-[#fafcff]"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#1d4c86]">
                      {row.department || "-"}
                    </div>
                    {row.hod && (
                      <div className="mt-0.5 text-[11px] text-[#9aa7b6]">
                        HOD: {row.hod}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#e9eef5]">
                        <div
                          className="h-full rounded-full bg-[#1b78ff]"
                          style={{
                            width: `${Math.min(100, row.attendance || 0)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-[#4d5e76]">
                        {row.attendance || 0}%
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={row.internalMarks} />
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-semibold text-[#4d5e76]">
                      {row.clinicalHours || 0} hrs
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={row.overall} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
