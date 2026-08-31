import React, { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  RefreshCw,
  Search,
  Filter,
  Download,
  ChevronDown,
} from "lucide-react";
import { authFetch } from "../../authFetch";
import AttendanceTrendChart from "../components/AttendanceTrendChart";

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

function generateAttendanceRecords() {
  const departments = ["Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology", "Microbiology"];
  const records = [];
  for (let i = 1; i <= 20; i++) {
    const dept = departments[Math.floor(Math.random() * departments.length)];
    records.push({
      id: `ATT-${String(i).padStart(3, "0")}`,
      studentName: `Student ${i}`,
      rollNo: `MU-2024-${String(i).padStart(3, "0")}`,
      department: dept,
      year: ["1st Year", "2nd Year", "3rd Year"][Math.floor(Math.random() * 3)],
      date: `2026-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
      status: Math.random() > 0.2 ? "Present" : "Absent",
      attendancePercent: 70 + Math.floor(Math.random() * 25),
    });
  }
  return records;
}

function generateTrendData() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map((month) => ({
    month,
    classroom: 75 + Math.floor(Math.random() * 18),
  }));
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function ClassroomAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      let attendanceRecords = [];
      let trend = [];

      try {
        const [recordsRes, trendRes] = await Promise.all([
          authFetch("/api/dean/classroom-attendance").then((r) =>
            r.ok ? r.json() : null
          ),
          authFetch("/api/dean/attendance-trend").then((r) =>
            r.ok ? r.json() : null
          ),
        ]);

        attendanceRecords = normalizeArray(recordsRes, ["data", "records"]);
        trend = normalizeArray(trendRes, ["data", "trend"]);
      } catch {
        /* fallback to mock */
      }

      setRecords(
        attendanceRecords.length ? attendanceRecords : generateAttendanceRecords()
      );
      setTrendData(trend.length ? trend : generateTrendData());
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
        r.rollNo?.toLowerCase().includes(search.toLowerCase()) ||
        r.department?.toLowerCase().includes(search.toLowerCase());

      const matchDept = !filterDept || r.department === filterDept;
      const matchStatus = !filterStatus || r.status === filterStatus;

      return matchSearch && matchDept && matchStatus;
    });
  }, [records, search, filterDept, filterStatus]);

  const departments = useMemo(() => {
    return [...new Set(records.map((r) => r.department).filter(Boolean))];
  }, [records]);

  const presentCount = useMemo(
    () => records.filter((r) => r.status === "Present").length,
    [records]
  );

  const absentCount = useMemo(
    () => records.filter((r) => r.status === "Absent").length,
    [records]
  );

  const avgAttendance = useMemo(() => {
    if (!records.length) return 0;
    const total = records.reduce((s, r) => s + (r.attendancePercent || 0), 0);
    return Math.round(total / records.length);
  }, [records]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-[13px] text-[#68778c]">
          <RefreshCw size={17} className="animate-spin" />
          Loading attendance data...
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
          <h2 className="mt-2 text-[22px] font-bold">CLASSROOM ATTENDANCE</h2>
          <p className="mt-1 text-[13px] text-[#b8c9e6]">
            Track and monitor classroom attendance across all departments
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
          icon={ClipboardCheck}
          label="TOTAL RECORDS"
          value={records.length}
          description="Attendance records"
          iconClass="bg-[#eef5ff] text-[#2469c7]"
        />
        <StatCard
          icon={ClipboardCheck}
          label="PRESENT"
          value={presentCount}
          description={`${records.length ? Math.round((presentCount / records.length) * 100) : 0}% of total`}
          iconClass="bg-[#eaf8f2] text-[#36a66e]"
        />
        <StatCard
          icon={ClipboardCheck}
          label="ABSENT"
          value={absentCount}
          description={`${records.length ? Math.round((absentCount / records.length) * 100) : 0}% of total`}
          iconClass="bg-[#fff0f0] text-[#e05252]"
        />
        <StatCard
          icon={ClipboardCheck}
          label="AVG ATTENDANCE"
          value={`${avgAttendance}%`}
          description="Overall average"
          iconClass="bg-[#fff4e8] text-[#e58a27]"
        />
      </section>

      {/* TREND CHART */}
      <AttendanceTrendChart
        data={trendData}
        title="ATTENDANCE TREND"
        description="Monthly classroom attendance percentage"
        height={250}
        lines={[{ key: "classroom", name: "Classroom", color: "#1b78ff" }]}
      />

      {/* TABLE */}
      <div className="overflow-hidden rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        <div className="border-b border-[#edf0f4] px-4 py-3">
          <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
            ATTENDANCE RECORDS
          </h3>
          <p className="mt-[2px] text-[11px] text-[#8d9aac]">
            Detailed student attendance data
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
              placeholder="Search by name, roll no, department..."
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-[#e3e8ef] bg-white pl-3 pr-8 text-[12px] text-[#4d5e76] outline-none focus:border-[#1b78ff]"
            >
              <option value="">All Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>
            <ChevronDown
              size={12}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a4afbd]"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                <th className="border-b border-[#edf0f4] px-4 py-3">Roll No</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Student</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Department</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Year</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Date</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Status</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[12px] text-[#8b98aa]">
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
                      {record.year || "-"}
                    </td>
                    <td className="px-4 py-3 text-[#4d5e76]">{record.date || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                          record.status === "Present"
                            ? "bg-[#eaf8f2] text-[#27885e]"
                            : "bg-[#fff0f0] text-[#e05252]"
                        }`}
                      >
                        {record.status || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#e9eef5]">
                          <div
                            className="h-full rounded-full bg-[#1b78ff]"
                            style={{
                              width: `${Math.min(100, record.attendancePercent || 0)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-[#4d5e76]">
                          {record.attendancePercent || 0}%
                        </span>
                      </div>
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
