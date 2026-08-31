import React, { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Eye,
  Plus,
  Search,
  Trash2,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { authFetch } from "../authFetch";

/* =========================================================
   MODAL
========================================================= */

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
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#edf0f4] px-6 py-4">
            <div>
              <h2 className="text-[18px] font-bold text-[#1a345c]">
                {title}
              </h2>

              <p className="mt-1 text-[11px] text-[#8d9aac]">
                {title === "Edit View"
                  ? "Update view information"
                  : "Create a new system view"}
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

/* =========================================================
   VIEW FORM (collegeerp: view_name, view_url, module_name, icon)
========================================================= */

function ViewForm({
  view,
  onSave,
  onCancel,
  saving = false,
}) {
  const [form, setForm] = useState({
    name: "",
    route: "",
    module_name: "",
    icon: "",
  });

  const [error, setError] = useState("");

  /* =======================================================
     LOAD FORM
  ======================================================= */

  useEffect(() => {
    if (view) {
      setForm({
        name:
          view.name ??
          view.view_name ??
          view.viewName ??
          "",

        route:
          view.route ??
          view.view_url ??
          view.path ??
          "",

        module_name:
          view.module_name ??
          view.module ??
          "",

        icon:
          view.icon ??
          "",
      });
    } else {
      setForm({
        name: "",
        route: "",
        module_name: "",
        icon: "",
      });
    }

    setError("");
  }, [view]);

  /* =======================================================
     HANDLE CHANGE
  ======================================================= */

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));

    setError("");
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = String(form.name || "").trim();
    const route = String(form.route || "").trim();
    const module_name = String(form.module_name || "").trim();
    const icon = String(form.icon || "").trim();

    if (!name) {
      setError("View name is required.");
      return;
    }

    if (!route) {
      setError("View URL/Route is required.");
      return;
    }

    if (!module_name) {
      setError("Module name is required.");
      return;
    }

    try {
      setError("");

      await onSave({
        name,
        route,
        module_name,
        icon,
      });
    } catch (err) {
      console.error("VIEW FORM ERROR:", err);

      setError(
        err?.message ||
          "Unable to save view."
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {/* Error */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* =================================================
            VIEW NAME
        ================================================= */}

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            View Name <span className="text-[#e05252]">*</span>
          </label>

          <input
            type="text"
            value={form.name}
            onChange={handleChange("name")}
            placeholder="Student Records"
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          />
        </div>

        {/* =================================================
            MODULE NAME
        ================================================= */}

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Module Name <span className="text-[#e05252]">*</span>
          </label>

          <input
            type="text"
            value={form.module_name}
            onChange={handleChange("module_name")}
            placeholder="Student Management"
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          />
        </div>

        {/* =================================================
            VIEW URL / ROUTE
        ================================================= */}

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            View URL <span className="text-[#e05252]">*</span>
          </label>

          <input
            type="text"
            value={form.route}
            onChange={handleChange("route")}
            placeholder="/student-records"
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          />
        </div>

        {/* =================================================
            ICON
        ================================================= */}

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-[#344c69]">
            Icon
          </label>

          <input
            type="text"
            value={form.icon}
            onChange={handleChange("icon")}
            placeholder="Users"
            disabled={saving}
            className="h-10 w-full rounded-lg border border-[#e3e8ef] px-3 text-[13px] outline-none focus:border-[#1b78ff] focus:ring-1 focus:ring-[#1b78ff]/30 disabled:bg-[#f5f7fa]"
          />
        </div>

      </div>

      {/* ===================================================
          BUTTONS
      =================================================== */}

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
          {saving && (
            <Loader2
              size={14}
              className="animate-spin"
            />
          )}

          {saving
            ? "Saving..."
            : view
            ? "Update View"
            : "Save View"}
        </button>
      </div>
    </form>
  );
}

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

/* =========================================================
   MAIN PAGE
========================================================= */

export default function ViewsPage() {
  /* =======================================================
     STATE
  ======================================================= */

  const [views, setViews] = useState([]);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editing, setEditing] = useState(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     NORMALIZE VIEW
  ======================================================= */

  const normalizeView = (view, index) => {
    return {
      id:
        view?.id ??
        view?.view_id ??
        view?.viewId ??
        `VW-${String(index + 1).padStart(3, "0")}`,

      name:
        view?.name ??
        view?.view_name ??
        view?.viewName ??
        "",

      route:
        view?.route ??
        view?.view_url ??
        view?.url ??
        view?.path ??
        "",

      module_name:
        view?.module_name ??
        view?.module ??
        "",

      icon:
        view?.icon ??
        "",

      // Views in collegeerp don't have status - always Active
      status: "Active",
    };
  };

  /* =======================================================
     FETCH VIEWS
  ======================================================= */

  const fetchViews = async (
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      console.log("================================");
      console.log("FETCHING VIEWS");
      console.log("GET /api/views");

      const response = await authFetch(
        "/api/views"
      );

      console.log(
        "GET /api/views status:",
        response.status
      );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      let data;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      } else {
        const text =
          await response.text();

        throw new Error(
          text ||
            "Server returned an invalid response."
        );
      }

      console.log(
        "Raw Views API response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            data?.sqlMessage ||
            `Failed to fetch views (${response.status})`
        );
      }

      let viewsData = [];

      if (Array.isArray(data)) {
        viewsData = data;
      } else if (
        Array.isArray(data?.views)
      ) {
        viewsData = data.views;
      } else if (
        Array.isArray(data?.data)
      ) {
        viewsData = data.data;
      } else if (
        Array.isArray(data?.result)
      ) {
        viewsData = data.result;
      } else if (
        Array.isArray(data?.rows)
      ) {
        viewsData = data.rows;
      } else {
        console.error(
          "Invalid views response:",
          data
        );

        throw new Error(
          "Invalid views response. Expected a views array."
        );
      }

      const normalizedViews =
        viewsData.map(
          (view, index) =>
            normalizeView(
              view,
              index
            )
        );

      console.log(
        "Processed views:",
        normalizedViews
      );

      console.log(
        "Views count:",
        normalizedViews.length
      );

      setViews(
        normalizedViews
      );

      console.log(
        "Views loaded successfully."
      );

      console.log("================================");

    } catch (err) {
      console.error(
        "FETCH VIEWS ERROR:",
        err
      );

      setViews([]);

      setError(
        err?.message ||
          "Unable to load views. Please check the server."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    fetchViews(true);
  }, []);

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchViews(false);
  };

  /* =======================================================
     SEARCH
  ======================================================= */

  const filtered = useMemo(() => {
    const q =
      search.toLowerCase().trim();

    if (!q) {
      return views;
    }

    return views.filter(
      (view) =>
        Object.values(view)
          .filter(
            (value) =>
              value !== null &&
              value !== undefined
          )
          .join(" ")
          .toLowerCase()
          .includes(q)
    );
  }, [search, views]);

  /* =======================================================
     ADD
  ======================================================= */

  const handleAdd = () => {
    setEditing(null);
    setError("");
    setModalOpen(true);
  };

  /* =======================================================
     EDIT
  ======================================================= */

  const handleEdit = (view) => {
    if (!view) return;

    setEditing(view);
    setError("");
    setModalOpen(true);
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const handleCloseModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditing(null);
  };

  /* =======================================================
     SAVE VIEW
  ======================================================= */

  const handleSave = async (form) => {
    try {
      setSaving(true);
      setError("");

      let response;

      /* ===================================================
         UPDATE
      =================================================== */

      if (editing) {
        console.log("================================");
        console.log("UPDATING VIEW");

        response = await authFetch(
          `/api/views/${encodeURIComponent(
            editing.id
          )}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: form.name,
              route: form.route,
              module_name: form.module_name,
              icon: form.icon,
            }),
          }
        );
      }

      /* ===================================================
         CREATE
      =================================================== */

      else {
        console.log("================================");
        console.log("CREATING VIEW");

        response = await authFetch(
          "/api/views",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: form.name,
              route: form.route,
              module_name: form.module_name,
              icon: form.icon,
            }),
          }
        );
      }

      console.log(
        "Save response status:",
        response.status
      );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      let data;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      } else {
        const text =
          await response.text();

        throw new Error(
          text ||
            "Invalid server response."
        );
      }

      console.log(
        "Save response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            data?.sqlMessage ||
            "Failed to save view."
        );
      }

      /* ===================================================
         REFRESH
      =================================================== */

      await fetchViews(false);

      /* ===================================================
         CLOSE
      =================================================== */

      setModalOpen(false);
      setEditing(null);

      console.log(
        "View saved successfully."
      );

      console.log("================================");

    } catch (err) {
      console.error(
        "SAVE VIEW ERROR:",
        err
      );

      throw new Error(
        err?.message ||
          "Unable to save view."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete = async (view) => {
    if (!view) return;

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${view.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(view.id);

      setError("");

      console.log("================================");
      console.log("DELETING VIEW");

      const response =
        await authFetch(
          `/api/views/${encodeURIComponent(
            view.id
          )}`,
          {
            method: "DELETE",
          }
        );

      console.log(
        "Delete response status:",
        response.status
      );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      let data;

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        data = await response.json();
      } else {
        const text =
          await response.text();

        throw new Error(
          text ||
            "Invalid server response."
        );
      }

      console.log(
        "Delete response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            data?.sqlMessage ||
            "Failed to delete view."
        );
      }

      /* ===================================================
         REFRESH TABLE
      =================================================== */

      await fetchViews(false);

      console.log(
        "View deleted successfully."
      );

      console.log("================================");

    } catch (err) {
      console.error(
        "DELETE VIEW ERROR:",
        err
      );

      alert(
        err?.message ||
          "Unable to delete view."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =======================================================
     STATISTICS
  ======================================================= */

  const totalViews =
    views.length;

  // Get unique modules
  const uniqueModules = useMemo(() => {
    const modules = new Set(views.map((v) => v.module_name).filter(Boolean));
    return modules.size;
  }, [views]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-3">

      {/* ===================================================
          HEADER
      =================================================== */}

      <section className="rounded-lg bg-[#092f6d] px-6 py-5 text-white shadow-soft">
        <div className="flex items-center gap-2 text-[12px] font-bold tracking-[.4px]">
          <Eye size={18} />

          VIEW MANAGEMENT
        </div>

        <p className="mt-2 text-[13px] text-[#b8c9e6]">
          Manage system views — define
          which pages and routes are
          available for role-based access.
        </p>
      </section>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <section className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-start justify-between gap-3">

            <div>
              <p className="text-[13px] font-bold text-red-700">
                Unable to load views
              </p>

              <p className="mt-1 text-[12px] text-red-600">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                fetchViews(true)
              }
              className="rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>

          </div>
        </section>
      )}

      {/* ===================================================
          STAT CARDS
      =================================================== */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">

        <StatCard
          label="TOTAL VIEWS"
          value={totalViews}
          color="blue"
        />

        <StatCard
          label="MODULES"
          value={uniqueModules}
          color="green"
        />

        <StatCard
          label="WITH ICONS"
          value={
            views.filter((v) => v.icon && v.icon.trim()).length
          }
          color="gray"
        />

      </div>

      {/* ===================================================
          TABLE
      =================================================== */}

      <section className="overflow-hidden rounded-lg border border-[#e5eaf1] bg-white shadow-soft">

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="flex flex-col gap-3 border-b border-[#edf0f4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
              ALL VIEWS
            </h3>

            <p className="mt-[2px] text-[11px] text-[#8d9aac]">
              Create and manage system views
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            {/* SEARCH */}

            <div className="flex h-9 items-center gap-1 rounded-lg border border-[#e4e8ef] px-3">

              <Search
                size={14}
                className="text-[#8d9aae]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search views..."
                className="w-[150px] border-0 bg-transparent text-[13px] outline-none placeholder:text-[#a4afbd]"
              />

            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh views"
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

            {/* ADD */}

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

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[750px] border-collapse">

            {/* TABLE HEADER */}

            <thead>
              <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">

                <th className="border-b border-[#edf0f4] px-3 py-3">
                  ID
                </th>

                <th className="border-b border-[#edf0f4] px-3 py-3">
                  Name
                </th>

                <th className="border-b border-[#edf0f4] px-3 py-3">
                  Module
                </th>

                <th className="border-b border-[#edf0f4] px-3 py-3">
                  URL
                </th>

                <th className="border-b border-[#edf0f4] px-3 py-3">
                  Icon
                </th>

                <th className="border-b border-[#edf0f4] px-3 py-3">
                  Actions
                </th>

              </tr>
            </thead>

            {/* TABLE BODY */}

            <tbody>

              {/* LOADING */}

              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-12 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-[13px] text-[#8b98aa]">

                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

                      Loading views...

                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (

                /* EMPTY */

                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-12 text-center text-[13px] text-[#8b98aa]"
                  >
                    {search
                      ? "No views match your search."
                      : "No views found."}
                  </td>
                </tr>

              ) : (

                /* DATA */

                filtered.map(
                  (view) => (
                    <tr
                      key={view.id}
                      className="border-b border-[#f0f2f5] text-[12px] text-[#68778c] transition hover:bg-[#fafcff]"
                    >

                      {/* ID */}

                      <td className="px-3 py-3 font-semibold text-[#4d5e76]">
                        {view.id}
                      </td>

                      {/* NAME */}

                      <td className="px-3 py-3 font-semibold text-[#1d4c86]">
                        {view.name}
                      </td>

                      {/* MODULE */}

                      <td className="px-3 py-3">
                        {view.module_name ? (
                          <span className="inline-flex rounded-md bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#2469c7]">
                            {view.module_name}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* ROUTE */}

                      <td className="px-3 py-3">

                        {view.route ? (
                          <code className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[11px] text-[#64748b]">
                            {view.route}
                          </code>
                        ) : (
                          "—"
                        )}

                      </td>

                      {/* ICON */}

                      <td className="px-3 py-3">
                        {view.icon || "—"}
                      </td>

                      {/* ACTIONS */}

                      <td className="px-3 py-3">

                        <div className="flex items-center gap-1">

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                view
                              )
                            }
                            disabled={
                              deletingId ===
                              view.id
                            }
                            title="Edit"
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#1b78ff] hover:bg-[#eef5ff] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Edit3
                              size={15}
                            />
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                view
                              )
                            }
                            disabled={
                              deletingId ===
                              view.id
                            }
                            title="Delete"
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#e05252] hover:bg-[#fff0f0] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deletingId ===
                            view.id ? (
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

                        </div>

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>
      </section>

      {/* ===================================================
          MODAL
      =================================================== */}

      <Modal
        open={modalOpen}
        onClose={
          handleCloseModal
        }
        title={
          editing
            ? "Edit View"
            : "Add New View"
        }
      >

        <ViewForm
          view={editing}
          onSave={handleSave}
          onCancel={
            handleCloseModal
          }
          saving={saving}
        />

      </Modal>

    </div>
  );
}
