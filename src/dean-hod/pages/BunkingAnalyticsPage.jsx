import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronDown,
  Download,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { authFetch } from "../../authFetch";

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ icon: Icon, label, value, description, iconClass }) {
  return (
    <div className="rounded-lg border border-[#e5eaf1] bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-[#8b98aa]">
            {label}
          </p>
          <h2 className="mt-2 text-[28px] font-bold text-[#1d4c86]">{value}</h2>
          <p className="mt-1 text-[11px] text-[#9aa7b6]">{description}</p>
        </div>
        <div
          className={`grid h-11 w-11 place-items-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CUSTOM TOOLTIP
========================================================= */

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
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
          <span className="font-semibold text-[#1d4c86]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   SAFE ARRAY NORMALIZER
========================================================= */

function normalizeArray(data, keys = []) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

/* =========================================================
   MOCK DATA
========================================================= */

function generateBunkingRecords() {
  const departments = ["Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology", "Microbiology"];
  const reasons = ["Personal", "Medical", "Family Emergency", "No Reason", "Transport Issue"];
  const records = [];
  for (let i = 1; i <= 25; i++) {
    const dept = departments[Math.floor(Math.random() * departments.length)];
    records.push({
      id: `BNK-${String(i).padStart(3, "0")}`,
      studentName: `Student ${i}`,
      rollNo: `MU-2024-${String(i).padStart(3, "0")}`,
      department: dept,
      date: `2026-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
      subject: ["Anatomy", "Physiology", "Biochem", "Pharma"][Math.floor(Math.random() * 4)],
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      bunkCount: 1 + Math.floor(Math.random() * 8),
      totalClasses: 40 + Math.floor(Math.random() * 20),
      riskLevel: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
    });
  }
  return records;
}

