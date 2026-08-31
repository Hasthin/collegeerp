import React, { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Plus,
  Search,
  Trash2,
  UserCircle,
  X,
  Eye,
  EyeOff,
  RefreshCw,
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
          {/* Header */}
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

          {/* Body */}
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
   PASSWORD FIELD
========================================================= */

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  error,
  success,
  required = false,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
        {label}
        {required && <span className="ml-1 text-[#e05252]">*</span>}
      </label>

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`h-10 w-full rounded-lg border bg-white px-3 pr-10 text-[13px] text-[#344c69] outline-none placeholder:text-[#a4afbd] focus:ring-1 ${
            error
              ? "border-[#e05252] focus:border-[#e05252] focus:ring-[#e05252]/20"
              : success
                ? "border-[#36a66e] focus:border-[#36a66e] focus:ring-[#36a66e]/20"
                : "border-[#e3e8ef] focus:border-[#1b78ff] focus:ring-[#1b78ff]/20"
          }`}
        />

        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-0 top-0 grid h-10 w-10 place-items-center text-[#8b98aa] hover:text-[#344c69]"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {error && (
        <p className="mt-1 text-[11px] font-medium text-[#e05252]">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-1 text-[11px] font-medium text-[#36a66e]">
          Password matched.
        </p>
      )}
    </div>
  );
}

/* =========================================================
   USER FORM (collegeerp: email, name, role_id, branch_id)
========================================================= */

