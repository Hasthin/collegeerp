import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  Stethoscope,
  AlertTriangle,
  Heart,
  RefreshCw,
  Activity,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { authFetch } from "../../authFetch";
import AttendanceTrendChart from "../components/AttendanceTrendChart";
import AcademicComplianceTable from "../components/AcademicComplianceTable";
import DepartmentSummaryCard from "../components/DepartmentSummaryCard";

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ icon: Icon, label, value, description, iconClass, trend }) {
  return (
    <div className="rounded-lg border border-[#e5eaf1] bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-[#8b98aa]">
            {label}
          </p>
          <h2 className="mt-2 text-[28px] font-bold text-[#1d4c86]">{value}</h2>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-[11px] text-[#9aa7b6]">{description}</p>
            {trend !== undefined && trend !== null && (
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                  Number(trend) >= 0 ? "text-[#36a66e]" : "text-[#e05252]"
                }`}
              >
                {Number(trend) >= 0 ? (
                  <TrendingUp size={10} />
                ) : (
                  <TrendingDown size={10} />
                )}
                {Number(trend) >= 0 ? "+" : ""}
                {trend}%
              </span>
            )}
          </div>
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
   SECTION HEADER
========================================================= */

function SectionHeader({ title, description, action }) {
  return (
    <div className="flex items-center justify-between border-b border-[#edf0f4] px-4 py-3">
      <div>
        <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
          {title}
        </h3>
        <p className="mt-[2px] text-[11px] text-[#8d9aac]">{description}</p>
      </div>
      {action}
    </div>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({ icon: Icon, title, description, href }) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 rounded-lg border border-[#e7ebf1] bg-[#fafbfd] p-3 transition hover:border-[#cbdcf5] hover:bg-[#f7faff]"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eef5ff] text-[#2469c7]">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <strong className="block text-[12px] font-semibold text-[#344c69]">
          {title}
        </strong>
        <p className="mt-0.5 text-[11px] text-[#9aa7b6]">{description}</p>
      </div>
      <ArrowUpRight
        size={15}
        className="text-[#9aa7b6] transition group-hover:text-[#1b78ff]"
      />
    </a>
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
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

/* =========================================================
   MOCK DATA GENERATORS
========================================================= */

function generateAttendanceTrend() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map((month) => ({
    month,
    classroom: 75 + Math.floor(Math.random() * 18),
    clinical: 80 + Math.floor(Math.random() * 15),
  }));
}

function generateComplianceData() {
  return [
    { department: "Anatomy", hod: "Dr. Sharma", attendance: 92, internalMarks: "compliant", clinicalHours: 120, overall: "compliant" },
    { department: "Physiology", hod: "Dr. Patel", attendance: 88, internalMarks: "compliant", clinicalHours: 95, overall: "compliant" },
    { department: "Biochemistry", hod: "Dr. Kumar", attendance: 85, internalMarks: "partial", clinicalHours: 80, overall: "partial" },
    { department: "Pharmacology", hod: "Dr. Reddy", attendance: 78, internalMarks: "partial", clinicalHours: 70, overall: "partial" },
    { department: "Pathology", hod: "Dr. Gupta", attendance: 90, internalMarks: "compliant", clinicalHours: 110, overall: "compliant" },
    { department: "Microbiology", hod: "Dr. Nair", attendance: 82, internalMarks: "compliant", clinicalHours: 85, overall: "compliant" },
  ];
}

function generateDepartmentSummary() {
  return [
    { department: "Medicine", totalStudents: 150, avgAttendance: 88, trend: 3.2, pendingActions: 2, status: "active" },
    { department: "Surgery", totalStudents: 120, avgAttendance: 82, trend: -1.5, pendingActions: 5, status: "warning" },
    { department: "Pediatrics", totalStudents: 90, avgAttendance: 91, trend: 4.1, pendingActions: 0, status: "active" },
    { department: "Orthopedics", totalStudents: 75, avgAttendance: 76, trend: -3.2, pendingActions: 8, status: "critical" },
    { department: "ENT", totalStudents: 60, avgAttendance: 85, trend: 1.8, pendingActions: 1, status: "active" },
    { department: "Ophthalmology", totalStudents: 55, avgAttendance: 79, trend: -0.5, pendingActions: 3, status: "warning" },
  ];
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function ExecutiveOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [complianceData, setComplianceData] = useState([]);
  const [departments, setDepartments] = useState([]);

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      /* Try fetching from API, fallback to mock data */
      let trendData = [];
      let complianceRows = [];
      let deptData = [];

      try {
        const [trendRes, complianceRes, deptRes] = await Promise.all([
          authFetch("/api/dean/attendance-trend").then((r) =>
            r.ok ? r.json() : null
          ),
          authFetch("/api/dean/compliance").then((r) =>
            r.ok ? r.json() : null
          ),
          authFetch("/api/dean/departments").then((r) =>
            r.ok ? r.json() : null
          ),
        ]);

        trendData = normalizeArray(trendRes, ["data", "trend"]);
        complianceRows = normalizeArray(complianceRes, ["data", "compliance"]);
        deptData = normalizeArray(deptRes, ["data", "departments"]);
      } catch {
        /* API routes not available, use mock data */
      }

      setAttendanceTrend(
        trendData.length ? trendData : generateAttendanceTrend()
      );
      setComplianceData(
        complianceRows.length ? complianceRows : generateComplianceData()
      );
      setDepartments(
        deptData.length ? deptData : generateDepartmentSummary()
      );
    } catch (err) {
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =======================================================
     COMPUTED STATS
  ======================================================= */

  const totalStudents = useMemo(() => {
    return departments.reduce((sum, d) => sum + (d.totalStudents || 0), 0);
  }, [departments]);

  const avgAttendance = useMemo(() => {
    if (!departments.length) return 0;
    const total = departments.reduce(
      (sum, d) => sum + (d.avgAttendance || 0),
      0
    );
    return Math.round(total / departments.length);
  }, [departments]);

  const pendingActions = useMemo(() => {
    return departments.reduce((sum, d) => sum + (d.pendingActions || 0), 0);
  }, [departments]);

  const criticalDepts = useMemo(() => {
    return departments.filter((d) => d.status === "critical").length;
  }, [departments]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-[13px] text-[#68778c]">
          <RefreshCw size={17} className="animate-spin" />
          Loading Dean Dashboard...
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="space-y-3">
        <section className="rounded-lg bg-[#092f6d] px-6 py-5 text-white shadow-soft">
          <div className="flex items-center gap-2 text-[12px] font-bold tracking-[.4px]">
            <span className="h-2 w-2 rounded-full bg-[#75a8ff]" />
            DEAN / HOD PANEL
          </div>
          <h2 className="mt-2 text-[22px] font-bold">EXECUTIVE OVERVIEW</h2>
          <p className="mt-1 text-[13px] text-[#b8c9e6]">
            Monitor department performance, attendance, and compliance.
          </p>
        </section>

        <section className="rounded-lg border border-[#ffd6d6] bg-[#fff7f7] px-5 py-4">
          <div className="flex items-start gap-3">
            <Activity size={20} className="mt-0.5 shrink-0 text-[#e05252]" />
            <div className="flex-1">
              <h3 className="text-[14px] font-bold text-[#b83b3b]">
                Unable to load dashboard
              </h3>
              <p className="mt-1 text-[12px] text-[#8b5b5b]">{error}</p>
            </div>
            <button
              type="button"
              onClick={loadDashboard}
              className="flex items-center gap-1.5 rounded-lg bg-[#1b78ff] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#1560e0]"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </section>
      </div>
    );
  }

  /* =======================================================
     DASHBOARD
  ======================================================= */

  return (
    <div className="space-y-3">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <section className="rounded-lg bg-[#092f6d] px-6 py-5 text-white shadow-soft flex justify-between">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-bold tracking-[.4px]">
            <span className="h-2 w-2 rounded-full bg-[#75a8ff]" />
            DEAN / HOD PANEL
          </div>
          <h2 className="mt-2 text-[22px] font-bold">EXECUTIVE OVERVIEW</h2>
          <p className="mt-1 text-[13px] text-[#b8c9e6]">
            Monitor department performance, attendance trends, and academic
            compliance across all departments.
          </p>
        </div>
        <div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={loadDashboard}
              className="flex items-center gap-1.5 rounded-lg border border-[#e3e8ef] bg-white px-3 py-2 text-[11px] font-semibold text-[#51627c] hover:bg-[#f8fafc]"
            >
              <RefreshCw size={13} />
              Refresh Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          STAT CARDS
      ====================================================== */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={GraduationCap}
          label="TOTAL STUDENTS"
          value={totalStudents}
          description="Across all departments"
          iconClass="bg-[#eef5ff] text-[#2469c7]"
        />
        <StatCard
          icon={ClipboardCheck}
          label="AVG ATTENDANCE"
          value={`${avgAttendance}%`}
          description="Department average"
          trend={2.5}
          iconClass="bg-[#eaf8f2] text-[#36a66e]"
        />
        <StatCard
          icon={AlertTriangle}
          label="PENDING ACTIONS"
          value={pendingActions}
          description="Requires attention"
          iconClass="bg-[#fff4e8] text-[#e58a27]"
        />
        <StatCard
          icon={Stethoscope}
          label="CRITICAL DEPTS"
          value={criticalDepts}
          description="Below threshold"
          iconClass="bg-[#fff0f0] text-[#e05252]"
        />
      </section>

      {/* =====================================================
          ATTENDANCE TREND CHART + DEPARTMENT SUMMARY
      ====================================================== */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.5fr_1fr]">
        <AttendanceTrendChart
          data={attendanceTrend}
          title="ATTENDANCE TREND"
          description="Monthly attendance percentage across departments"
        />

        <section className="rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
          <SectionHeader
            title="DEPARTMENT SUMMARY"
            description="Quick overview of all departments"
          />
          <div className="divide-y divide-[#f0f2f5] p-4">
            {departments.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-[#8b98aa]">
                No departments found
              </p>
            ) : (
              departments.slice(0, 5).map((dept, index) => (
                <div
                  key={dept.department || index}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-[#344c69]">
                      {dept.department}
                    </p>
                    <p className="text-[11px] text-[#9aa7b6]">
                      {dept.totalStudents} students
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-[#1d4c86]">
                      {dept.avgAttendance}%
                    </p>
                    <span
                      className={`text-[10px] font-semibold ${
                        dept.status === "active"
                          ? "text-[#36a66e]"
                          : dept.status === "warning"
                          ? "text-[#e58a27]"
                          : "text-[#e05252]"
                      }`}
                    >
                      {dept.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* =====================================================
          DEPARTMENT CARDS
      ====================================================== */}
      <section className="rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        <SectionHeader
          title="DEPARTMENTS"
          description="Detailed department performance cards"
        />
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.length === 0 ? (
            <div className="col-span-full py-8 text-center text-[12px] text-[#8b98aa]">
              No departments found
            </div>
          ) : (
            departments.map((dept, index) => (
              <DepartmentSummaryCard
                key={dept.department || index}
                {...dept}
              />
            ))
          )}
        </div>
      </section>

      {/* =====================================================
          ACADEMIC COMPLIANCE TABLE
      ====================================================== */}
      <AcademicComplianceTable
        data={complianceData}
        title="ACADEMIC COMPLIANCE"
        description="Department-wise compliance status"
      />

      {/* =====================================================
          QUICK ACTIONS
      ====================================================== */}
      <section className="rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        <SectionHeader
          title="QUICK ACTIONS"
          description="Navigate to detailed reports"
        />
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            icon={ClipboardCheck}
            title="Classroom Attendance"
            description="View attendance details"
            href="/dean-hod/classroom-attendance"
          />
          <QuickAction
            icon={Stethoscope}
            title="Clinical Posting"
            description="Clinical posting reports"
            href="/dean-hod/clinical-posting"
          />
          <QuickAction
            icon={AlertTriangle}
            title="Bunking Analytics"
            description="Student bunking patterns"
            href="/dean-hod/bunking-analytics"
          />
          <QuickAction
            icon={Heart}
            title="Student Welfare"
            description="Welfare tracking & support"
            href="/dean-hod/student-welfare"
          />
        </div>
      </section>
    </div>
  );
}
