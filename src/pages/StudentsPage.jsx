import React, { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Plus,
  Search,
  Trash2,
  GraduationCap,
  X,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { authFetch } from "../authFetch";

/* =========================================================
   MODAL
========================================================= */

function Modal({ open, onClose, title, subtitle, children }) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close modal overlay"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/40"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
        <div className="relative max-h-[95vh] w-full max-w-3xl overflow-hidden rounded-xl border border-[#e5eaf1] bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-[#edf0f4] px-6 py-4">
            <div>
              <h2 className="text-[18px] font-bold text-[#1a345c]">
                {title}
              </h2>

              {subtitle && (
                <p className="mt-1 text-[12px] text-[#8b98aa]">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-[#8b98aa] hover:bg-slate-100 hover:text-[#344c69]"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[calc(95vh-80px)] overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   INPUT FIELD
========================================================= */

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  required = false,
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
        {label}
        {required && <span className="ml-1 text-[#e05252]">*</span>}
      </label>

      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="h-10 w-full rounded-lg border border-[#e3e8ef] bg-white px-3 text-[13px] text-[#344c69] outline-none placeholder:text-[#a4afbd] focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/20 disabled:cursor-not-allowed disabled:bg-[#f5f7fa] disabled:text-[#8b98aa]"
      />
    </div>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "-- Select --",
  disabled = false,
  required = false,
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
        {label}
        {required && <span className="ml-1 text-[#e05252]">*</span>}
      </label>

      <select
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="h-10 w-full rounded-lg border border-[#e3e8ef] bg-white px-3 text-[13px] text-[#344c69] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/20 disabled:cursor-not-allowed disabled:bg-[#f5f7fa]"
      >
        <option value="">{placeholder}</option>

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* =========================================================
   STUDENT FORM
========================================================= */

function StudentForm({
  student,
  users,
  branches,
  semesters,
  onSave,
  onCancel,
}) {
  const isEdit = Boolean(student);

  const [form, setForm] = useState({
    user_id: student?.user_id || "",
    admission_no: student?.admission_no || "",
    roll_no: student?.roll_no || "",
    branch_id: student?.branch_id || "",
    semester_id: student?.semester_id || "",
    section: student?.section || "",
    mentor_id: student?.mentor_id || "",
    cgpa: student?.cgpa || "",
    backlog_count: student?.backlog_count || "",
    scholarship_category: student?.scholarship_category || "",
    admission_year: student?.admission_year || "",
    is_hosteler: student?.is_hosteler || false,
    rfid_card_no: student?.rfid_card_no || "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      user_id: student?.user_id || "",
      admission_no: student?.admission_no || "",
      roll_no: student?.roll_no || "",
      branch_id: student?.branch_id || "",
      semester_id: student?.semester_id || "",
      section: student?.section || "",
      mentor_id: student?.mentor_id || "",
      cgpa: student?.cgpa || "",
      backlog_count: student?.backlog_count || "",
      scholarship_category: student?.scholarship_category || "",
      admission_year: student?.admission_year || "",
      is_hosteler: student?.is_hosteler || false,
      rfid_card_no: student?.rfid_card_no || "",
    });

    setError("");
  }, [student]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleCheckbox = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.checked,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.user_id) {
      setError("User is required.");
      return;
    }

    if (!form.admission_no.trim()) {
      setError("Admission Number is required.");
      return;
    }

    if (!form.roll_no.trim()) {
      setError("Roll Number is required.");
      return;
    }

    if (!form.branch_id) {
      setError("Branch is required.");
      return;
    }

    if (!form.semester_id) {
      setError("Semester is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        user_id: form.user_id,
        admission_no: form.admission_no.trim(),
        roll_no: form.roll_no.trim(),
        branch_id: form.branch_id,
        semester_id: form.semester_id,
        section: form.section || null,
        mentor_id: form.mentor_id || null,
        cgpa: form.cgpa !== "" ? Number(form.cgpa) : null,
        backlog_count: form.backlog_count !== "" ? Number(form.backlog_count) : 0,
        scholarship_category: form.scholarship_category.trim() || null,
        admission_year: form.admission_year.trim() || null,
        is_hosteler: form.is_hosteler,
        rfid_card_no: form.rfid_card_no.trim() || null,
      };

      await onSave(payload);
    } catch (err) {
      setError(err.message || "Failed to save student.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-[#f5c2c2] bg-[#fff0f0] px-3 py-2.5 text-[12px] font-medium text-[#e05252]">
          {error}
        </div>
      )}

      <div>
        <h3 className="mb-3 text-[12px] font-bold uppercase tracking-[.35px] text-[#1d4c86]">
          User &amp; Admission
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
              User
              <span className="ml-1 text-[#e05252]">*</span>
            </label>

            <select
              value={form.user_id}
              onChange={handleChange("user_id")}
              required
              disabled={isEdit}
              className="h-10 w-full rounded-lg border border-[#e3e8ef] bg-white px-3 text-[13px] text-[#344c69] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/20 disabled:cursor-not-allowed disabled:bg-[#f5f7fa]"
            >
              <option value="">-- Select User --</option>

              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <InputField
            label="Admission No"
            value={form.admission_no}
            onChange={handleChange("admission_no")}
            placeholder="ADM-001"
            required
          />

          <InputField
            label="Roll No"
            value={form.roll_no}
            onChange={handleChange("roll_no")}
            placeholder="ROLL-001"
            required
          />

          <InputField
            label="RFID Card No"
            value={form.rfid_card_no}
            onChange={handleChange("rfid_card_no")}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="border-t border-[#edf0f4] pt-4">
        <h3 className="mb-3 text-[12px] font-bold uppercase tracking-[.35px] text-[#1d4c86]">
          Academic Details
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Branch"
            value={form.branch_id}
            onChange={handleChange("branch_id")}
            options={branches.map((b) => ({
              value: b.id,
              label: b.course_name ? `${b.course_name} - ${b.branch_name}` : b.branch_name,
            }))}
            placeholder="-- Select Branch --"
            required
          />

          <SelectField
            label="Semester"
            value={form.semester_id}
            onChange={handleChange("semester_id")}
            options={semesters.map((s) => ({
              value: s.id,
              label: s.name || s.semester_name || `Semester ${s.id}`,
            }))}
            placeholder="-- Select Semester --"
            required
          />

          <SelectField
            label="Section"
            value={form.section}
            onChange={handleChange("section")}
            options={[
              { value: "A", label: "A" },
              { value: "B", label: "B" },
              { value: "C", label: "C" },
              { value: "D", label: "D" },
            ]}
            placeholder="-- Select Section --"
          />

          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
              Mentor
            </label>

            <select
              value={form.mentor_id}
              onChange={handleChange("mentor_id")}
              className="h-10 w-full rounded-lg border border-[#e3e8ef] bg-white px-3 text-[13px] text-[#344c69] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/20"
            >
              <option value="">-- Select Mentor (Optional) --</option>

              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <InputField
            label="CGPA"
            value={form.cgpa}
            onChange={handleChange("cgpa")}
            placeholder="0.00"
            type="number"
          />

          <InputField
            label="Backlog Count"
            value={form.backlog_count}
            onChange={handleChange("backlog_count")}
            placeholder="0"
            type="number"
          />

          <InputField
            label="Scholarship Category"
            value={form.scholarship_category}
            onChange={handleChange("scholarship_category")}
            placeholder="Optional"
          />

          <InputField
            label="Admission Year"
            value={form.admission_year}
            onChange={handleChange("admission_year")}
            placeholder="2024"
          />
        </div>
      </div>

      <div className="border-t border-[#edf0f4] pt-4">
        <h3 className="mb-3 text-[12px] font-bold uppercase tracking-[.35px] text-[#1d4c86]">
          Additional Information
        </h3>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_hosteler}
            onChange={handleCheckbox("is_hosteler")}
            className="h-4 w-4 rounded border-[#d0d7e2] text-[#1b78ff] focus:ring-[#1b78ff]/20"
          />

          <span className="text-[13px] font-medium text-[#344c69]">
            Is Hosteler
          </span>
        </label>
      </div>

      <div className="flex justify-end gap-2 border-t border-[#edf0f4] pt-4">
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
          {saving && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}

          {saving
            ? "Saving..."
            : isEdit
              ? "Update Student"
              : "Add Student"}
        </button>
      </div>
    </form>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

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

/* =========================================================
   STUDENTS PAGE
========================================================= */

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  /* =======================================================
     FETCH STUDENTS
  ======================================================= */

  const fetchStudents = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const params = new URLSearchParams();

      if (branchFilter) {
        params.append("branch_id", branchFilter);
      }

      if (semesterFilter) {
        params.append("semester_id", semesterFilter);
      }

      const queryString = params.toString();
      const url = `/api/students${queryString ? `?${queryString}` : ""}`;

      console.log("Fetching students:", url);

      const response = await authFetch(url);

      const contentType =
        response.headers.get("content-type") || "";

      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();

        throw new Error(
          text || "Server returned an invalid response."
        );
      }

      console.log("Students API response:", data);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Failed to fetch students (${response.status})`
        );
      }

      let studentsData = [];

      if (Array.isArray(data)) {
        studentsData = data;
      } else if (Array.isArray(data?.students)) {
        studentsData = data.students;
      } else if (Array.isArray(data?.data)) {
        studentsData = data.data;
      } else if (Array.isArray(data?.results)) {
        studentsData = data.results;
      }

      setStudents(studentsData);
    } catch (err) {
      console.error("FETCH STUDENTS ERROR:", err);

      setStudents([]);

      setError(
        err?.message ||
          "Unable to load students. Please check the server."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =======================================================
     FETCH USERS
  ======================================================= */

  const fetchUsers = async () => {
    try {
      const response = await authFetch("/api/users");

      const data = await response.json();

      let usersData = [];

      if (Array.isArray(data)) {
        usersData = data;
      } else if (Array.isArray(data?.users)) {
        usersData = data.users;
      } else if (Array.isArray(data?.data)) {
        usersData = data.data;
      } else if (Array.isArray(data?.results)) {
        usersData = data.results;
      }

      setUsers(usersData);
    } catch (err) {
      console.error("FETCH USERS ERROR:", err);
    }
  };

  /* =======================================================
     FETCH BRANCHES
  ======================================================= */

  const fetchBranches = async () => {
    try {
      const response = await authFetch("/api/branches/all");

      const data = await response.json();

      let branchesData = [];

      if (Array.isArray(data)) {
        branchesData = data;
      } else if (Array.isArray(data?.branches)) {
        branchesData = data.branches;
      } else if (Array.isArray(data?.data)) {
        branchesData = data.data;
      }

      setBranches(branchesData);
    } catch (err) {
      console.error("FETCH BRANCHES ERROR:", err);
    }
  };

  /* =======================================================
     FETCH SEMESTERS
  ======================================================= */

  const fetchSemesters = async () => {
    try {
      const response = await authFetch("/api/semesters");

      const data = await response.json();

      let semestersData = [];

      if (Array.isArray(data)) {
        semestersData = data;
      } else if (Array.isArray(data?.semesters)) {
        semestersData = data.semesters;
      } else if (Array.isArray(data?.data)) {
        semestersData = data.data;
      }

      setSemesters(semestersData);
    } catch (err) {
      console.error("FETCH SEMESTERS ERROR:", err);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    fetchStudents(true);
    fetchUsers();
    fetchBranches();
    fetchSemesters();
  }, []);

  /* =======================================================
     FILTER BY BRANCH / SEMESTER
  ======================================================= */

  useEffect(() => {
    fetchStudents(true);
  }, [branchFilter, semesterFilter]);

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchStudents(false);
  };

  /* =======================================================
     SEARCH (client-side)
  ======================================================= */

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) {
      return students;
    }

    return students.filter((s) =>
      [
        s.admission_no,
        s.roll_no,
        s.full_name,
        s.name,
        s.email,
        s.user_name,
        s.branch_name,
        s.semester_name,
        s.section,
        String(s.cgpa),
        s.scholarship_category,
        s.rfid_card_no,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [search, students]);

  /* =======================================================
     LOOKUP HELPERS
  ======================================================= */

  const getUserName = (student) => {
    if (student.full_name) return student.full_name;
    if (student.user_name) return student.user_name;
    if (student.name) return student.name;

    const user = users.find(
      (u) => String(u.id) === String(student.user_id)
    );

    return user?.full_name || user?.email || "-";
  };

  const getUserEmail = (student) => {
    if (student.email) return student.email;

    const user = users.find(
      (u) => String(u.id) === String(student.user_id)
    );

    return user?.email || "-";
  };

  const getBranchName = (student) => {
    if (student.branch_name) return student.branch_name;

    const branch = branches.find(
      (b) => String(b.id) === String(student.branch_id)
    );

    return branch?.branch_name || "-";
  };

  const getSemesterName = (student) => {
    if (student.semester_name) return student.semester_name;

    const sem = semesters.find(
      (s) => String(s.id) === String(student.semester_id)
    );

    return sem?.name || sem?.semester_name || "-";
  };

  /* =======================================================
     ADD
  ======================================================= */

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  /* =======================================================
     EDIT
  ======================================================= */

  const handleEdit = (student) => {
    setEditing(student);
    setModalOpen(true);
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete = async (student) => {
    if (!student) return;

    const name = getUserName(student);

    const confirmed = window.confirm(
      `Are you sure you want to delete student "${name}" (${student.admission_no})?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await authFetch(
        `/api/students/${student.id}`,
        {
          method: "DELETE",
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();

        throw new Error(
          text || "Invalid server response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Failed to delete student."
        );
      }

      await fetchStudents(false);
    } catch (err) {
      console.error("DELETE STUDENT ERROR:", err);

      alert(
        err?.message || "Failed to delete student."
      );
    }
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave = async (form) => {
    const url = editing
      ? `/api/students/${editing.id}`
      : "/api/students";

    const method = editing ? "PUT" : "POST";

    const response = await authFetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const contentType =
      response.headers.get("content-type") || "";

    let data;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();

      throw new Error(
        text || "Invalid response from server."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.message ||
          "Failed to save student."
      );
    }

    await fetchStudents(false);

    setModalOpen(false);
    setEditing(null);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-3">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <section className="rounded-lg bg-[#092f6d] px-6 py-5 text-white shadow-soft">
        <div className="flex items-center gap-2 text-[12px] font-bold tracking-[.4px]">
          <GraduationCap size={18} />
          STUDENT MANAGEMENT
        </div>

        <h2 className="mt-2 text-[20px] font-bold">
          STUDENTS
        </h2>

        <p className="mt-1 text-[13px] text-[#b8c9e6]">
          Manage student admissions, academic records, and enrollment details.
        </p>
      </section>

      {/* ====================================================
          STATS
      ==================================================== */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="TOTAL STUDENTS"
          value={students.length}
          color="blue"
        />

        <StatCard
          label="HOSTELERS"
          value={
            students.filter(
              (s) =>
                s.is_hosteler === true ||
                s.is_hosteler === 1 ||
                s.is_hosteler === "1" ||
                s.is_hosteler === "true"
            ).length
          }
          color="green"
        />

        <StatCard
          label="WITH BACKLOGS"
          value={
            students.filter(
              (s) =>
                Number(s.backlog_count || 0) > 0
            ).length
          }
          color="gray"
        />

        <StatCard
          label="SECTIONS"
          value={
            new Set(
              students
                .map((s) => s.section)
                .filter(Boolean)
            ).size
          }
          color="blue"
        />
      </div>

      {/* ====================================================
          TABLE
      ==================================================== */}

      <section className="overflow-hidden rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-[#edf0f4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
              ALL STUDENTS
            </h3>

            <p className="mt-[2px] text-[11px] text-[#8d9aac]">
              View and manage all enrolled students
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="flex h-9 items-center gap-1 rounded-lg border border-[#e4e8ef] px-3">
              <Search
                size={14}
                className="text-[#8d9aae]"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search students..."
                className="w-[150px] border-0 bg-transparent text-[13px] outline-none placeholder:text-[#a4afbd]"
              />
            </div>

            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="h-9 rounded-lg border border-[#e4e8ef] bg-white px-3 text-[13px] text-[#344c69] outline-none focus:border-[#1b78ff]"
            >
              <option value="">All Branches</option>

              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.course_name ? `${b.course_name} - ${b.branch_name}` : b.branch_name}
                </option>
              ))}
            </select>

            {/* Semester Filter */}
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="h-9 rounded-lg border border-[#e4e8ef] bg-white px-3 text-[13px] text-[#344c69] outline-none focus:border-[#1b78ff]"
            >
              <option value="">All Semesters</option>

              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.semester_name || `Semester ${s.id}`}
                </option>
              ))}
            </select>

            {/* Refresh */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh students"
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#e4e8ef] bg-white text-[#51627c] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </button>

            {/* Add Student */}
            <button
              type="button"
              onClick={handleAdd}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1b78ff] px-4 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(27,120,255,.25)] hover:bg-[#1560e0]"
            >
              <Plus size={15} />
              Add Student
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-3 rounded-lg border border-[#f5c2c2] bg-[#fff5f5] px-3 py-2.5 text-[12px] font-medium text-[#e05252]">
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>

              <button
                type="button"
                onClick={() => fetchStudents(true)}
                className="flex items-center gap-1 font-semibold text-[#1b78ff] hover:underline"
              >
                <RefreshCw size={12} />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <div className="flex items-center gap-2 text-[13px] text-[#8b98aa]">
              <Loader2
                size={18}
                className="animate-spin"
              />

              Loading students...
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                  {[
                    "Admission No",
                    "Roll No",
                    "Name",
                    "Email",
                    "Branch",
                    "Semester",
                    "Section",
                    "CGPA",
                    "Backlogs",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="border-b border-[#edf0f4] px-3 py-3"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-3 py-12 text-center text-[13px] text-[#8b98aa]"
                    >
                      {search || branchFilter || semesterFilter
                        ? "No students match your filters."
                        : "No students found."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-[#f0f2f5] text-[12px] text-[#68778c] transition hover:bg-[#fafcff]"
                    >
                      {/* Admission No */}
                      <td className="px-3 py-3 font-semibold text-[#4d5e76]">
                        {student.admission_no}
                      </td>

                      {/* Roll No */}
                      <td className="px-3 py-3 font-semibold text-[#4d5e76]">
                        {student.roll_no}
                      </td>

                      {/* Name */}
                      <td className="px-3 py-3">
                        <span className="font-medium text-[#344c69]">
                          {getUserName(student)}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="px-3 py-3">
                        {getUserEmail(student)}
                      </td>

                      {/* Branch */}
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-md bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#2469c7]">
                          {getBranchName(student)}
                        </span>
                      </td>

                      {/* Semester */}
                      <td className="px-3 py-3">
                        {getSemesterName(student)}
                      </td>

                      {/* Section */}
                      <td className="px-3 py-3">
                        {student.section || "-"}
                      </td>

                      {/* CGPA */}
                      <td className="px-3 py-3">
                        {student.cgpa != null
                          ? Number(student.cgpa).toFixed(2)
                          : "-"}
                      </td>

                      {/* Backlogs */}
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-[11px] font-semibold ${
                            Number(student.backlog_count || 0) > 0
                              ? "bg-[#fff0f0] text-[#e05252]"
                              : "bg-[#eaf8f2] text-[#27885e]"
                          }`}
                        >
                          {student.backlog_count ?? 0}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(student)
                            }
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#1b78ff] hover:bg-[#eef5ff]"
                            title="Edit"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(student)
                            }
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#e05252] hover:bg-[#fff0f0]"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#edf0f4] px-4 py-3">
          <span className="text-[11px] text-[#8b98aa]">
            Showing {filtered.length} of {students.length} students
          </span>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#1b78ff] hover:underline disabled:opacity-50"
          >
            <RefreshCw
              size={12}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </section>

      {/* ====================================================
          MODAL
      ==================================================== */}

      <Modal
        open={modalOpen}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setEditing(null);
          }
        }}
        title={editing ? "Edit Student" : "Add New Student"}
        subtitle={
          editing
            ? "Update student information"
            : "Create a new student admission"
        }
      >
        <StudentForm
          student={editing}
          users={users}
          branches={branches}
          semesters={semesters}
          onSave={handleSave}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
          }}
        />
      </Modal>
    </div>
  );
}