function UserForm({
  user,
  roles,
  branches,
  rolesLoading,
  rolesError,
  onRetryRoles,
  onSave,
  onCancel,
}) {
  const isEdit = Boolean(user);

  const [form, setForm] = useState({
    id: user?.id || "",
    email: user?.email || "",
    full_name: user?.full_name || "",
    status: user?.status || "Active",
    role_id: user?.role_id || "",
    branch_id: user?.branch_id || "",
    password: "",
    confirm_password: "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      id: user?.id || "",
      email: user?.email || "",
      full_name: user?.full_name || "",
      status: user?.status || "Active",
      role_id: user?.role_id || "",
      branch_id: user?.branch_id || "",
      password: "",
      confirm_password: "",
    });

    setError("");
  }, [user]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "password" || field === "confirm_password") {
      setError("");
    }
  };

  const passwordsFilled =
    form.password.length > 0 || form.confirm_password.length > 0;

  const passwordsMatch =
    form.password.length > 0 &&
    form.password === form.confirm_password;

  const passwordMismatch =
    passwordsFilled && form.password !== form.confirm_password;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    /* ---------------------------------------------
       BASIC VALIDATION
    --------------------------------------------- */

    if (!form.id.trim()) {
      setError("User ID is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!form.full_name.trim()) {
      setError("Full Name is required.");
      return;
    }

    if (!form.role_id) {
      setError("Role is required.");
      return;
    }

    /* ---------------------------------------------
       PASSWORD VALIDATION
    --------------------------------------------- */

    if (!isEdit && !form.password) {
      setError("Password is required when creating a user.");
      return;
    }

    if (form.password || form.confirm_password) {
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      if (form.password !== form.confirm_password) {
        setError("Password and Confirm Password do not match.");
        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        id: form.id.trim(),
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        status: form.status,
        role_id: form.role_id || "",
        branch_id: form.branch_id || null,
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      await onSave(payload);
    } catch (err) {
      setError(err.message || "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error */}
      {error && (
        <div className="rounded-lg border border-[#f5c2c2] bg-[#fff0f0] px-3 py-2.5 text-[12px] font-medium text-[#e05252]">
          {error}
        </div>
      )}

      {/* User Details */}
      <div>
        <h3 className="mb-3 text-[12px] font-bold uppercase tracking-[.35px] text-[#1d4c86]">
          User Information
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* User ID */}
          <InputField
            label="User ID"
            value={form.id}
            onChange={handleChange("id")}
            placeholder="USR-001"
            disabled={isEdit}
            required
          />

          {/* Email */}
          <InputField
            label="Email"
            value={form.email}
            onChange={handleChange("email")}
            placeholder="john@university.com"
            type="email"
            required
          />

          {/* Full Name */}
          <InputField
            label="Full Name"
            value={form.full_name}
            onChange={handleChange("full_name")}
            placeholder="John Doe"
            required
          />

          {/* Role */}
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
              Role
              <span className="ml-1 text-[#e05252]">*</span>
            </label>

            {rolesLoading ? (
              <div className="flex h-10 items-center gap-2 rounded-lg border border-[#e3e8ef] bg-[#f8fafc] px-3 text-[12px] text-[#8b98aa]">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#cbd5e1] border-t-[#1b78ff]" />
                Loading roles...
              </div>
            ) : rolesError ? (
              <div>
                <div className="flex h-10 items-center justify-between rounded-lg border border-[#f5c2c2] bg-[#fff5f5] px-3">
                  <span className="text-[12px] text-[#e05252]">
                    Unable to load roles
                  </span>

                  <button
                    type="button"
                    onClick={onRetryRoles}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#1b78ff] hover:underline"
                  >
                    <RefreshCw size={12} />
                    Retry
                  </button>
                </div>

                <p className="mt-1 text-[10px] text-[#e05252]">
                  {rolesError}
                </p>
              </div>
            ) : (
              <select
                value={form.role_id || ""}
                onChange={handleChange("role_id")}
                required
                className="h-10 w-full rounded-lg border border-[#e3e8ef] bg-white px-3 text-[13px] text-[#344c69] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/20"
              >
                <option value="">-- Select Role --</option>

                {roles
                  .filter(
                    (role) =>
                      String(role.name || "").toLowerCase() !==
                      "superadmin",
                  )
                  .map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
              </select>
            )}

            {!rolesLoading &&
              !rolesError &&
              roles.filter(
                (role) =>
                  String(role.name || "").toLowerCase() !== "superadmin",
              ).length === 0 && (
                <p className="mt-1 text-[10px] text-[#e05252]">
                  No roles available.
                </p>
              )}
          </div>

          {/* Branch */}
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
              Branch
            </label>

            <select
              value={form.branch_id || ""}
              onChange={handleChange("branch_id")}
              className="h-10 w-full rounded-lg border border-[#e3e8ef] bg-white px-3 text-[13px] text-[#344c69] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/20"
            >
              <option value="">-- Select Branch --</option>

              {(branches || []).map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.course_name} - {branch.branch_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
              Status
            </label>

            <select
              value={form.status}
              onChange={handleChange("status")}
              className="h-10 w-full rounded-lg border border-[#e3e8ef] bg-white px-3 text-[13px] text-[#344c69] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/20"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="border-t border-[#edf0f4] pt-4">
        <h3 className="mb-3 text-[12px] font-bold uppercase tracking-[.35px] text-[#1d4c86]">
          {isEdit ? "Change Password" : "Password"}
        </h3>

        {isEdit && (
          <p className="mb-3 rounded-lg bg-[#f8fafc] px-3 py-2 text-[11px] text-[#8b98aa]">
            Leave password blank if you do not want to change the current
            password.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PasswordField
            label="Password"
            value={form.password}
            onChange={handleChange("password")}
            placeholder={
              isEdit
                ? "Leave blank to keep current"
                : "Enter password"
            }
            required={!isEdit}
          />

          <PasswordField
            label="Confirm Password"
            value={form.confirm_password}
            onChange={handleChange("confirm_password")}
            placeholder="Confirm password"
            error={
              passwordMismatch
                ? "Password and Confirm Password do not match."
                : ""
            }
            success={passwordsMatch}
            required={!isEdit || Boolean(form.password)}
          />
        </div>
      </div>

      {/* Buttons */}
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
          disabled={saving || rolesLoading}
          className="flex items-center gap-2 rounded-lg bg-[#1b78ff] px-5 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(27,120,255,.25)] hover:bg-[#1560e0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}

          {saving
            ? "Saving..."
            : isEdit
              ? "Update User"
              : "Create User"}
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
   USERS PAGE
========================================================= */

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);

  const [error, setError] = useState("");
  const [rolesError, setRolesError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  /* =======================================================
     FETCH USERS
  ======================================================= */

  const fetchUsers = async () => {
  setLoading(true);
  setError("");

  try {
    const res = await authFetch("/api/users");

    const data = await res.json();

    console.log("USERS API RESPONSE:", data);

    if (!res.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          "Failed to load users"
      );
    }

    let usersData = [];

    if (Array.isArray(data)) {
      usersData = data;
    } else if (Array.isArray(data.users)) {
      usersData = data.users;
    } else if (Array.isArray(data.data)) {
      usersData = data.data;
    } else if (Array.isArray(data.results)) {
      usersData = data.results;
    } else {
      console.error(
        "Unexpected users response:",
        data
      );

      throw new Error(
        "Invalid users response from server"
      );
    }

    setUsers(usersData);
  } catch (err) {
    console.error("Users fetch error:", err);

    setUsers([]);
    setError(
      err.message || "Unable to load users."
    );
  } finally {
    setLoading(false);
  }
};

  /* =======================================================
     FETCH ROLES
  ======================================================= */
const fetchRoles = async () => {
  setRolesLoading(true);
  setRolesError("");

  try {
    console.log("Fetching roles: GET /api/roles");

    const res = await authFetch("/api/roles");

    let data = {};

    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid JSON response from roles API.");
    }

    console.log("ROLES API STATUS:", res.status);
    console.log("ROLES API RESPONSE:", data);

    if (!res.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          "Failed to load roles"
      );
    }

    let rolesData = [];

    if (Array.isArray(data)) {
      rolesData = data;
    } else if (Array.isArray(data.roles)) {
      rolesData = data.roles;
    } else if (Array.isArray(data.data)) {
      rolesData = data.data;
    } else if (Array.isArray(data.results)) {
      rolesData = data.results;
    } else {
      console.error("Unexpected roles response:", data);

      throw new Error(
        "Invalid roles response from server."
      );
    }

    const normalizedRoles = rolesData
      .map((role) => ({
        id:
          role.id ??
          role.role_id ??
          role.roleId ??
          "",

        name:
          role.name ??
          role.role_name ??
          role.roleName ??
          role.role_code ??
          "",
      }))
      .filter(
        (role) =>
          String(role.id).trim() !== "" &&
          String(role.name).trim() !== ""
      );

    console.log(
      "NORMALIZED ROLES:",
      normalizedRoles
    );

    setRoles(normalizedRoles);

    if (normalizedRoles.length === 0) {
      setRolesError("No roles available.");
    }
  } catch (err) {
    console.error("Roles fetch error:", err);

    setRoles([]);
    setRolesError(
      err.message ||
        "Unable to load roles. Please try again."
    );
  } finally {
    setRolesLoading(false);
  }
};

  /* =======================================================
     FETCH BRANCHES
  ======================================================= */

  const fetchBranches = async () => {
    try {
      const res = await authFetch("/api/branches");
      const data = await res.json();

      if (res.ok && Array.isArray(data.branches)) {
        setBranches(data.branches);
      }
    } catch (err) {
      console.error("Branches fetch error:", err);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchBranches();
  }, []);

  /* =======================================================
     FILTER USERS
  ======================================================= */

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) {
      return users;
    }

    return users.filter((user) =>
      [
        user.id,
        user.username,
        user.email,
        user.full_name,
        user.status,
        user.roles,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [search, users]);

  /* =======================================================
     ADD USER
  ======================================================= */

  const handleAdd = () => {
    setEditing(null);
    setRolesError("");
    setModalOpen(true);
  };

  /* =======================================================
     EDIT USER
  ======================================================= */

  const handleEdit = (user) => {
    setEditing({
      ...user,
      role_id: user.role_id || "",
    });

    setRolesError("");
    setModalOpen(true);
  };

  /* =======================================================
     DELETE USER
  ======================================================= */

  const handleDelete = async (id) => {
    const user = users.find((u) => String(u.id) === String(id));

    if (!user) {
      return;
    }

    // Protect Super Admin based on role name
    if (
      String(user.roles || "").toLowerCase().includes("super admin") ||
      String(user.roles || "").toLowerCase().includes("superadmin")
    ) {
      alert("Cannot delete Super Admin user.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete user "${user.email}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const res = await authFetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to delete user",
        );
      }

      await fetchUsers();
    } catch (err) {
      console.error("Delete user error:", err);

      alert(err.message || "Failed to delete user.");
    }
  };

  /* =======================================================
     SAVE USER
  ======================================================= */

  const handleSave = async (form) => {
    const url = editing
      ? `/api/users/${editing.id}`
      : "/api/users";

    const method = editing ? "PUT" : "POST";

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
        data.error ||
          data.message ||
          "Failed to save user.",
      );
    }

    await fetchUsers();

    setModalOpen(false);
    setEditing(null);
  };

  /* =======================================================
     ROLE NAME
  ======================================================= */

  const getRoleName = (user) => {
    if (user.roles) {
      return user.roles;
    }

    if (user.role_name) {
      return user.role_name;
    }

    const role = roles.find(
      (r) => String(r.id) === String(user.role_id),
    );

    return role?.name || "No Role";
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="space-y-3">
      {/* Header */}
      <section className="rounded-lg bg-[#092f6d] px-6 py-5 text-white shadow-soft">
        <div className="flex items-center gap-2 text-[12px] font-bold tracking-[.4px]">
          <UserCircle size={18} />
          USER MANAGEMENT
        </div>

        <h2 className="mt-2 text-[20px] font-bold">
          SYSTEM USERS
        </h2>

        <p className="mt-1 text-[13px] text-[#b8c9e6]">
          Manage system users, roles, account status and
          passwords.
        </p>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-[#f5c2c2] bg-[#fff5f5] px-4 py-3">
          <div>
            <strong className="block text-[12px] text-[#e05252]">
              Unable to load users
            </strong>

            <span className="text-[11px] text-[#b56b6b]">
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#1b78ff]"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="TOTAL USERS"
          value={users.length}
          color="blue"
        />

        <StatCard
          label="ACTIVE"
          value={
            users.filter(
              (u) =>
                String(u.status).toLowerCase() ===
                "active",
            ).length
          }
          color="green"
        />

        <StatCard
          label="INACTIVE"
          value={
            users.filter(
              (u) =>
                String(u.status).toLowerCase() ===
                "inactive",
            ).length
          }
          color="gray"
        />
      </div>

      {/* Users Table */}
      <section className="overflow-hidden rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-[#edf0f4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
              ALL USERS
            </h3>

            <p className="mt-[2px] text-[11px] text-[#8d9aac]">
              Manage user accounts and assigned roles
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
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
                placeholder="Search users..."
                className="w-[160px] border-0 bg-transparent text-[13px] outline-none placeholder:text-[#a4afbd]"
              />
            </div>

            {/* Add */}
            <button
              type="button"
              onClick={handleAdd}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1b78ff] px-4 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(27,120,255,.25)] hover:bg-[#1560e0]"
            >
              <Plus size={15} />
              Add New
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                {[
                  "ID",
                  "Email",
                  "Full Name",
                  "Role",
                  "Status",
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
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-12 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-[12px] text-[#8b98aa]">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#cbd5e1] border-t-[#1b78ff]" />
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-12 text-center text-[13px] text-[#8b98aa]"
                  >
                    {search
                      ? "No users match your search."
                      : "No users found."}
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const isSuperAdmin =
                    String(
                      user.roles || "",
                    ).toLowerCase().includes("super admin") ||
                    String(
                      user.roles || "",
                    ).toLowerCase().includes("superadmin");

                  const isActive =
                    String(user.status).toLowerCase() ===
                    "active";

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-[#f0f2f5] text-[12px] text-[#68778c] hover:bg-[#fafcff]"
                    >
                      {/* ID */}
                      <td className="px-3 py-3 font-semibold text-[#4d5e76]">
                        {user.id}
                      </td>

                      {/* Email */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="grid h-7 w-7 place-items-center rounded-full bg-[#eef5ff] text-[#1b78ff]">
                            <UserCircle size={16} />
                          </div>

                          <span className="font-medium text-[#344c69]">
                            {user.email}
                          </span>
                        </div>
                      </td>

                      {/* Full Name */}
                      <td className="px-3 py-3">
                        {user.full_name || "-"}
                      </td>

                      {/* Role */}
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-md bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#2469c7]">
                          {getRoleName(user)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-[11px] font-semibold ${
                            isActive
                              ? "bg-[#eaf8f2] text-[#27885e]"
                              : "bg-[#f1f5f9] text-[#8b98aa]"
                          }`}
                        >
                          {user.status || "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(user)
                            }
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#1b78ff] hover:bg-[#eef5ff]"
                            title="Edit"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            disabled={isSuperAdmin}
                            onClick={() =>
                              handleDelete(user.id)
                            }
                            className={`grid h-8 w-8 place-items-center rounded-lg ${
                              isSuperAdmin
                                ? "cursor-not-allowed text-[#cbd5e1]"
                                : "text-[#e05252] hover:bg-[#fff0f0]"
                            }`}
                            title={
                              isSuperAdmin
                                ? "Cannot delete superadmin"
                                : "Delete"
                            }
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
            Showing {filtered.length} of {users.length} users
          </span>

          <button
            type="button"
            onClick={() => {
              fetchUsers();
              fetchRoles();
            }}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#1b78ff] hover:underline"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </section>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          if (!loading) {
            setModalOpen(false);
            setEditing(null);
          }
        }}
        title={editing ? "Edit User" : "Add New User"}
        subtitle={
          editing
            ? "Update system user information"
            : "Create a new system user"
        }
      >
        <UserForm
          user={editing}
          roles={roles}
          branches={branches}
          rolesLoading={rolesLoading}
          rolesError={rolesError}
          onRetryRoles={fetchRoles}
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