function generateDeptBunkingData() {
  const departments = ["Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology", "Microbiology"];
  return departments.map((dept) => ({
    department: dept,
    bunked: 5 + Math.floor(Math.random() * 20),
    attended: 80 + Math.floor(Math.random() * 15),
  }));
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function BunkingAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterRisk, setFilterRisk] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      let bunkingRecords = [];
      let deptData = [];

      try {
        const [recordsRes, chartRes] = await Promise.all([
          authFetch("/api/dean/bunking").then((r) => (r.ok ? r.json() : null)),
          authFetch("/api/dean/bunking-by-dept").then((r) =>
            r.ok ? r.json() : null
          ),
        ]);

        bunkingRecords = normalizeArray(recordsRes, ["data", "records"]);
        deptData = normalizeArray(chartRes, ["data", "departments"]);
      } catch {
        /* fallback to mock */
      }

      setRecords(bunkingRecords.length ? bunkingRecords : generateBunkingRecords());
      setChartData(deptData.length ? deptData : generateDeptBunkingData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        !search ||
        r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
        r.rollNo?.toLowerCase().includes(search.toLowerCase());

      const matchDept = !filterDept || r.department === filterDept;
      const matchRisk = !filterRisk || r.riskLevel === filterRisk;

      return matchSearch && matchDept && matchRisk;
    });
  }, [records, search, filterDept, filterRisk]);

  const departments = useMemo(() => {
    return [...new Set(records.map((r) => r.department).filter(Boolean))];
  }, [records]);

  const totalBunked = useMemo(
    () => records.reduce((s, r) => s + (r.bunkCount || 0), 0),
    [records]
  );

  const highRiskCount = useMemo(
    () => records.filter((r) => r.riskLevel === "High").length,
    [records]
  );

  const avgBunkRate = useMemo(() => {
    if (!records.length) return 0;
    const total = records.reduce((s, r) => {
      const rate = r.totalClasses
        ? (r.bunkCount / r.totalClasses) * 100
        : 0;
      return s + rate;
    }, 0);
    return Math.round(total / records.length);
  }, [records]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-[13px] text-[#68778c]">
          <RefreshCw size={17} className="animate-spin" />
          Loading bunking analytics...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* HEADER */}
      <section className="rounded-lg bg-[#092f6d] px-6 py-5 text-white shadow-soft flex justify-between">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-bold tracking-[.4px]">
            <span className="h-2 w-2 rounded-full bg-[#75a8ff]" />
            DEAN / HOD PANEL
          </div>
          <h2 className="mt-2 text-[22px] font-bold">BUNKING ANALYTICS</h2>
          <p className="mt-1 text-[13px] text-[#b8c9e6]">
            Analyze student bunking patterns, risk levels, and department-wise trends
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-lg border border-[#e3e8ef] bg-white px-3 py-2 text-[11px] font-semibold text-[#51627c] hover:bg-[#f8fafc]"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-[#e3e8ef] bg-white px-3 py-2 text-[11px] font-semibold text-[#51627c] hover:bg-[#f8fafc]"
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </section>

      {/* STAT CARDS */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={AlertTriangle}
          label="TOTAL BUNKS"
          value={totalBunked}
          description="Classes bunked this month"
          iconClass="bg-[#fff0f0] text-[#e05252]"
        />
        <StatCard
          icon={AlertTriangle}
          label="HIGH RISK STUDENTS"
          value={highRiskCount}
          description="Require immediate attention"
          iconClass="bg-[#fff4e8] text-[#e58a27]"
        />
        <StatCard
          icon={TrendingUp}
          label="AVG BUNK RATE"
          value={`${avgBunkRate}%`}
          description="Across all students"
          iconClass="bg-[#eef5ff] text-[#2469c7]"
        />
        <StatCard
          icon={AlertTriangle}
          label="STUDENTS TRACKED"
          value={records.length}
          description="Active monitoring"
          iconClass="bg-[#f2edff] text-[#7654c7]"
        />
      </section>

      {/* CHART */}
      <div className="rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        <div className="border-b border-[#edf0f4] px-4 py-3">
          <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
            DEPARTMENT-WISE BUNKING
          </h3>
          <p className="mt-[2px] text-[11px] text-[#8d9aac]">
            Classes bunked vs attended by department
          </p>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#edf0f4"
                vertical={false}
              />
              <XAxis
                dataKey="department"
                tick={{ fontSize: 11, fill: "#8b98aa" }}
                axisLine={{ stroke: "#edf0f4" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#8b98aa" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value) => (
                  <span style={{ color: "#68778c" }}>{value}</span>
                )}
              />
              <Bar
                dataKey="bunked"
                name="Bunked"
                fill="#e05252"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Bar
                dataKey="attended"
                name="Attended"
                fill="#36a66e"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        <div className="border-b border-[#edf0f4] px-4 py-3">
          <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
            BUNKING RECORDS
          </h3>
          <p className="mt-[2px] text-[11px] text-[#8d9aac]">
            Detailed student bunking history
          </p>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#edf0f4] px-4 py-3">
          <div className="relative flex-1 sm:max-w-[240px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a4afbd]"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll no..."
              className="h-9 w-full rounded-lg border border-[#e3e8ef] pl-8 pr-3 text-[12px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30"
            />
          </div>

          <div className="relative">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-[#e3e8ef] bg-white pl-3 pr-8 text-[12px] text-[#4d5e76] outline-none focus:border-[#1b78ff]"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a4afbd]"
            />
          </div>

          <div className="relative">
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-[#e3e8ef] bg-white pl-3 pr-8 text-[12px] text-[#4d5e76] outline-none focus:border-[#1b78ff]"
            >
              <option value="">All Risk Levels</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <ChevronDown
              size={12}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a4afbd]"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                <th className="border-b border-[#edf0f4] px-4 py-3">Roll No</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Student</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Department</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Subject</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Date</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Reason</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Bunks</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[12px] text-[#8b98aa]">
                    No records found
                  </td>
                </tr>
              ) : (
                filtered.map((record, index) => (
                  <tr
                    key={record.id || index}
                    className="border-b border-[#f0f2f5] text-[12px] hover:bg-[#fafcff]"
                  >
                    <td className="px-4 py-3 font-semibold text-[#4d5e76]">
                      {record.rollNo || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#1d4c86]">
                        {record.studentName || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#4d5e76]">
                      {record.department || "-"}
                    </td>
                    <td className="px-4 py-3 text-[#4d5e76]">
                      {record.subject || "-"}
                    </td>
                    <td className="px-4 py-3 text-[#4d5e76]">
                      {record.date || "-"}
                    </td>
                    <td className="px-4 py-3 text-[#4d5e76]">
                      {record.reason || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#e05252]">
                        {record.bunkCount || 0}
                      </span>
                      <span className="text-[#8b98aa]">
                        /{record.totalClasses || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                          record.riskLevel === "High"
                            ? "bg-[#fff0f0] text-[#e05252]"
                            : record.riskLevel === "Medium"
                            ? "bg-[#fff4e8] text-[#e58a27]"
                            : "bg-[#eaf8f2] text-[#27885e]"
                        }`}
                      >
                        {record.riskLevel || "-"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#edf0f4] px-4 py-2.5">
          <span className="text-[11px] text-[#8b98aa]">
            Showing {filtered.length} of {records.length} records
          </span>
        </div>
      </div>
    </div>
  );
}
