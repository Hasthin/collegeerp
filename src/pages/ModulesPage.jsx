import React, { useEffect, useMemo, useState } from "react";
import {
  FolderOpen,
  Search,
  RefreshCw,
  Loader2,
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
   MAIN MODULE PAGE (READ-ONLY - derived from views.module_name)
========================================================= */

export default function ModulesPage() {
  const [views, setViews] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /* ==========================================================
     FETCH VIEWS (to derive modules)
  ========================================================== */

  const fetchModules = async (
    showLoader = true
  ) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      console.log(
        "Fetching modules (from views)..."
      );

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
        "Views API response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
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
      }

      setViews(viewsData);

    } catch (err) {
      console.error(
        "FETCH MODULES ERROR:",
        err
      );

      setViews([]);

      setError(
        err?.message ||
          "Unable to load modules. Please check the server."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    fetchModules(true);
  }, []);

  /* ==========================================================
     REFRESH
  ========================================================== */

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchModules(false);
  };

  /* ==========================================================
     DERIVE MODULES FROM VIEWS
  ========================================================== */

  const modules = useMemo(() => {
    const moduleMap = {};

    views.forEach((view) => {
      const moduleName =
        view.module_name ??
        view.module ??
        "Uncategorized";

      if (!moduleMap[moduleName]) {
        moduleMap[moduleName] = {
          name: moduleName,
          viewCount: 0,
          views: [],
        };
      }

      moduleMap[moduleName].viewCount++;

      moduleMap[moduleName].views.push(
        view.view_name ?? view.name ?? ""
      );
    });

    return Object.values(moduleMap).sort(
      (a, b) => b.viewCount - a.viewCount
    );
  }, [views]);

  /* ==========================================================
     SEARCH
  ========================================================== */

  const filtered = useMemo(() => {
    const q =
      search.toLowerCase().trim();

    if (!q) {
      return modules;
    }

    return modules.filter(
      (module) =>
        module.name
          .toLowerCase()
          .includes(q)
    );
  }, [search, modules]);

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="space-y-3">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="rounded-lg bg-[#092f6d] px-6 py-5 text-white shadow-soft">
        <div className="flex items-center gap-2 text-[12px] font-bold tracking-[.4px]">
          <FolderOpen size={18} />

          MODULE MANAGEMENT
        </div>

        <h2 className="mt-2 text-[20px] font-bold">
          SYSTEM MODULES
        </h2>

        <p className="mt-1 text-[13px] text-[#b8c9e6]">
          Modules are automatically derived from Views.
          Each unique module_name in the views table becomes a module.
        </p>
      </section>

      {/* ======================================================
          INFO BANNER
      ====================================================== */}

      <div className="flex items-start gap-3 rounded-lg border border-[#d4e4ff] bg-[#f0f7ff] px-4 py-3">
        <Info size={18} className="mt-0.5 shrink-0 text-[#1b78ff]" />

        <div>
          <p className="text-[12px] font-semibold text-[#1d4c86]">
            Virtual Modules
          </p>

          <p className="mt-0.5 text-[11px] text-[#51627c]">
            Modules are not stored separately. They are derived from the
            <code className="mx-1 rounded bg-[#eef5ff] px-1 py-0.5 text-[10px] font-semibold text-[#2469c7]">
              module_name
            </code>
            column in the Views table. To create a new module, add a View
            with a new module_name value.
          </p>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div>
            <strong className="block text-[12px] font-semibold text-red-600">
              Unable to load modules
            </strong>

            <span className="text-[11px] text-red-500">
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              fetchModules(true)
            }
            className="flex items-center gap-1 text-[11px] font-semibold text-[#1b78ff] hover:underline"
          >
            <RefreshCw size={13} />

            Retry
          </button>
        </div>
      )}

      {/* ======================================================
          STATS
      ====================================================== */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="TOTAL MODULES"
          value={modules.length}
          color="blue"
        />

        <StatCard
          label="TOTAL VIEWS"
          value={views.length}
          color="green"
        />

        <StatCard
          label="AVG VIEWS PER MODULE"
          value={
            modules.length > 0
              ? (views.length / modules.length).toFixed(1)
              : "0"
          }
          color="gray"
        />
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <section className="overflow-hidden rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-[#edf0f4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
              ALL MODULES
            </h3>

            <p className="mt-[2px] text-[11px] text-[#8d9aac]">
              Derived from views.module_name
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
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search modules..."
                className="w-[150px] border-0 bg-transparent text-[13px] outline-none placeholder:text-[#a4afbd]"
              />
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={refreshing}
              title="Refresh modules"
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
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <div className="flex items-center gap-2 text-[13px] text-[#8b98aa]">
              <Loader2
                size={18}
                className="animate-spin"
              />

              Loading modules...
            </div>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] border-collapse">
              <thead>
                <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                  <th className="border-b border-[#edf0f4] px-3 py-3">
                    Module Name
                  </th>

                  <th className="border-b border-[#edf0f4] px-3 py-3">
                    Views Count
                  </th>

                  <th className="border-b border-[#edf0f4] px-3 py-3">
                    Views
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-12 text-center text-[13px] text-[#8b98aa]"
                    >
                      {search
                        ? "No modules match your search."
                        : "No modules found. Add Views with module_name values to create modules."}
                    </td>
                  </tr>
                ) : (
                  filtered.map(
                    (module) => (
                      <tr
                        key={
                          module.name
                        }
                        className="border-b border-[#f0f2f5] text-[12px] text-[#68778c] transition hover:bg-[#fafcff]"
                      >
                        {/* Module Name */}
                        <td className="px-3 py-3 font-semibold text-[#1d4c86]">
                          <span className="inline-flex rounded-md bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#2469c7]">
                            {
                              module.name
                            }
                          </span>
                        </td>

                        {/* View Count */}
                        <td className="px-3 py-3">
                          <span className="rounded-md bg-[#eaf8f2] px-2 py-1 text-[11px] font-semibold text-[#27885e]">
                            {
                              module.viewCount
                            }{" "}
                            {
                              module.viewCount === 1
                                ? "view"
                                : "views"
                            }
                          </span>
                        </td>

                        {/* Views */}
                        <td className="px-3 py-3 text-[#68778c]">
                          {module.views
                            .slice(0, 3)
                            .join(", ")}
                          {module.views.length > 3 && (
                            <span className="text-[#8b98aa]">
                              {" "}
                              +{module.views.length - 3} more
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
