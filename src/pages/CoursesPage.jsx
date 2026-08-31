import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  Edit3,
} from "lucide-react";

import { authFetch } from "../authFetch";

// ============================================================
// MODAL
// ============================================================

function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/40"
        aria-label="Close modal"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-lg rounded-xl border border-[#e5eaf1] bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[#edf0f4] px-6 py-4">
            <div>
              <h2 className="text-[18px] font-bold text-[#1a345c]">
                {title}
              </h2>

              <p className="mt-1 text-[11px] text-[#8d9aac]">
                {title.includes("Edit")
                  ? "Update information"
                  : "Create a new entry"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-[#8b98aa] hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({ label, value, color = "blue" }) {
  const colorMap = {
    blue: "text-[#2469c7]",
    green: "text-[#36a66e]",
    gray: "text-[#8b98aa]",
  };

  return (
    <div className="rounded-lg border border-[#e7ebf1] bg-white px-4 py-3 shadow-soft">
      <span className="block text-[11px] font-medium text-[#8b98aa]">
        {label}
      </span>

      <strong
        className={`mt-1 block text-[24px] font-bold ${colorMap[color]}`}
      >
        {value}
      </strong>
    </div>
  );
}

// ============================================================
// COURSE FORM
// ============================================================

function CourseForm({ item, onSave, onCancel }) {
  const isEdit = Boolean(item);

  const [form, setForm] = useState({
    course_name: item?.course_name || "",
    course_code: item?.course_code || "",
    duration_years: item?.duration_years || "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      course_name: item?.course_name || "",
      course_code: item?.course_code || "",
      duration_years: item?.duration_years || "",
    });
    setError("");
  }, [item]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const course_name = String(form.course_name || "").trim();
    const course_code = String(form.course_code || "").trim();
    const duration_years = String(form.duration_years || "").trim();

    if (!course_name) {
      setError("Course name is required.");
      return;
    }

    if (!course_code) {
      setError("Course code is required.");
      return;
    }

    try {
      setSaving(true);
      await onSave({ course_name, course_code, duration_years });
    } catch (err) {
      console.error("COURSE SAVE ERROR:", err);
      setError(err?.message || "Unable to save course. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Course Name <span className="text-[#e05252]">*</span>
          </label>

          <input
            type="text"
            value={form.course_name}
            onChange={handleChange("course_name")}
            placeholder="Bachelor of Medicine and Surgery"
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Course Code <span className="text-[#e05252]">*</span>
          </label>

          <input
            type="text"
            value={form.course_code}
            onChange={handleChange("course_code")}
            placeholder="MBBS"
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Duration (Years)
          </label>

          <input
            type="number"
            value={form.duration_years}
            onChange={handleChange("duration_years")}
            placeholder="5"
            min="1"
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-[#e3e8ef] bg-white px-4 py-2 text-[13px] font-semibold text-[#51627c] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#1b78ff] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(27,120,255,.25)] hover:bg-[#1560e0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}

          {saving ? "Saving..." : isEdit ? "Update Course" : "Save Course"}
        </button>
      </div>
    </form>
  );
}

// ============================================================
// BRANCH FORM
// ============================================================

function BranchForm({ item, courses, onSave, onCancel }) {
  const isEdit = Boolean(item);

  const [form, setForm] = useState({
    course_id: item?.course_id || "",
    branch_name: item?.branch_name || "",
    branch_code: item?.branch_code || "",
    hod_name: item?.hod_name || "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      course_id: item?.course_id || "",
      branch_name: item?.branch_name || "",
      branch_code: item?.branch_code || "",
      hod_name: item?.hod_name || "",
    });
    setError("");
  }, [item]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const course_id = String(form.course_id || "").trim();
    const branch_name = String(form.branch_name || "").trim();
    const branch_code = String(form.branch_code || "").trim();
    const hod_name = String(form.hod_name || "").trim();

    if (!course_id) {
      setError("Course is required.");
      return;
    }

    if (!branch_name) {
      setError("Branch name is required.");
      return;
    }

    if (!branch_code) {
      setError("Branch code is required.");
      return;
    }

    try {
      setSaving(true);
      await onSave({ course_id, branch_name, branch_code, hod_name });
    } catch (err) {
      console.error("BRANCH SAVE ERROR:", err);
      setError(err?.message || "Unable to save branch. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Course <span className="text-[#e05252]">*</span>
          </label>

          <select
            value={form.course_id}
            onChange={handleChange("course_id")}
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          >
            <option value="">Select Course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Branch Name <span className="text-[#e05252]">*</span>
          </label>

          <input
            type="text"
            value={form.branch_name}
            onChange={handleChange("branch_name")}
            placeholder="General Medicine"
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Branch Code <span className="text-[#e05252]">*</span>
          </label>

          <input
            type="text"
            value={form.branch_code}
            onChange={handleChange("branch_code")}
            placeholder="GM"
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            HOD Name
          </label>

          <input
            type="text"
            value={form.hod_name}
            onChange={handleChange("hod_name")}
            placeholder="Dr. Smith"
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-[#e3e8ef] bg-white px-4 py-2 text-[13px] font-semibold text-[#51627c] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#1b78ff] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(27,120,255,.25)] hover:bg-[#1560e0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}

          {saving ? "Saving..." : isEdit ? "Update Branch" : "Save Branch"}
        </button>
      </div>
    </form>
  );
}

// ============================================================
// SEMESTER FORM
// ============================================================

function SemesterForm({ item, branches, onSave, onCancel }) {
  const isEdit = Boolean(item);

  const [form, setForm] = useState({
    branch_id: item?.branch_id || "",
    semester_number: item?.semester_number || "",
    regulation: item?.regulation || "",
    academic_year: item?.academic_year || "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      branch_id: item?.branch_id || "",
      semester_number: item?.semester_number || "",
      regulation: item?.regulation || "",
      academic_year: item?.academic_year || "",
    });
    setError("");
  }, [item]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const branch_id = String(form.branch_id || "").trim();
    const semester_number = String(form.semester_number || "").trim();
    const regulation = String(form.regulation || "").trim();
    const academic_year = String(form.academic_year || "").trim();

    if (!branch_id) {
      setError("Branch is required.");
      return;
    }

    if (!semester_number) {
      setError("Semester number is required.");
      return;
    }

    try {
      setSaving(true);
      await onSave({ branch_id, semester_number, regulation, academic_year });
    } catch (err) {
      console.error("SEMESTER SAVE ERROR:", err);
      setError(err?.message || "Unable to save semester. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Branch <span className="text-[#e05252]">*</span>
          </label>

          <select
            value={form.branch_id}
            onChange={handleChange("branch_id")}
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          >
            <option value="">Select Branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.course_name} - {b.branch_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Semester Number <span className="text-[#e05252]">*</span>
          </label>

          <select
            value={form.semester_number}
            onChange={handleChange("semester_number")}
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          >
            <option value="">Select Semester</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Regulation
          </label>

          <input
            type="text"
            value={form.regulation}
            onChange={handleChange("regulation")}
            placeholder="R2021"
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Academic Year
          </label>

          <input
            type="text"
            value={form.academic_year}
            onChange={handleChange("academic_year")}
            placeholder="2025-2026"
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-[#e3e8ef] bg-white px-4 py-2 text-[13px] font-semibold text-[#51627c] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#1b78ff] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(27,120,255,.25)] hover:bg-[#1560e0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}

          {saving
            ? "Saving..."
            : isEdit
            ? "Update Semester"
            : "Save Semester"}
        </button>
      </div>
    </form>
  );
}

// ============================================================
// SUBJECT FORM
// ============================================================

function SubjectForm({ item, semesters, onSave, onCancel }) {
  const isEdit = Boolean(item);

  const [form, setForm] = useState({
    semester_id: item?.semester_id || "",
    subject_name: item?.subject_name || "",
    subject_code: item?.subject_code || "",
    credits: item?.credits || "",
    subject_type: item?.subject_type || "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      semester_id: item?.semester_id || "",
      subject_name: item?.subject_name || "",
      subject_code: item?.subject_code || "",
      credits: item?.credits || "",
      subject_type: item?.subject_type || "",
    });
    setError("");
  }, [item]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const semester_id = String(form.semester_id || "").trim();
    const subject_name = String(form.subject_name || "").trim();
    const subject_code = String(form.subject_code || "").trim();
    const credits = String(form.credits || "").trim();
    const subject_type = String(form.subject_type || "").trim();

    if (!semester_id) {
      setError("Semester is required.");
      return;
    }

    if (!subject_name) {
      setError("Subject name is required.");
      return;
    }

    if (!subject_code) {
      setError("Subject code is required.");
      return;
    }

    try {
      setSaving(true);
      await onSave({
        semester_id,
        subject_name,
        subject_code,
        credits,
        subject_type,
      });
    } catch (err) {
      console.error("SUBJECT SAVE ERROR:", err);
      setError(err?.message || "Unable to save subject. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Semester <span className="text-[#e05252]">*</span>
          </label>

          <select
            value={form.semester_id}
            onChange={handleChange("semester_id")}
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          >
            <option value="">Select Semester</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.course_name} - {s.branch_name} - Sem {s.semester_number}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Subject Name <span className="text-[#e05252]">*</span>
          </label>

          <input
            type="text"
            value={form.subject_name}
            onChange={handleChange("subject_name")}
            placeholder="Anatomy"
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Subject Code <span className="text-[#e05252]">*</span>
          </label>

          <input
            type="text"
            value={form.subject_code}
            onChange={handleChange("subject_code")}
            placeholder="ANAT101"
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Credits
          </label>

          <input
            type="number"
            value={form.credits}
            onChange={handleChange("credits")}
            placeholder="4"
            min="0"
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Subject Type
          </label>

          <select
            value={form.subject_type}
            onChange={handleChange("subject_type")}
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          >
            <option value="">Select Type</option>
            <option value="Theory">Theory</option>
            <option value="Practical">Practical</option>
            <option value="Theory+Practical">Theory+Practical</option>
            <option value="Elective">Elective</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-[#e3e8ef] bg-white px-4 py-2 text-[13px] font-semibold text-[#51627c] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#1b78ff] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(27,120,255,.25)] hover:bg-[#1560e0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}

          {saving
            ? "Saving..."
            : isEdit
            ? "Update Subject"
            : "Save Subject"}
        </button>
      </div>
    </form>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

const TABS = ["Courses", "Branches", "Semesters", "Subjects"];

export default function CoursesPage() {
  const [activeTab, setActiveTab] = useState("Courses");

  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ==========================================================
  // FETCH COURSES
  // ==========================================================

  const fetchCourses = async () => {
    const response = await authFetch("/api/courses");
    const contentType = response.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || "Server returned an invalid response.");
    }
    if (!response.ok) {
      throw new Error(
        data?.error || data?.message || `Failed to fetch courses (${response.status})`
      );
    }
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.courses)) return data.courses;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.result)) return data.result;
    return [];
  };

  // ==========================================================
  // FETCH BRANCHES
  // ==========================================================

  const fetchBranches = async () => {
    const response = await authFetch("/api/branches/all");
    const contentType = response.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || "Server returned an invalid response.");
    }
    if (!response.ok) {
      throw new Error(
        data?.error || data?.message || `Failed to fetch branches (${response.status})`
      );
    }
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.branches)) return data.branches;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.result)) return data.result;
    return [];
  };

  // ==========================================================
  // FETCH SEMESTERS
  // ==========================================================

  const fetchSemesters = async () => {
    const response = await authFetch("/api/semesters");
    const contentType = response.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || "Server returned an invalid response.");
    }
    if (!response.ok) {
      throw new Error(
        data?.error || data?.message || `Failed to fetch semesters (${response.status})`
      );
    }
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.semesters)) return data.semesters;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.result)) return data.result;
    return [];
  };

  // ==========================================================
  // FETCH SUBJECTS
  // ==========================================================

  const fetchSubjects = async () => {
    const response = await authFetch("/api/subjects");
    const contentType = response.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || "Server returned an invalid response.");
    }
    if (!response.ok) {
      throw new Error(
        data?.error || data?.message || `Failed to fetch subjects (${response.status})`
      );
    }
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.subjects)) return data.subjects;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.result)) return data.result;
    return [];
  };

  // ==========================================================
  // FETCH ALL
  // ==========================================================

  const fetchAll = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError("");

      console.log("Fetching courses, branches, semesters, subjects...");

      const [coursesData, branchesData, semestersData, subjectsData] =
        await Promise.all([
          fetchCourses(),
          fetchBranches(),
          fetchSemesters(),
          fetchSubjects(),
        ]);

      console.log("Courses:", coursesData.length);
      console.log("Branches:", branchesData.length);
      console.log("Semesters:", semestersData.length);
      console.log("Subjects:", subjectsData.length);

      setCourses(coursesData);
      setBranches(branchesData);
      setSemesters(semestersData);
      setSubjects(subjectsData);
    } catch (err) {
      console.error("FETCH ALL ERROR:", err);
      setCourses([]);
      setBranches([]);
      setSemesters([]);
      setSubjects([]);
      setError(
        err?.message || "Unable to load data. Please check the server."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchAll(true);
  }, []);

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll(false);
  };

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredCourses = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        (c.course_name || "").toLowerCase().includes(q) ||
        (c.course_code || "").toLowerCase().includes(q)
    );
  }, [search, courses]);

  const filteredBranches = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return branches;
    return branches.filter(
      (b) =>
        (b.branch_name || "").toLowerCase().includes(q) ||
        (b.branch_code || "").toLowerCase().includes(q) ||
        (b.course_name || "").toLowerCase().includes(q)
    );
  }, [search, branches]);

  const filteredSemesters = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return semesters;
    return semesters.filter(
      (s) =>
        String(s.semester_number || "").includes(q) ||
        (s.regulation || "").toLowerCase().includes(q) ||
        (s.academic_year || "").toLowerCase().includes(q) ||
        (s.branch_name || "").toLowerCase().includes(q) ||
        (s.course_name || "").toLowerCase().includes(q)
    );
  }, [search, semesters]);

  const filteredSubjects = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        (s.subject_name || "").toLowerCase().includes(q) ||
        (s.subject_code || "").toLowerCase().includes(q) ||
        (s.subject_type || "").toLowerCase().includes(q) ||
        (s.branch_name || "").toLowerCase().includes(q) ||
        (s.course_name || "").toLowerCase().includes(q)
    );
  }, [search, subjects]);

  // ==========================================================
  // TAB CHANGE
  // ==========================================================

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearch("");
  };

  // ==========================================================
  // ADD / EDIT
  // ==========================================================

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    if (!item) return;
    setEditing(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  // ==========================================================
  // SAVE
  // ==========================================================

  const handleSaveCourse = async (form) => {
    try {
      let response;
      if (editing) {
        response = await authFetch(
          `/api/courses/${encodeURIComponent(editing.id)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          }
        );
      } else {
        response = await authFetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      const contentType = response.headers.get("content-type") || "";
      let data;
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || "Invalid server response.");
      }

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to save course."
        );
      }

      console.log("Course saved:", data);
      closeModal();
      await fetchAll(false);
    } catch (err) {
      console.error("SAVE COURSE ERROR:", err);
      throw new Error(err?.message || "Failed to save course.");
    }
  };

  const handleSaveBranch = async (form) => {
    try {
      let response;
      if (editing) {
        response = await authFetch(
          `/api/branches/${encodeURIComponent(editing.id)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          }
        );
      } else {
        response = await authFetch("/api/branches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      const contentType = response.headers.get("content-type") || "";
      let data;
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || "Invalid server response.");
      }

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to save branch."
        );
      }

      console.log("Branch saved:", data);
      closeModal();
      await fetchAll(false);
    } catch (err) {
      console.error("SAVE BRANCH ERROR:", err);
      throw new Error(err?.message || "Failed to save branch.");
    }
  };

  const handleSaveSemester = async (form) => {
    try {
      let response;
      if (editing) {
        response = await authFetch(
          `/api/semesters/${encodeURIComponent(editing.id)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          }
        );
      } else {
        response = await authFetch("/api/semesters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      const contentType = response.headers.get("content-type") || "";
      let data;
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || "Invalid server response.");
      }

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to save semester."
        );
      }

      console.log("Semester saved:", data);
      closeModal();
      await fetchAll(false);
    } catch (err) {
      console.error("SAVE SEMESTER ERROR:", err);
      throw new Error(err?.message || "Failed to save semester.");
    }
  };

  const handleSaveSubject = async (form) => {
    try {
      let response;
      if (editing) {
        response = await authFetch(
          `/api/subjects/${encodeURIComponent(editing.id)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          }
        );
      } else {
        response = await authFetch("/api/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      const contentType = response.headers.get("content-type") || "";
      let data;
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || "Invalid server response.");
      }

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to save subject."
        );
      }

      console.log("Subject saved:", data);
      closeModal();
      await fetchAll(false);
    } catch (err) {
      console.error("SAVE SUBJECT ERROR:", err);
      throw new Error(err?.message || "Failed to save subject.");
    }
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete = async (endpoint, id, label) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${label}"?`);
    if (!confirmed) return;

    try {
      setDeletingId(id);

      const response = await authFetch(
        `/api/${endpoint}/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );

      const contentType = response.headers.get("content-type") || "";
      let data;
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || "Invalid server response.");
      }

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to delete."
        );
      }

      await fetchAll(false);
    } catch (err) {
      console.error("DELETE ERROR:", err);
      alert(err?.message || "Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================================
  // MODAL TITLE
  // ==========================================================

  const modalTitle = useMemo(() => {
    const prefix = editing ? "Edit" : "Add New";
    if (activeTab === "Courses") return `${prefix} Course`;
    if (activeTab === "Branches") return `${prefix} Branch`;
    if (activeTab === "Semesters") return `${prefix} Semester`;
    return `${prefix} Subject`;
  }, [activeTab, editing]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-3">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <section className="rounded-lg bg-[#092f6d] px-6 py-5 text-white shadow-soft">
        <div className="flex items-center gap-2 text-[12px] font-bold tracking-[.4px]">
          <BookOpen size={18} />

          ACADEMIC STRUCTURE
        </div>

        <h2 className="mt-2 text-[20px] font-bold">
          COURSES, BRANCHES & SUBJECTS
        </h2>

        <p className="mt-1 text-[13px] text-[#b8c9e6]">
          Manage courses, branches, semesters, and subjects for the
          institution.
        </p>
      </section>

      {/* ====================================================
          TABS
      ==================================================== */}

      <div className="flex gap-1 rounded-lg border border-[#e5eaf1] bg-white p-1 shadow-soft">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={`flex-1 rounded-lg px-4 py-2 text-[13px] font-semibold transition ${
              activeTab === tab
                ? "bg-[#1b78ff] text-white shadow-[0_2px_8px_rgba(27,120,255,.25)]"
                : "text-[#51627c] hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ====================================================
          STATS
      ==================================================== */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="TOTAL COURSES"
          value={courses.length}
          color="blue"
        />

        <StatCard
          label="TOTAL BRANCHES"
          value={branches.length}
          color="green"
        />

        <StatCard
          label="TOTAL SEMESTERS"
          value={semesters.length}
          color="blue"
        />

        <StatCard
          label="TOTAL SUBJECTS"
          value={subjects.length}
          color="gray"
        />
      </div>

      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div>
            <strong className="block text-[12px] font-semibold text-red-600">
              Unable to load data
            </strong>

            <span className="text-[11px] text-red-500">{error}</span>
          </div>

          <button
            type="button"
            onClick={() => fetchAll(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#1b78ff] hover:underline"
          >
            <RefreshCw size={13} />

            Retry
          </button>
        </div>
      )}

      {/* ====================================================
          TABLE
      ==================================================== */}

      <section className="overflow-hidden rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-[#edf0f4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
              ALL {activeTab.toUpperCase()}
            </h3>

            <p className="mt-[2px] text-[11px] text-[#8d9aac]">
              {activeTab === "Courses" && "Manage degree programs"}
              {activeTab === "Branches" &&
                "Manage branches under courses"}
              {activeTab === "Semesters" &&
                "Manage semester divisions"}
              {activeTab === "Subjects" &&
                "Manage subjects across semesters"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Search */}
            <div className="flex h-9 items-center gap-1 rounded-lg border border-[#e4e8ef] px-3">
              <Search size={14} className="text-[#8d9aae]" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${activeTab.toLowerCase()}...`}
                className="w-[150px] border-0 bg-transparent text-[13px] outline-none placeholder:text-[#a4afbd]"
              />
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              title={`Refresh ${activeTab.toLowerCase()}`}
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#e4e8ef] bg-white text-[#51627c] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>

            {/* Add New */}
            <button
              type="button"
              onClick={handleAdd}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1b78ff] px-4 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(27,120,255,.25)] transition hover:bg-[#1560e0]"
            >
              <Plus size={15} />

              Add New
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <div className="flex items-center gap-2 text-[13px] text-[#8b98aa]">
              <Loader2 size={18} className="animate-spin" />

              Loading data...
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* ============================
                COURSES TABLE
            ============================ */}

            {activeTab === "Courses" && (
              <table className="w-full min-w-[650px] border-collapse">
                <thead>
                  <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      ID
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Course Name
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Course Code
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Duration (Years)
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-12 text-center text-[13px] text-[#8b98aa]"
                      >
                        {search
                          ? "No courses match your search."
                          : "No courses found."}
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((course) => (
                      <tr
                        key={course.id}
                        className="border-b border-[#f0f2f5] text-[12px] text-[#68778c] transition hover:bg-[#fafcff]"
                      >
                        <td className="px-3 py-3 font-semibold text-[#4d5e76]">
                          {course.id}
                        </td>

                        <td className="px-3 py-3 font-semibold text-[#1d4c86]">
                          {course.course_name}
                        </td>

                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-md bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#2469c7]">
                            {course.course_code}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          {course.duration_years || "-"}
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(course)}
                              className="grid h-8 w-8 place-items-center rounded-lg text-[#1b78ff] hover:bg-[#eef5ff]"
                              title="Edit"
                            >
                              <Edit3 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  "courses",
                                  course.id,
                                  course.course_name
                                )
                              }
                              disabled={deletingId === course.id}
                              className="grid h-8 w-8 place-items-center rounded-lg text-[#e05252] hover:bg-[#fff0f0] disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === course.id ? (
                                <Loader2
                                  size={15}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* ============================
                BRANCHES TABLE
            ============================ */}

            {activeTab === "Branches" && (
              <table className="w-full min-w-[750px] border-collapse">
                <thead>
                  <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      ID
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Course
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Branch Name
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Branch Code
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      HOD
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBranches.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-12 text-center text-[13px] text-[#8b98aa]"
                      >
                        {search
                          ? "No branches match your search."
                          : "No branches found."}
                      </td>
                    </tr>
                  ) : (
                    filteredBranches.map((branch) => (
                      <tr
                        key={branch.id}
                        className="border-b border-[#f0f2f5] text-[12px] text-[#68778c] transition hover:bg-[#fafcff]"
                      >
                        <td className="px-3 py-3 font-semibold text-[#4d5e76]">
                          {branch.id}
                        </td>

                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-md bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#2469c7]">
                            {branch.course_name || "-"}
                          </span>
                        </td>

                        <td className="px-3 py-3 font-semibold text-[#1d4c86]">
                          {branch.branch_name}
                        </td>

                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-md bg-[#f0f7ff] px-2 py-1 text-[11px] font-semibold text-[#1b78ff]">
                            {branch.branch_code}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          {branch.hod_name || "-"}
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(branch)}
                              className="grid h-8 w-8 place-items-center rounded-lg text-[#1b78ff] hover:bg-[#eef5ff]"
                              title="Edit"
                            >
                              <Edit3 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  "branches",
                                  branch.id,
                                  branch.branch_name
                                )
                              }
                              disabled={deletingId === branch.id}
                              className="grid h-8 w-8 place-items-center rounded-lg text-[#e05252] hover:bg-[#fff0f0] disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === branch.id ? (
                                <Loader2
                                  size={15}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* ============================
                SEMESTERS TABLE
            ============================ */}

            {activeTab === "Semesters" && (
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      ID
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Course
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Branch
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Semester
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Regulation
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Academic Year
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSemesters.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-12 text-center text-[13px] text-[#8b98aa]"
                      >
                        {search
                          ? "No semesters match your search."
                          : "No semesters found."}
                      </td>
                    </tr>
                  ) : (
                    filteredSemesters.map((semester) => (
                      <tr
                        key={semester.id}
                        className="border-b border-[#f0f2f5] text-[12px] text-[#68778c] transition hover:bg-[#fafcff]"
                      >
                        <td className="px-3 py-3 font-semibold text-[#4d5e76]">
                          {semester.id}
                        </td>

                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-md bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#2469c7]">
                            {semester.course_name || "-"}
                          </span>
                        </td>

                        <td className="px-3 py-3 font-semibold text-[#1d4c86]">
                          {semester.branch_name || "-"}
                        </td>

                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-md bg-[#eaf8f2] px-2 py-1 text-[11px] font-semibold text-[#27885e]">
                            Sem {semester.semester_number}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          {semester.regulation || "-"}
                        </td>

                        <td className="px-3 py-3">
                          {semester.academic_year || "-"}
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(semester)}
                              className="grid h-8 w-8 place-items-center rounded-lg text-[#1b78ff] hover:bg-[#eef5ff]"
                              title="Edit"
                            >
                              <Edit3 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  "semesters",
                                  semester.id,
                                  `${semester.course_name || ""} - ${semester.branch_name || ""} Sem ${semester.semester_number}`
                                )
                              }
                              disabled={deletingId === semester.id}
                              className="grid h-8 w-8 place-items-center rounded-lg text-[#e05252] hover:bg-[#fff0f0] disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === semester.id ? (
                                <Loader2
                                  size={15}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* ============================
                SUBJECTS TABLE
            ============================ */}

            {activeTab === "Subjects" && (
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      ID
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Course
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Branch
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Sem
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Subject Name
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Code
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Credits
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Type
                    </th>

                    <th className="border-b border-[#edf0f4] px-3 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSubjects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-3 py-12 text-center text-[13px] text-[#8b98aa]"
                      >
                        {search
                          ? "No subjects match your search."
                          : "No subjects found."}
                      </td>
                    </tr>
                  ) : (
                    filteredSubjects.map((subject) => (
                      <tr
                        key={subject.id}
                        className="border-b border-[#f0f2f5] text-[12px] text-[#68778c] transition hover:bg-[#fafcff]"
                      >
                        <td className="px-3 py-3 font-semibold text-[#4d5e76]">
                          {subject.id}
                        </td>

                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-md bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#2469c7]">
                            {subject.course_name || "-"}
                          </span>
                        </td>

                        <td className="px-3 py-3 font-semibold text-[#1d4c86]">
                          {subject.branch_name || "-"}
                        </td>

                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-md bg-[#eaf8f2] px-2 py-1 text-[11px] font-semibold text-[#27885e]">
                            {subject.semester_number || "-"}
                          </span>
                        </td>

                        <td className="px-3 py-3 font-semibold text-[#1d4c86]">
                          {subject.subject_name}
                        </td>

                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-md bg-[#f0f7ff] px-2 py-1 text-[11px] font-semibold text-[#1b78ff]">
                            {subject.subject_code}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          {subject.credits || "-"}
                        </td>

                        <td className="px-3 py-3">
                          {subject.subject_type || "-"}
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(subject)}
                              className="grid h-8 w-8 place-items-center rounded-lg text-[#1b78ff] hover:bg-[#eef5ff]"
                              title="Edit"
                            >
                              <Edit3 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  "subjects",
                                  subject.id,
                                  subject.subject_name
                                )
                              }
                              disabled={deletingId === subject.id}
                              className="grid h-8 w-8 place-items-center rounded-lg text-[#e05252] hover:bg-[#fff0f0] disabled:cursor-not-allowed disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === subject.id ? (
                                <Loader2
                                  size={15}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

      {/* ====================================================
          MODAL
      ==================================================== */}

      <Modal open={modalOpen} onClose={closeModal} title={modalTitle}>
        {activeTab === "Courses" && (
          <CourseForm
            item={editing}
            onSave={handleSaveCourse}
            onCancel={closeModal}
          />
        )}

        {activeTab === "Branches" && (
          <BranchForm
            item={editing}
            courses={courses}
            onSave={handleSaveBranch}
            onCancel={closeModal}
          />
        )}

        {activeTab === "Semesters" && (
          <SemesterForm
            item={editing}
            branches={branches}
            onSave={handleSaveSemester}
            onCancel={closeModal}
          />
        )}

        {activeTab === "Subjects" && (
          <SubjectForm
            item={editing}
            semesters={semesters}
            onSave={handleSaveSubject}
            onCancel={closeModal}
          />
        )}
      </Modal>
    </div>
  );
}
