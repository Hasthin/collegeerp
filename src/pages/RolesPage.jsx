import React, { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Plus,
  Search,
  Shield,
  Trash2,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { authFetch } from "../authFetch";

// ============================================================
// MODAL
// ============================================================

function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/40"
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-lg rounded-xl border border-[#e5eaf1] bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#edf0f4] px-6 py-4">
            <div>
              <h2 className="text-[18px] font-bold text-[#1a345c]">
                {title}
              </h2>

              <p className="mt-1 text-[11px] text-[#8d9aac]">
                {title === "Edit Role"
                  ? "Update role information"
                  : "Create a new system role"}
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

          {/* Body */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// ROLE FORM (collegeerp: role_name, description - no status)
// ============================================================

function RoleForm({ role, onSave, onCancel }) {
  const isEdit = Boolean(role);

  const [form, setForm] = useState({
    name: role?.name || "",
    description: role?.description || "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: role?.name || "",
      description: role?.description || "",
    });

    setError("");
  }, [role]);

  // ----------------------------------------------------------
  // HANDLE CHANGE
  // ----------------------------------------------------------

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  // ----------------------------------------------------------
  // SUBMIT
  // ----------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const name = String(form.name || "").trim();
    const description = String(form.description || "").trim();

    if (!name) {
      setError("Role name is required.");
      return;
    }

    try {
      setSaving(true);

      await onSave({
        name,
        description,
      });
    } catch (err) {
      console.error("ROLE SAVE ERROR:", err);

      setError(
        err?.message || "Unable to save role. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Fields */}
      <div className="space-y-4">
        {/* Role Name */}
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Role Name <span className="text-[#e05252]">*</span>
          </label>

          <input
            type="text"
            value={form.name}
            onChange={handleChange("name")}
            placeholder="Administrator"
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Description
          </label>

          <input
            type="text"
            value={form.description}
            onChange={handleChange("description")}
            placeholder="Full system access"
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          />
        </div>
      </div>

      {/* Buttons */}
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

          {saving ? "Saving..." : isEdit ? "Update Role" : "Save Role"}
        </button>
      </div>
    </form>
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
      <span className="block text-[11px] text-[#8b98aa]">
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
// MAIN PAGE
// ============================================================

export default function RolesPage() {
  const [roles, setRoles] = useState([]);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editing, setEditing] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  // ==========================================================
  // CURRENT USER
  // ==========================================================

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  // ==========================================================
  // USER ROLES
  // ==========================================================

  const userRoles = useMemo(() => {
    const rolesValue = currentUser?.roles;

    if (Array.isArray(rolesValue)) {
      return rolesValue
        .map((role) => String(role).trim())
        .filter(Boolean);
    }

    return String(rolesValue || "")
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);
  }, [currentUser]);

  // ==========================================================
  // SUPER ADMIN CHECK
  // ==========================================================

  const isSuperAdmin = useMemo(() => {
    const normalizedRoles = userRoles.map((role) =>
      String(role).toLowerCase().trim()
    );

    return (
      normalizedRoles.includes("super admin") ||
      normalizedRoles.includes("superadmin") ||
      normalizedRoles.includes("super_admin")
    );
  }, [userRoles]);

  // ==========================================================
  // FETCH ROLES
  // ==========================================================

  const fetchRoles = async (showLoader = true) => {
  try {
    if (showLoader) {
      setLoading(true);
    }

    setError("");

    console.log("Fetching roles...");

    const response = await authFetch("/api/roles");

    console.log(
      "GET /api/roles status:",
      response.status
    );

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

    console.log("Roles API response:", data);

    if (!response.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          `Failed to fetch roles (${response.status})`
      );
    }

    let rolesData = [];

    if (Array.isArray(data)) {
      rolesData = data;
    } else if (Array.isArray(data?.roles)) {
      rolesData = data.roles;
    } else if (Array.isArray(data?.data)) {
      rolesData = data.data;
    } else if (Array.isArray(data?.result)) {
      rolesData = data.result;
    }

    if (!Array.isArray(rolesData)) {
      console.error(
        "Unexpected roles API response:",
        data
      );

      throw new Error(
        "Invalid roles response. Expected an array."
      );
    }

    const normalizedRoles = rolesData.map((role) => ({
      id: role.id ?? role.role_id ?? "",
      name:
        role.name ??
        role.role_name ??
        role.roleCode ??
        role.role_code ??
        "",
      description:
        role.description ??
        role.role_description ??
        "",
      // Roles in collegeerp don't have a status column - always Active
      status: "Active",
    }));

    console.log(
      "Normalized roles:",
      normalizedRoles
    );

    setRoles(normalizedRoles);

  } catch (err) {
    console.error("FETCH ROLES ERROR:", err);

    setRoles([]);

    setError(
      err?.message ||
        "Unable to load roles. Please check the server."
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
    fetchRoles(true);
  }, []);

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRoles(false);
  };

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) {
      return roles;
    }

    return roles.filter((role) =>
      Object.values(role || {})
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [search, roles]);

  // ==========================================================
  // ADD
  // ==========================================================

  const handleAdd = () => {
    console.log("Add New Role clicked");

    setEditing(null);
    setModalOpen(true);
  };

  // ==========================================================
  // EDIT
  // ==========================================================

  const handleEdit = (role) => {
    if (!role) return;

    setEditing(role);
    setModalOpen(true);
  };

  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  // ==========================================================
  // SAVE ROLE
  // ==========================================================

  const handleSave = async (form) => {
    try {
      let response;

      if (editing) {
        // UPDATE
        response = await authFetch(
          `/api/roles/${encodeURIComponent(editing.id)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: form.name,
              description: form.description,
            }),
          }
        );
      } else {
        // CREATE
        response = await authFetch("/api/roles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
          }),
        });
      }

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
            "Failed to save role."
        );
      }

      console.log("Role saved:", data);

      closeModal();

      await fetchRoles(false);
    } catch (err) {
      console.error("SAVE ROLE ERROR:", err);

      throw new Error(
        err?.message || "Failed to save role."
      );
    }
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete = async (role) => {
    if (!role) return;

    const roleName = String(role.name || "").toLowerCase();

    // Protect Super Admin
    if (
      roleName === "superadmin" ||
      roleName === "super admin" ||
      roleName === "super_admin"
    ) {
      alert("Super Admin role cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${role.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(role.id);

      const response = await authFetch(
        `/api/roles/${encodeURIComponent(role.id)}`,
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
            "Failed to delete role."
        );
      }

      await fetchRoles(false);
    } catch (err) {
      console.error("DELETE ROLE ERROR:", err);

      alert(
        err?.message ||
          "Failed to delete role."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================================
  // COUNTS
  // ==========================================================

  const totalRoles = roles.length;

  // All roles are Active in collegeerp (no status column)
  const activeRoles = roles.length;

  const inactiveRoles = 0;

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
          <Shield size={18} />

          ROLE MANAGEMENT
        </div>

        <p className="mt-2 text-[13px] text-[#b8c9e6]">
          Define and manage roles that control user access
          levels across the system.
        </p>
      </section>

      {/* ====================================================
          STATS
      ==================================================== */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="TOTAL ROLES"
          value={totalRoles}
          color="blue"
        />

        <StatCard
          label="ALL ROLES"
          value={activeRoles}
          color="green"
        />

        <StatCard
          label="DESCRIPTIONS"
          value={
            roles.filter((r) => r.description && r.description.trim())
              .length
          }
          color="gray"
        />
      </div>

      {/* ====================================================
          TABLE
      ==================================================== */}

      <section className="overflow-hidden rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-[#edf0f4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Title */}
          <div>
            <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
              ALL ROLES
            </h3>

            <p className="mt-[2px] text-[11px] text-[#8d9aac]">
              Create and manage system roles
            </p>
          </div>

          {/* Actions */}
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
                placeholder="Search roles..."
                className="w-[150px] border-0 bg-transparent text-[13px] outline-none placeholder:text-[#a4afbd]"
              />
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh roles"
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

        {/* Error */}
        {error && (
          <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>

              <button
                type="button"
                onClick={() => fetchRoles(true)}
                className="font-semibold underline"
              >
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

              Loading roles...
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] border-collapse">
              {/* Header */}
              <thead>
                <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                  <th className="border-b border-[#edf0f4] px-3 py-3">
                    ID
                  </th>

                  <th className="border-b border-[#edf0f4] px-3 py-3">
                    Name
                  </th>

                  <th className="border-b border-[#edf0f4] px-3 py-3">
                    Description
                  </th>

                  <th className="border-b border-[#edf0f4] px-3 py-3">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-12 text-center text-[13px] text-[#8b98aa]"
                    >
                      {search
                        ? "No roles match your search."
                        : "No roles found."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((role) => {
                    const isSuperAdminRole =
                      [
                        "superadmin",
                        "super admin",
                        "super_admin",
                      ].includes(
                        String(
                          role.name || ""
                        ).toLowerCase()
                      );

                    return (
                      <tr
                        key={role.id}
                        className="border-b border-[#f0f2f5] text-[12px] text-[#68778c] transition hover:bg-[#fafcff]"
                      >
                        {/* ID */}
                        <td className="px-3 py-3 font-semibold text-[#4d5e76]">
                          {role.id}
                        </td>

                        {/* Name */}
                        <td className="px-3 py-3 font-semibold text-[#1d4c86]">
                          {role.name}
                        </td>

                        {/* Description */}
                        <td className="px-3 py-3">
                          {role.description ||
                            "-"}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  role
                                )
                              }
                              className="grid h-8 w-8 place-items-center rounded-lg text-[#1b78ff] hover:bg-[#eef5ff]"
                              title="Edit"
                            >
                              <Edit3
                                size={15}
                              />
                            </button>

                            {/* Delete */}
                            {isSuperAdminRole ? (
                              <button
                                type="button"
                                disabled
                                className="grid h-8 w-8 cursor-not-allowed place-items-center rounded-lg text-[#d1d5db]"
                                title="Cannot delete Super Admin"
                              >
                                <Trash2
                                  size={15}
                                />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    role
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  role.id
                                }
                                className="grid h-8 w-8 place-items-center rounded-lg text-[#e05252] hover:bg-[#fff0f0] disabled:cursor-not-allowed disabled:opacity-50"
                                title="Delete"
                              >
                                {deletingId ===
                                role.id ? (
                                  <Loader2
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2
                                    size={15}
                                  />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ====================================================
          ROLE MODAL
      ==================================================== */}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={
          editing
            ? "Edit Role"
            : "Add New Role"
        }
      >
        <RoleForm
          role={editing}
          onSave={handleSave}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
}
