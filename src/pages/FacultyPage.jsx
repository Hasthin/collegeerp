import React, { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Plus,
  Search,
  Trash2,
  GraduationCap,
  X,
  RefreshCw,
  BookOpen,
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
        <div className="relative max-h-[95vh] w-full max-w-2xl overflow-hidden rounded-xl border border-[#e5eaf1] bg-white shadow-2xl">
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
  required = false,
  disabled = false,
  loading = false,
  renderOption,
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
        {label}
        {required && <span className="ml-1 text-[#e05252]">*</span>}
      </label>

      {loading ? (
        <div className="flex h-10 items-center gap-2 rounded-lg border border-[#e3e8ef] bg-[#f8fafc] px-3 text-[12px] text-[#8b98aa]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#cbd5e1] border-t-[#1b78ff]" />
          Loading...
        </div>
      ) : (
        <select
          value={value ?? ""}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className="h-10 w-full rounded-lg border border-[#e3e8ef] bg-white px-3 text-[13px] text-[#344c69] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/20 disabled:cursor-not-allowed disabled:bg-[#f5f7fa] disabled:text-[#8b98aa]"
        >
          <option value="">{placeholder}</option>

          {options.map((opt) =>
            renderOption ? (
              renderOption(opt)
            ) : (
              <option key={opt.id} value={opt.id}>
                {opt.name || opt.label || opt.id}
              </option>
            ),
          )}
        </select>
      )}
    </div>
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
   FACULTY FORM
========================================================= */

function FacultyForm({
  faculty,
  users,
  branches,
  usersLoading,
  onSave,
  onCancel,
}) {
  const isEdit = Boolean(faculty);

  const [form, setForm] = useState({
    user_id: faculty?.user_id || "",
    faculty_code: faculty?.faculty_code || "",
    branch_id: faculty?.branch_id || "",
    qualification: faculty?.qualification || "",
    experience_years: faculty?.experience_years || "",
    is_hod: faculty?.is_hod || false,
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      user_id: faculty?.user_id || "",
      faculty_code: faculty?.faculty_code || "",
      branch_id: faculty?.branch_id || "",
      qualification: faculty?.qualification || "",
      experience_years: faculty?.experience_years || "",
      is_hod: faculty?.is_hod || false,
    });

    setError("");
  }, [faculty]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      [field]: value,
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

    if (!isEdit && !form.user_id) {
      setError("User is required.");
      return;
    }

    if (!form.faculty_code.trim()) {
      setError("Faculty Code is required.");
      return;
    }

    if (!form.branch_id) {
      setError("Branch is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        faculty_code: form.faculty_code.trim(),
        branch_id: form.branch_id,
        qualification: form.qualification.trim(),
        experience_years: Number(form.experience_years) || 0,
        is_hod: form.is_hod,
      };

      if (!isEdit) {
        payload.user_id = form.user_id;
      }

      await onSave(payload);
    } catch (err) {
      setError(err.message || "Failed to save faculty.");
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
          Faculty Information
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {!isEdit && (
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
                User
                <span className="ml-1 text-[#e05252]">*</span>
              </label>

              {usersLoading ? (
                <div className="flex h-10 items-center gap-2 rounded-lg border border-[#e3e8ef] bg-[#f8fafc] px-3 text-[12px] text-[#8b98aa]">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#cbd5e1] border-t-[#1b78ff]" />
                  Loading users...
                </div>
              ) : (
                <select
                  value={form.user_id}
                  onChange={handleChange("user_id")}
                  required
                  className="h-10 w-full rounded-lg border border-[#e3e8ef] bg-white px-3 text-[13px] text-[#344c69] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/20"
                >
                  <option value="">-- Select User --</option>

                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name
                        ? `${u.full_name} (${u.email})`
                        : u.email}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <InputField
            label="Faculty Code"
            value={form.faculty_code}
            onChange={handleChange("faculty_code")}
            placeholder="FAC-001"
            required
          />

          <SelectField
            label="Branch"
            value={form.branch_id}
            onChange={handleChange("branch_id")}
            options={branches}
            placeholder="-- Select Branch --"
            required
            renderOption={(b) => (
              <option key={b.id} value={b.id}>
                {b.course_name} - {b.branch_name}
              </option>
            )}
          />

          <InputField
            label="Qualification"
            value={form.qualification}
            onChange={handleChange("qualification")}
            placeholder="Ph.D., M.Tech, etc."
          />

          <InputField
            label="Experience (Years)"
            value={form.experience_years}
            onChange={handleChange("experience_years")}
            placeholder="5"
            type="number"
          />

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="is_hod"
              checked={form.is_hod}
              onChange={handleCheckbox("is_hod")}
              className="h-4 w-4 rounded border-[#d1d5db] text-[#1b78ff] accent-[#1b78ff] focus:ring-[#1b78ff]"
            />

            <label
              htmlFor="is_hod"
              className="text-[13px] font-medium text-[#344c69]"
            >
              Head of Department (HOD)
            </label>
          </div>
        </div>
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
              ? "Update Faculty"
              : "Add Faculty"}
        </button>
      </div>
    </form>
  );
}

/* =========================================================
   SUBJECT MAPPING FORM
========================================================= */

function MappingForm({
  mapping,
  facultyList,
  subjects,
  facultyLoading,
  subjectsLoading,
  onSave,
  onCancel,
}) {
  const [form, setForm] = useState({
    faculty_id: mapping?.faculty_id || "",
    subject_id: mapping?.subject_id || "",
    academic_year: mapping?.academic_year || new Date().getFullYear().toString(),
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      faculty_id: mapping?.faculty_id || "",
      subject_id: mapping?.subject_id || "",
      academic_year: mapping?.academic_year || new Date().getFullYear().toString(),
    });

    setError("");
  }, [mapping]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.faculty_id) {
      setError("Faculty is required.");
      return;
    }

    if (!form.subject_id) {
      setError("Subject is required.");
      return;
    }

    try {
      setSaving(true);

      await onSave({
        faculty_id: form.faculty_id,
        subject_id: form.subject_id,
        academic_year: form.academic_year,
      });
    } catch (err) {
      setError(err.message || "Failed to save mapping.");
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

      <div className="space-y-4">
        <SelectField
          label="Faculty"
          value={form.faculty_id}
          onChange={handleChange("faculty_id")}
          options={facultyList}
          placeholder="-- Select Faculty --"
          required
          loading={facultyLoading}
          renderOption={(f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.faculty_code})
            </option>
          )}
        />

        <SelectField
          label="Subject"
          value={form.subject_id}
          onChange={handleChange("subject_id")}
          options={subjects}
          placeholder="-- Select Subject --"
          required
          loading={subjectsLoading}
          renderOption={(s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.subject_name} ({s.code || s.subject_code})
            </option>
          )}
        />

        <InputField
          label="Academic Year"
          value={form.academic_year}
          onChange={handleChange("academic_year")}
          placeholder="2026"
        />
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

          {saving ? "Saving..." : "Save Mapping"}
        </button>
      </div>
    </form>
  );
}

