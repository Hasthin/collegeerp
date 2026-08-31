import React, { useEffect, useMemo, useState } from "react";
import {
  Heart,
  RefreshCw,
  Search,
  ChevronDown,
  Download,
  Plus,
  Edit3,
  Trash2,
  X,
  Loader2,
  Phone,
  Mail,
} from "lucide-react";
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
   MODAL
========================================================= */

function Modal({ open, onClose, title, subtitle, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-[500px] rounded-xl border border-[#e5eaf1] bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-[#edf0f4] px-5 py-4">
          <div>
            <h3 className="text-[15px] font-bold text-[#1a345c]">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-[11px] text-[#8b98aa]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-[#8b98aa] hover:bg-[#f0f4f8]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
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

function generateWelfareRecords() {
  const departments = ["Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology", "Microbiology"];
  const types = ["Academic", "Health", "Financial", "Psychological", "Personal"];
  const statuses = ["Active", "Resolved", "Pending"];
  const records = [];
  for (let i = 1; i <= 20; i++) {
    const dept = departments[Math.floor(Math.random() * departments.length)];
    records.push({
      id: `WR-${String(i).padStart(3, "0")}`,
      studentName: `Student ${i}`,
      rollNo: `MU-2024-${String(i).padStart(3, "0")}`,
      department: dept,
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
      date: `2026-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
      description: `Welfare concern reported for student ${i}`,
      contactEmail: `student${i}@medico.edu`,
      contactPhone: `+91 98765 ${String(432100 + i).slice(0, 4)}${String(i).padStart(2, "0")}`,
      counselor: [`Dr. Singh`, `Dr. Patel`, `Dr. Kumar`, `Dr. Sharma`][Math.floor(Math.random() * 4)],
    });
  }
  return records;
}

/* =========================================================
   WELFARE FORM
========================================================= */

function WelfareForm({ initial, onSave, saving }) {
  const [form, setForm] = useState({
    studentName: "",
    rollNo: "",
    department: "",
    type: "Academic",
    priority: "Medium",
    description: "",
    counselor: "",
    ...initial,
  });

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-[#344c69]">
            Student Name *
          </label>
          <input
            value={form.studentName}
            onChange={(e) => update("studentName", e.target.value)}
            className="h-9 w-full rounded-lg border border-[#e3e8ef] px-3 text-[12px] outline-none focus:border-[#1b78ff]"
            placeholder="Enter student name"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-[#344c69]">
            Roll No *
          </label>
          <input
            value={form.rollNo}
            onChange={(e) => update("rollNo", e.target.value)}
            className="h-9 w-full rounded-lg border border-[#e3e8ef] px-3 text-[12px] outline-none focus:border-[#1b78ff]"
            placeholder="Enter roll number"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-[#344c69]">
            Department
          </label>
          <input
            value={form.department}
            onChange={(e) => update("department", e.target.value)}
            className="h-9 w-full rounded-lg border border-[#e3e8ef] px-3 text-[12px] outline-none focus:border-[#1b78ff]"
            placeholder="Enter department"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-[#344c69]">
            Type
          </label>
          <select
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
            className="h-9 w-full rounded-lg border border-[#e3e8ef] px-3 text-[12px] text-[#4d5e76] outline-none focus:border-[#1b78ff]"
          >
            <option value="Academic">Academic</option>
            <option value="Health">Health</option>
            <option value="Financial">Financial</option>
            <option value="Psychological">Psychological</option>
            <option value="Personal">Personal</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-[#344c69]">
            Priority
          </label>
          <select
            value={form.priority}
            onChange={(e) => update("priority", e.target.value)}
            className="h-9 w-full rounded-lg border border-[#e3e8ef] px-3 text-[12px] text-[#4d5e76] outline-none focus:border-[#1b78ff]"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-[#344c69]">
            Counselor
          </label>
          <input
            value={form.counselor}
            onChange={(e) => update("counselor", e.target.value)}
            className="h-9 w-full rounded-lg border border-[#e3e8ef] px-3 text-[12px] outline-none focus:border-[#1b78ff]"
            placeholder="Assigned counselor"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-semibold text-[#344c69]">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-[#e3e8ef] px-3 py-2 text-[12px] outline-none focus:border-[#1b78ff]"
          placeholder="Describe the welfare concern..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !form.studentName || !form.rollNo}
          className="flex items-center gap-1.5 rounded-lg bg-[#1b78ff] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1560e0] disabled:opacity-60"
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          Save Record
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function StudentWelfarePage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      let welfareRecords = [];

      try {
        const res = await authFetch("/api/dean/welfare").then((r) =>
          r.ok ? r.json() : null
        );
        welfareRecords = normalizeArray(res, ["data", "records"]);
      } catch {
        /* fallback to mock */
      }

      setRecords(welfareRecords.length ? welfareRecords : generateWelfareRecords());
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

      const matchType = !filterType || r.type === filterType;
      const matchStatus = !filterStatus || r.status === filterStatus;

      return matchSearch && matchType && matchStatus;
    });
  }, [records, search, filterType, filterStatus]);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditing(record);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editing) {
        setRecords((prev) =>
          prev.map((r) => (r.id === editing.id ? { ...r, ...form } : r))
        );
      } else {
        const newRecord = {
          ...form,
          id: `WR-${String(records.length + 1).padStart(3, "0")}`,
          date: new Date().toISOString().split("T")[0],
          status: "Active",
        };
        setRecords((prev) => [newRecord, ...prev]);
      }
      setModalOpen(false);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const activeCount = useMemo(
    () => records.filter((r) => r.status === "Active").length,
    [records]
  );

  const pendingCount = useMemo(
    () => records.filter((r) => r.status === "Pending").length,
    [records]
  );

  const highPriority = useMemo(
    () => records.filter((r) => r.priority === "High").length,
    [records]
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-[13px] text-[#68778c]">
          <RefreshCw size={17} className="animate-spin" />
          Loading welfare data...
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
          <h2 className="mt-2 text-[22px] font-bold">STUDENT WELFARE</h2>
          <p className="mt-1 text-[13px] text-[#b8c9e6]">
            Track and manage student welfare concerns, counseling, and support
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
            onClick={handleAdd}
            className="flex items-center gap-1.5 rounded-lg bg-[#1b78ff] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#1560e0]"
          >
            <Plus size={13} />
            Add Record
          </button>
        </div>
      </section>

      {/* STAT CARDS */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Heart}
          label="TOTAL RECORDS"
          value={records.length}
          description="Welfare cases tracked"
          iconClass="bg-[#eef5ff] text-[#2469c7]"
        />
        <StatCard
          icon={Heart}
          label="ACTIVE CASES"
          value={activeCount}
          description="Currently being addressed"
          iconClass="bg-[#eaf8f2] text-[#36a66e]"
        />
        <StatCard
          icon={Heart}
          label="PENDING REVIEW"
          value={pendingCount}
          description="Awaiting counselor review"
          iconClass="bg-[#fff4e8] text-[#e58a27]"
        />
        <StatCard
          icon={Heart}
          label="HIGH PRIORITY"
          value={highPriority}
          description="Requires immediate attention"
          iconClass="bg-[#fff0f0] text-[#e05252]"
        />
      </section>

      {/* TABLE */}
      <div className="overflow-hidden rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        <div className="border-b border-[#edf0f4] px-4 py-3">
          <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
            WELFARE RECORDS
          </h3>
          <p className="mt-[2px] text-[11px] text-[#8d9aac]">
            Student welfare tracking and management
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
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-9 appearance-none rounded-lg border border-[#e3e8ef] bg-white pl-3 pr-8 text-[12px] text-[#4d5e76] outline-none focus:border-[#1b78ff]"
            >
              <option value="">All Types</option>
              <option value="Academic">Academic</option>
              <option value="Health">Health</option>
              <option value="Financial">Financial</option>
              <option value="Psychological">Psychological</option>
              <option value="Personal">Personal</option>
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
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
            </select>
            <ChevronDown
              size={12}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a4afbd]"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                <th className="border-b border-[#edf0f4] px-4 py-3">Roll No</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Student</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Department</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Type</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Priority</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Counselor</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Status</th>
                <th className="border-b border-[#edf0f4] px-4 py-3">Actions</th>
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
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[#9aa7b6]">
                        {record.contactEmail && (
                          <span className="flex items-center gap-0.5">
                            <Mail size={9} /> {record.contactEmail}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#4d5e76]">
                      {record.department || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#2469c7]">
                        {record.type || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                          record.priority === "High"
                            ? "bg-[#fff0f0] text-[#e05252]"
                            : record.priority === "Medium"
                            ? "bg-[#fff4e8] text-[#e58a27]"
                            : "bg-[#eaf8f2] text-[#27885e]"
                        }`}
                      >
                        {record.priority || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#4d5e76]">
                      {record.counselor || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                          record.status === "Active"
                            ? "bg-[#eaf8f2] text-[#27885e]"
                            : record.status === "Pending"
                            ? "bg-[#fff4e8] text-[#e58a27]"
                            : "bg-[#f2edff] text-[#7654c7]"
                        }`}
                      >
                        {record.status || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(record)}
                          className="grid h-7 w-7 place-items-center rounded-md text-[#68778c] hover:bg-[#f0f4f8] hover:text-[#1b78ff]"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(record.id)}
                          className="grid h-7 w-7 place-items-center rounded-md text-[#68778c] hover:bg-[#fff0f0] hover:text-[#e05252]"
                        >
                          <Trash2 size={13} />
                        </button>
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

      {/* MODAL */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit Welfare Record" : "Add Welfare Record"}
        subtitle={
          editing
            ? "Update the welfare record details"
            : "Create a new welfare tracking record"
        }
      >
        <WelfareForm
          initial={editing}
          onSave={handleSave}
          saving={saving}
        />
      </Modal>
    </div>
  );
}
