import React, { useEffect, useMemo, useState } from "react";
import {
  Key,
  Search,
  RefreshCw,
  Loader2,
  Check,
  X,
  Save,
  Info,
} from "lucide-react";

import { authFetch } from "../authFetch";

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  color = "blue",
}) {
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
   TOGGLE CELL
========================================================= */

function ToggleCell({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`grid h-7 w-7 place-items-center rounded-md text-[12px] font-semibold transition ${
        checked
          ? "bg-[#eaf8f2] text-[#27885e] hover:bg-[#d4f1e4]"
          : "bg-[#f5f7fa] text-[#cbd5e1] hover:bg-[#edf0f4]"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      {checked ? <Check size={14} /> : <X size={14} />}
    </button>
  );
}

/* =========================================================
   MAIN PAGE (ROLE-PERMISSION ALLOTMENT MATRIX)
========================================================= */

export default function PermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [views, setViews] = useState([]);
  const [matrix, setMatrix] = useState({});

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================================
     FETCH ALL DATA
  ========================================================= */

  const fetchData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError("");
      setSuccess("");

      const [rolesRes, viewsRes, matrixRes] = await Promise.all([
        authFetch("/api/roles"),
        authFetch("/api/views"),
        authFetch("/api/role-permissions/matrix"),
      ]);

      // Parse roles
      const rolesData = await rolesRes.json();
      let rolesList = [];
      if (Array.isArray(rolesData)) rolesList = rolesData;
      else if (Array.isArray(rolesData?.roles)) rolesList = rolesData.roles;
      setRoles(rolesList);

      // Parse views
      const viewsData = await viewsRes.json();
      let viewsList = [];
      if (Array.isArray(viewsData)) viewsList = viewsData;
      else if (Array.isArray(viewsData?.views)) viewsList = viewsData.views;
      setViews(viewsList);

      // Parse matrix
      const matrixData = await matrixRes.json();
      let matrixList = [];
      if (Array.isArray(matrixData)) matrixList = matrixData;
      else if (Array.isArray(matrixData?.matrix)) matrixList = matrixData.matrix;

      // Build matrix: { roleId_viewId: { can_view, can_add, can_edit, can_delete } }
      const matrixMap = {};
      matrixList.forEach((item) => {
        const key = `${item.role_id}_${item.view_id}`;
        matrixMap[key] = {
          can_view: Boolean(item.can_view),
          can_add: Boolean(item.can_add),
          can_edit: Boolean(item.can_edit),
          can_delete: Boolean(item.can_delete),
          department_scope: item.department_scope || "ALL",
        };
      });
      setMatrix(matrixMap);

    } catch (err) {
      console.error("FETCH DATA ERROR:", err);
      setError(err.message || "Unable to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredRoles = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return roles;
    return roles.filter((r) =>
      (r.name || r.role_name || "").toLowerCase().includes(q)
    );
  }, [search, roles]);

  const filteredViews = useMemo(() => {
    return views;
  }, [views]);

  /* =========================================================
     TOGGLE PERMISSION
  ========================================================= */

  const togglePermission = (roleId, viewId, field) => {
    const key = `${roleId}_${viewId}`;
    const current = matrix[key] || {
      can_view: false,
      can_add: false,
      can_edit: false,
      can_delete: false,
      department_scope: "ALL",
    };

    setMatrix((prev) => ({
      ...prev,
      [key]: {
        ...current,
        [field]: !current[field],
      },
    }));
  };

  /* =========================================================
     SAVE ALL CHANGES
  ========================================================= */

  const saveAll = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Send all matrix entries
      const entries = [];
      Object.entries(matrix).forEach(([key, value]) => {
        const [roleId, viewId] = key.split("_");
        entries.push({
          roleId: parseInt(roleId),
          viewId: parseInt(viewId),
          ...value,
        });
      });

      // Save each entry
      for (const entry of entries) {
        await authFetch(
          `/api/role-permissions/${entry.roleId}/${entry.viewId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              can_view: entry.can_view,
              can_add: entry.can_add,
              can_edit: entry.can_edit,
              can_delete: entry.can_delete,
              department_scope: entry.department_scope,
            }),
          }
        );
      }

      setSuccess("Permissions saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("SAVE ERROR:", err);
      setError(err.message || "Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     STATS
  ========================================================= */

  const totalPermissions = Object.keys(matrix).length;

  const totalRoles = roles.length;
  const totalViews = views.length;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="space-y-3">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="rounded-lg bg-[#092f6d] px-6 py-5 text-white shadow-soft">
        <div className="flex items-center gap-2 text-[12px] font-bold tracking-[.4px]">
          <Key size={18} />

          PERMISSION MANAGEMENT
        </div>

        <p className="mt-2 text-[13px] text-[#b8c9e6]">
          Role-Permission Allotment Matrix — Control which roles can view, add,
          edit, and delete each view in the system.
        </p>
      </section>

      {/* ======================================================
          INFO BANNER
      ====================================================== */}

      <div className="flex items-start gap-3 rounded-lg border border-[#d4e4ff] bg-[#f0f7ff] px-4 py-3">
        <Info size={18} className="mt-0.5 shrink-0 text-[#1b78ff]" />

        <div>
          <p className="text-[12px] font-semibold text-[#1d4c86]">
            How it works
          </p>

          <p className="mt-0.5 text-[11px] text-[#51627c]">
            Click the cells in the matrix below to toggle permissions. Green
            check means allowed, gray X means denied. Click "Save All Changes"
            to persist.
          </p>
        </div>
      </div>

      {/* ======================================================
          ERROR / SUCCESS
      ====================================================== */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[12px] font-medium text-green-600">
          {success}
        </div>
      )}

      {/* ======================================================
          STATS
      ====================================================== */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="ROLES" value={totalRoles} color="blue" />
        <StatCard label="VIEWS" value={totalViews} color="green" />
        <StatCard label="CONFIGURED PERMISSIONS" value={totalPermissions} color="gray" />
        <StatCard
          label="TOTAL POSSIBLE"
          value={totalRoles * totalViews}
          color="gray"
        />
      </div>

      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex h-9 items-center gap-1 rounded-lg border border-[#e4e8ef] px-3">
          <Search size={14} className="text-[#8d9aae]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles..."
            className="w-[200px] border-0 bg-transparent text-[13px] outline-none placeholder:text-[#a4afbd]"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fetchData(false)}
            disabled={loading}
            className="grid h-9 w-9 place-items-center rounded-lg border border-[#e4e8ef] bg-white text-[#51627c] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={saveAll}
            disabled={saving || loading}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1b78ff] px-4 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(27,120,255,.25)] hover:bg-[#1560e0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </div>

      {/* ======================================================
          MATRIX TABLE
      ====================================================== */}

      <section className="overflow-hidden rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-2 text-[13px] text-[#8b98aa]">
              <Loader2 size={18} className="animate-spin" />
              Loading permission matrix...
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* HEADER */}
              <thead>
                <tr className="bg-[#fafbfd]">
                  <th className="sticky left-0 z-10 border-b border-[#edf0f4] bg-[#fafbfd] px-3 py-3 text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                    Role
                  </th>

                  {filteredViews.map((view) => (
                    <th
                      key={view.id}
                      className="border-b border-[#edf0f4] px-2 py-3 text-center"
                    >
                      <div className="text-[10px] font-bold uppercase text-[#8c99ab]">
                        {view.module_name || "Module"}
                      </div>
                      <div className="mt-0.5 text-[11px] font-semibold text-[#1d4c86]">
                        {view.name || view.view_name}
                      </div>
                      <div className="mt-0.5 flex items-center justify-center gap-1 text-[9px] text-[#9aa7b6]">
                        <span>V</span>
                        <span>A</span>
                        <span>E</span>
                        <span>D</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* BODY */}
              <tbody>
                {filteredRoles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={filteredViews.length + 1}
                      className="px-3 py-12 text-center text-[13px] text-[#8b98aa]"
                    >
                      No roles found.
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <tr
                      key={role.id}
                      className="border-b border-[#f0f2f5] hover:bg-[#fafcff]"
                    >
                      {/* ROLE NAME */}
                      <td className="sticky left-0 z-10 border-r border-[#edf0f4] bg-white px-3 py-3">
                        <div className="text-[12px] font-semibold text-[#1d4c86]">
                          {role.name || role.role_name}
                        </div>
                        <div className="text-[10px] text-[#9aa7b6]">
                          ID: {role.id}
                        </div>
                      </td>

                      {/* PERMISSION CELLS */}
                      {filteredViews.map((view) => {
                        const key = `${role.id}_${view.id}`;
                        const perm = matrix[key] || {
                          can_view: false,
                          can_add: false,
                          can_edit: false,
                          can_delete: false,
                        };

                        return (
                          <td
                            key={view.id}
                            className="border-l border-[#f0f2f5] px-2 py-2"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <ToggleCell
                                checked={perm.can_view}
                                onChange={() =>
                                  togglePermission(role.id, view.id, "can_view")
                                }
                                title="Can View"
                              />
                              <ToggleCell
                                checked={perm.can_add}
                                onChange={() =>
                                  togglePermission(role.id, view.id, "can_add")
                                }
                                title="Can Add"
                              />
                              <ToggleCell
                                checked={perm.can_edit}
                                onChange={() =>
                                  togglePermission(role.id, view.id, "can_edit")
                                }
                                title="Can Edit"
                              />
                              <ToggleCell
                                checked={perm.can_delete}
                                onChange={() =>
                                  togglePermission(role.id, view.id, "can_delete")
                                }
                                title="Can Delete"
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* LEGEND */}
        <div className="border-t border-[#edf0f4] px-4 py-3">
          <div className="flex items-center gap-4 text-[10px] text-[#8b98aa]">
            <span className="font-semibold">Legend:</span>
            <span className="flex items-center gap-1">
              <span className="grid h-5 w-5 place-items-center rounded bg-[#eaf8f2] text-[#27885e]">
                <Check size={10} />
              </span>
              = View
            </span>
            <span className="flex items-center gap-1">
              <span className="grid h-5 w-5 place-items-center rounded bg-[#eaf8f2] text-[#27885e]">
                <Check size={10} />
              </span>
              = Add
            </span>
            <span className="flex items-center gap-1">
              <span className="grid h-5 w-5 place-items-center rounded bg-[#eaf8f2] text-[#27885e]">
                <Check size={10} />
              </span>
              = Edit
            </span>
            <span className="flex items-center gap-1">
              <span className="grid h-5 w-5 place-items-center rounded bg-[#eaf8f2] text-[#27885e]">
                <Check size={10} />
              </span>
              = Delete
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