/* =========================================================
   FACULTY PAGE
========================================================= */

export default function FacultyPage() {
  const [activeTab, setActiveTab] = useState("faculty");

  /* ----- faculty list state ----- */
  const [faculty, setFaculty] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [facultySearch, setFacultySearch] = useState("");
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [facultyError, setFacultyError] = useState("");
  const [facultyModalOpen, setFacultyModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);

  /* ----- mapping state ----- */
  const [mappings, setMappings] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [mappingSearch, setMappingSearch] = useState("");
  const [mappingLoading, setMappingLoading] = useState(false);
  const [facultyDropdownLoading, setFacultyDropdownLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [mappingError, setMappingError] = useState("");
  const [mappingModalOpen, setMappingModalOpen] = useState(false);

  /* =======================================================
     FETCH FACULTY
  ======================================================= */

  const fetchFaculty = async () => {
    setFacultyLoading(true);
    setFacultyError("");

    try {
      const res = await authFetch("/api/faculty");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to load faculty",
        );
      }

      let facultyData = [];

      if (Array.isArray(data)) {
        facultyData = data;
      } else if (Array.isArray(data.faculty)) {
        facultyData = data.faculty;
      } else if (Array.isArray(data.data)) {
        facultyData = data.data;
      } else if (Array.isArray(data.results)) {
        facultyData = data.results;
      } else {
        throw new Error("Invalid faculty response from server");
      }

      setFaculty(facultyData);
    } catch (err) {
      console.error("Faculty fetch error:", err);
      setFaculty([]);
      setFacultyError(err.message || "Unable to load faculty.");
    } finally {
      setFacultyLoading(false);
    }
  };

  /* =======================================================
     FETCH USERS
  ======================================================= */

  const fetchUsers = async () => {
    setUsersLoading(true);

    try {
      const res = await authFetch("/api/users");
      const data = await res.json();

      let usersData = [];

      if (Array.isArray(data)) {
        usersData = data;
      } else if (Array.isArray(data.users)) {
        usersData = data.users;
      } else if (Array.isArray(data.data)) {
        usersData = data.data;
      } else if (Array.isArray(data.results)) {
        usersData = data.results;
      }

      setUsers(usersData);
    } catch (err) {
      console.error("Users fetch error:", err);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  /* =======================================================
     FETCH BRANCHES
  ======================================================= */

  const fetchBranches = async () => {
    try {
      const res = await authFetch("/api/branches/all");
      const data = await res.json();

      let branchesData = [];

      if (Array.isArray(data)) {
        branchesData = data;
      } else if (Array.isArray(data.branches)) {
        branchesData = data.branches;
      } else if (Array.isArray(data.data)) {
        branchesData = data.data;
      }

      setBranches(branchesData);
    } catch (err) {
      console.error("Branches fetch error:", err);
      setBranches([]);
    }
  };

  /* =======================================================
     FETCH MAPPINGS
  ======================================================= */

  const fetchMappings = async () => {
    setMappingLoading(true);
    setMappingError("");

    try {
      const res = await authFetch("/api/faculty-subject-mapping");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to load mappings",
        );
      }

      let mappingsData = [];

      if (Array.isArray(data)) {
        mappingsData = data;
      } else if (Array.isArray(data.mappings)) {
        mappingsData = data.mappings;
      } else if (Array.isArray(data.data)) {
        mappingsData = data.data;
      } else if (Array.isArray(data.results)) {
        mappingsData = data.results;
      } else {
        throw new Error("Invalid mappings response from server");
      }

      setMappings(mappingsData);
    } catch (err) {
      console.error("Mappings fetch error:", err);
      setMappings([]);
      setMappingError(err.message || "Unable to load mappings.");
    } finally {
      setMappingLoading(false);
    }
  };

  /* =======================================================
     FETCH FACULTY FOR DROPDOWN
  ======================================================= */

  const fetchFacultyDropdown = async () => {
    setFacultyDropdownLoading(true);

    try {
      const res = await authFetch("/api/faculty");
      const data = await res.json();

      let list = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.faculty)) {
        list = data.faculty;
      } else if (Array.isArray(data.data)) {
        list = data.data;
      }

      setFacultyList(list);
    } catch (err) {
      console.error("Faculty dropdown fetch error:", err);
      setFacultyList([]);
    } finally {
      setFacultyDropdownLoading(false);
    }
  };

  /* =======================================================
     FETCH SUBJECTS
  ======================================================= */

  const fetchSubjects = async () => {
    setSubjectsLoading(true);

    try {
      const res = await authFetch("/api/subjects");
      const data = await res.json();

      let subjectsData = [];

      if (Array.isArray(data)) {
        subjectsData = data;
      } else if (Array.isArray(data.subjects)) {
        subjectsData = data.subjects;
      } else if (Array.isArray(data.data)) {
        subjectsData = data.data;
      }

      setSubjects(subjectsData);
    } catch (err) {
      console.error("Subjects fetch error:", err);
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    fetchFaculty();
    fetchUsers();
    fetchBranches();
    fetchMappings();
    fetchFacultyDropdown();
    fetchSubjects();
  }, []);

  /* =======================================================
     FILTERED FACULTY
  ======================================================= */

  const filteredFaculty = useMemo(() => {
    const q = facultySearch.toLowerCase().trim();

    if (!q) return faculty;

    return faculty.filter((f) =>
      [
        f.faculty_code,
        f.user_name,
        f.user_full_name,
        f.full_name,
        f.email,
        f.branch_name,
        f.qualification,
        f.is_hod ? "hod" : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [facultySearch, faculty]);

  /* =======================================================
     FILTERED MAPPINGS
  ======================================================= */

  const filteredMappings = useMemo(() => {
    const q = mappingSearch.toLowerCase().trim();

    if (!q) return mappings;

    return mappings.filter((m) =>
      [
        m.faculty_name,
        m.faculty_code,
        m.subject_name,
        m.subject_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [mappingSearch, mappings]);

  /* =======================================================
     LOOKUP HELPERS
  ======================================================= */

  const getUserName = (f) => {
    if (f.user_name) return f.user_name;
    if (f.user_full_name) return f.user_full_name;
    if (f.full_name) return f.full_name;

    const user = users.find((u) => String(u.id) === String(f.user_id));

    return user?.full_name || user?.email || "-";
  };

  const getUserEmail = (f) => {
    if (f.email) return f.email;

    const user = users.find((u) => String(u.id) === String(f.user_id));

    return user?.email || "-";
  };

  const getBranchName = (f) => {
    if (f.branch_name) return f.branch_name;

    const branch = branches.find((b) => String(b.id) === String(f.branch_id));

    return branch
      ? `${branch.course_name} - ${branch.branch_name}`
      : "-";
  };

  /* =======================================================
     ADD FACULTY
  ======================================================= */

  const handleAddFaculty = () => {
    setEditingFaculty(null);
    setFacultyModalOpen(true);
  };

  /* =======================================================
     EDIT FACULTY
  ======================================================= */

  const handleEditFaculty = (f) => {
    setEditingFaculty(f);
    setFacultyModalOpen(true);
  };

  /* =======================================================
     SAVE FACULTY
  ======================================================= */

  const handleSaveFaculty = async (form) => {
    const url = editingFaculty
      ? `/api/faculty/${editingFaculty.id}`
      : "/api/faculty";

    const method = editingFaculty ? "PUT" : "POST";

    const res = await authFetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    let data = {};

    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid response from server.");
    }

    if (!res.ok) {
      throw new Error(
        data.error || data.message || "Failed to save faculty.",
      );
    }

    await fetchFaculty();
    await fetchFacultyDropdown();

    setFacultyModalOpen(false);
    setEditingFaculty(null);
  };

  /* =======================================================
     DELETE FACULTY
  ======================================================= */

  const handleDeleteFaculty = async (f) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete faculty "${f.faculty_code}"?`,
    );

    if (!confirmed) return;

    try {
      const res = await authFetch(`/api/faculty/${f.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete faculty");
      }

      await fetchFaculty();
    } catch (err) {
      console.error("Delete faculty error:", err);
      alert(err.message || "Failed to delete faculty.");
    }
  };

  /* =======================================================
     SAVE MAPPING
  ======================================================= */

  const handleSaveMapping = async (form) => {
    const url = "/api/faculty-subject-mapping";

    const res = await authFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    let data = {};

    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid response from server.");
    }

    if (!res.ok) {
      throw new Error(
        data.error || data.message || "Failed to save mapping.",
      );
    }

    await fetchMappings();

    setMappingModalOpen(false);
  };

  /* =======================================================
     DELETE MAPPING
  ======================================================= */

  const handleDeleteMapping = async (m) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this mapping?`,
    );

    if (!confirmed) return;

    try {
      const res = await authFetch(`/api/faculty-subject-mapping/${m.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete mapping");
      }

      await fetchMappings();
    } catch (err) {
      console.error("Delete mapping error:", err);
      alert(err.message || "Failed to delete mapping.");
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-3">
      {/* Header */}
      <section className="rounded-lg bg-[#092f6d] px-6 py-5 text-white shadow-soft">
        <div className="flex items-center gap-2 text-[12px] font-bold tracking-[.4px]">
          <GraduationCap size={18} />
          FACULTY MANAGEMENT
        </div>

        <h2 className="mt-2 text-[20px] font-bold">
          FACULTY & SUBJECT MAPPING
        </h2>

        <p className="mt-1 text-[13px] text-[#b8c9e6]">
          Manage faculty members and map them to subjects.
        </p>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="TOTAL FACULTY"
          value={faculty.length}
          color="blue"
        />

        <StatCard
          label="HODs"
          value={
            faculty.filter(
              (f) => f.is_hod === true || f.is_hod === 1 || f.is_hod === "1",
            ).length
          }
          color="green"
        />

        <StatCard
          label="SUBJECT MAPPINGS"
          value={mappings.length}
          color="gray"
        />
      </div>

      {/* Tabs */}
      <section className="overflow-hidden rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        <div className="flex border-b border-[#edf0f4]">
          <button
            type="button"
            onClick={() => setActiveTab("faculty")}
            className={`flex items-center gap-2 px-6 py-3 text-[13px] font-semibold transition ${
              activeTab === "faculty"
                ? "border-b-2 border-[#1b78ff] text-[#1b78ff]"
                : "text-[#8b98aa] hover:text-[#344c69]"
            }`}
          >
            <GraduationCap size={15} />
            Faculty List
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("mapping")}
            className={`flex items-center gap-2 px-6 py-3 text-[13px] font-semibold transition ${
              activeTab === "mapping"
                ? "border-b-2 border-[#1b78ff] text-[#1b78ff]"
                : "text-[#8b98aa] hover:text-[#344c69]"
            }`}
          >
            <BookOpen size={15} />
            Subject Mapping
          </button>
        </div>

        {/* ==============================================
            FACULTY LIST TAB
        ============================================== */}

        {activeTab === "faculty" && (
          <div>
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-[#edf0f4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
                  ALL FACULTY
                </h3>

                <p className="mt-[2px] text-[11px] text-[#8d9aac]">
                  Manage faculty members and their details
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="flex h-9 items-center gap-1 rounded-lg border border-[#e4e8ef] px-3">
                  <Search size={14} className="text-[#8d9aae]" />

                  <input
                    value={facultySearch}
                    onChange={(e) => setFacultySearch(e.target.value)}
                    placeholder="Search faculty..."
                    className="w-[160px] border-0 bg-transparent text-[13px] outline-none placeholder:text-[#a4afbd]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddFaculty}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1b78ff] px-4 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(27,120,255,.25)] hover:bg-[#1560e0]"
                >
                  <Plus size={15} />
                  Add Faculty
                </button>
              </div>
            </div>

            {/* Error */}
            {facultyError && (
              <div className="flex items-center justify-between mx-4 mt-3 rounded-lg border border-[#f5c2c2] bg-[#fff5f5] px-4 py-3">
                <div>
                  <strong className="block text-[12px] text-[#e05252]">
                    Unable to load faculty
                  </strong>
                  <span className="text-[11px] text-[#b56b6b]">
                    {facultyError}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={fetchFaculty}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#1b78ff]"
                >
                  <RefreshCw size={13} />
                  Retry
                </button>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                    {[
                      "Name",
                      "Email",
                      "Faculty Code",
                      "Branch",
                      "Qualification",
                      "Experience",
                      "HOD",
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
                  {facultyLoading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-12 text-center"
                      >
                        <div className="flex items-center justify-center gap-2 text-[12px] text-[#8b98aa]">
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                          Loading faculty...
                        </div>
                      </td>
                    </tr>
                  ) : filteredFaculty.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-12 text-center text-[13px] text-[#8b98aa]"
                      >
                        {facultySearch
                          ? "No faculty match your search."
                          : "No faculty found."}
                      </td>
                    </tr>
                  ) : (
                    filteredFaculty.map((f) => {
                      const isHod =
                        f.is_hod === true ||
                        f.is_hod === 1 ||
                        f.is_hod === "1";

                      return (
                        <tr
                          key={f.id}
                          className="border-b border-[#f0f2f5] text-[12px] text-[#68778c] hover:bg-[#fafcff]"
                        >
                          <td className="px-3 py-3 font-semibold text-[#4d5e76]">
                            {getUserName(f)}
                          </td>

                          <td className="px-3 py-3">
                            {getUserEmail(f)}
                          </td>

                          <td className="px-3 py-3">
                            <span className="inline-flex rounded-md bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#2469c7]">
                              {f.faculty_code}
                            </span>
                          </td>

                          <td className="px-3 py-3">
                            {getBranchName(f)}
                          </td>

                          <td className="px-3 py-3">
                            {f.qualification || "-"}
                          </td>

                          <td className="px-3 py-3">
                            {f.experience_years
                              ? `${f.experience_years} yrs`
                              : "-"}
                          </td>

                          <td className="px-3 py-3">
                            {isHod ? (
                              <span className="inline-flex rounded-md bg-[#eaf8f2] px-2 py-1 text-[11px] font-semibold text-[#27885e]">
                                HOD
                              </span>
                            ) : (
                              <span className="text-[#cbd5e1]">-</span>
                            )}
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditFaculty(f)}
                                className="grid h-8 w-8 place-items-center rounded-lg text-[#1b78ff] hover:bg-[#eef5ff]"
                                title="Edit"
                              >
                                <Edit3 size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteFaculty(f)}
                                className="grid h-8 w-8 place-items-center rounded-lg text-[#e05252] hover:bg-[#fff0f0]"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#edf0f4] px-4 py-3">
              <span className="text-[11px] text-[#8b98aa]">
                Showing {filteredFaculty.length} of {faculty.length} faculty
              </span>

              <button
                type="button"
                onClick={() => {
                  fetchFaculty();
                  fetchUsers();
                  fetchBranches();
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#1b78ff] hover:underline"
              >
                <RefreshCw size={12} />
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* ==============================================
            SUBJECT MAPPING TAB
        ============================================== */}

        {activeTab === "mapping" && (
          <div>
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-[#edf0f4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
                  SUBJECT MAPPINGS
                </h3>

                <p className="mt-[2px] text-[11px] text-[#8d9aac]">
                  Map faculty members to subjects
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="flex h-9 items-center gap-1 rounded-lg border border-[#e4e8ef] px-3">
                  <Search size={14} className="text-[#8d9aae]" />

                  <input
                    value={mappingSearch}
                    onChange={(e) => setMappingSearch(e.target.value)}
                    placeholder="Search mappings..."
                    className="w-[160px] border-0 bg-transparent text-[13px] outline-none placeholder:text-[#a4afbd]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setMappingModalOpen(true)}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1b78ff] px-4 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(27,120,255,.25)] hover:bg-[#1560e0]"
                >
                  <Plus size={15} />
                  Add Mapping
                </button>
              </div>
            </div>

            {/* Error */}
            {mappingError && (
              <div className="flex items-center justify-between mx-4 mt-3 rounded-lg border border-[#f5c2c2] bg-[#fff5f5] px-4 py-3">
                <div>
                  <strong className="block text-[12px] text-[#e05252]">
                    Unable to load mappings
                  </strong>
                  <span className="text-[11px] text-[#b56b6b]">
                    {mappingError}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={fetchMappings}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#1b78ff]"
                >
                  <RefreshCw size={13} />
                  Retry
                </button>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] border-collapse">
                <thead>
                  <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                    {[
                      "Faculty Name",
                      "Faculty Code",
                      "Subject Name",
                      "Subject Code",
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
                  {mappingLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-12 text-center"
                      >
                        <div className="flex items-center justify-center gap-2 text-[12px] text-[#8b98aa]">
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                          Loading mappings...
                        </div>
                      </td>
                    </tr>
                  ) : filteredMappings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-12 text-center text-[13px] text-[#8b98aa]"
                      >
                        {mappingSearch
                          ? "No mappings match your search."
                          : "No subject mappings found."}
                      </td>
                    </tr>
                  ) : (
                    filteredMappings.map((m) => (
                      <tr
                        key={m.id}
                        className="border-b border-[#f0f2f5] text-[12px] text-[#68778c] hover:bg-[#fafcff]"
                      >
                        <td className="px-3 py-3 font-semibold text-[#4d5e76]">
                          {m.faculty_name || "-"}
                        </td>

                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-md bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#2469c7]">
                            {m.faculty_code || "-"}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          {m.subject_name || "-"}
                        </td>

                        <td className="px-3 py-3">
                          <span className="inline-flex rounded-md bg-[#f0fdf4] px-2 py-1 text-[11px] font-semibold text-[#27885e]">
                            {m.subject_code || "-"}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteMapping(m)}
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

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#edf0f4] px-4 py-3">
              <span className="text-[11px] text-[#8b98aa]">
                Showing {filteredMappings.length} of {mappings.length} mappings
              </span>

              <button
                type="button"
                onClick={() => {
                  fetchMappings();
                  fetchFacultyDropdown();
                  fetchSubjects();
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#1b78ff] hover:underline"
              >
                <RefreshCw size={12} />
                Refresh
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Faculty Modal */}
      <Modal
        open={facultyModalOpen}
        onClose={() => {
          setFacultyModalOpen(false);
          setEditingFaculty(null);
        }}
        title={editingFaculty ? "Edit Faculty" : "Add New Faculty"}
        subtitle={
          editingFaculty
            ? "Update faculty member information"
            : "Add a new faculty member"
        }
      >
        <FacultyForm
          faculty={editingFaculty}
          users={users}
          branches={branches}
          usersLoading={usersLoading}
          onSave={handleSaveFaculty}
          onCancel={() => {
            setFacultyModalOpen(false);
            setEditingFaculty(null);
          }}
        />
      </Modal>

      {/* Mapping Modal */}
      <Modal
        open={mappingModalOpen}
        onClose={() => setMappingModalOpen(false)}
        title="Add Subject Mapping"
        subtitle="Map a faculty member to a subject"
      >
        <MappingForm
          mapping={null}
          facultyList={facultyList}
          subjects={subjects}
          facultyLoading={facultyDropdownLoading}
          subjectsLoading={subjectsLoading}
          onSave={handleSaveMapping}
          onCancel={() => setMappingModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
