import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Search,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Filter,
  X,
} from "lucide-react";
import { authFetch } from "../authFetch";

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ label, value, color = "blue" }) {
  const colorMap = {
    blue: "text-[#2469c7]",
    green: "text-[#36a66e]",
    red: "text-[#e05252]",
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
   ACTION BADGE
========================================================= */

function ActionBadge({ action }) {
  const styles = {
    CREATE: "bg-[#eaf8f2] text-[#27885e]",
    UPDATE: "bg-[#eef5ff] text-[#2469c7]",
    DELETE: "bg-[#fff0f0] text-[#e05252]",
  };

  const icons = {
    CREATE: Plus,
    UPDATE: Pencil,
    DELETE: Trash2,
  };

  const Icon = icons[action] || Activity;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${styles[action] || styles.UPDATE}`}
    >
      <Icon size={12} />
      {action}
    </span>
  );
}

/* =========================================================
   TABLE BADGE (for module)
========================================================= */

function TableBadge({ tableName }) {
  const labels = {
    users: "Users",
    roles: "Roles",
    views: "Views",
    role_permissions: "Permissions",
  };

  return (
    <span className="inline-flex rounded-md bg-[#f1f5f9] px-2 py-1 text-[11px] font-semibold text-[#51627c]">
      {labels[tableName] || tableName}
    </span>
  );
}

/* =========================================================
   TIME AGO
========================================================= */

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterTable, setFilterTable] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 30;

  /* =========================================================
     FETCH LOGS
  ========================================================= */

  const fetchLogs = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(limit),
      });

      if (filterAction) params.set("action", filterAction);
      if (filterTable) params.set("table_name", filterTable);
      if (search) params.set("search", search);

      const res = await authFetch(`/api/audit-logs?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Failed to load logs");

      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch (err) {
      console.error("FETCH LOGS ERROR:", err);
      setLogs([]);
      setError(err.message || "Unable to load activity logs.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FETCH STATS
  ========================================================= */

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await authFetch("/api/audit-logs/stats");
      const data = await res.json();
      if (res.ok && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("FETCH STATS ERROR:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    fetchLogs(1);
    fetchStats();
  }, []);

  /* =========================================================
     SEARCH / FILTER
  ========================================================= */

  const handleSearch = () => {
    fetchLogs(1);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  useEffect(() => {
    fetchLogs(1);
  }, [filterAction, filterTable]);

  const clearFilters = () => {
    setSearch("");
    setFilterAction("");
    setFilterTable("");
    setPage(1);
  };

  const hasFilters = search || filterAction || filterTable;

  /* =========================================================
     PAGINATION
  ========================================================= */

  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchLogs(newPage);
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="space-y-3">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="rounded-lg bg-[#092f6d] px-6 py-5 text-white shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-bold tracking-[.4px]">
              <Activity size={18} />
              ACTIVITY LOG
            </div>

            <p className="mt-2 text-[13px] text-[#b8c9e6]">
              Complete audit trail of all system changes — who did what and when.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchLogs(page);
              fetchStats();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-[#e3e8ef] bg-white px-3 py-2 text-[11px] font-semibold text-[#51627c] hover:bg-[#f8fafc]"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </section>

      {/* ======================================================
          STATS
      ====================================================== */}

      {!statsLoading && stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="TOTAL LOGS" value={stats.total} color="blue" />
          <StatCard label="TODAY" value={stats.todayCount} color="green" />
          <StatCard
            label="CREATES"
            value={stats.byAction?.CREATE || 0}
            color="green"
          />
          <StatCard
            label="DELETES"
            value={stats.byAction?.DELETE || 0}
            color="red"
          />
        </div>
      )}

      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="flex h-9 items-center gap-1 rounded-lg border border-[#e4e8ef] px-3">
            <Search size={14} className="text-[#8d9aae]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search activity..."
              className="w-[180px] border-0 bg-transparent text-[13px] outline-none placeholder:text-[#a4afbd]"
            />
          </div>

          {/* Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-semibold transition ${
              showFilters || hasFilters
                ? "border-[#1b78ff] bg-[#eef5ff] text-[#1b78ff]"
                : "border-[#e4e8ef] bg-white text-[#51627c] hover:bg-slate-50"
            }`}
          >
            <Filter size={14} />
            Filters
            {hasFilters && (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-[#1b78ff] text-[9px] text-white">
                !
              </span>
            )}
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex h-9 items-center gap-1 text-[11px] font-semibold text-[#e05252] hover:underline"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>

        <span className="text-[11px] text-[#8b98aa]">
          {total} total entries
        </span>
      </div>

      {/* ======================================================
          FILTERS PANEL
      ====================================================== */}

      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-lg border border-[#e5eaf1] bg-white px-4 py-3">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-[#8c99ab]">
              Action
            </label>
            <select
              value={filterAction}
              onChange={handleFilterChange(setFilterAction)}
              className="h-8 rounded-lg border border-[#e3e8ef] bg-white px-2 text-[12px] outline-none focus:border-[#1b78ff]"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-[#8c99ab]">
              Module
            </label>
            <select
              value={filterTable}
              onChange={handleFilterChange(setFilterTable)}
              className="h-8 rounded-lg border border-[#e3e8ef] bg-white px-2 text-[12px] outline-none focus:border-[#1b78ff]"
            >
              <option value="">All Modules</option>
              <option value="users">Users</option>
              <option value="roles">Roles</option>
              <option value="views">Views</option>
              <option value="role_permissions">Permissions</option>
            </select>
          </div>
        </div>
      )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-[#f5c2c2] bg-[#fff5f5] px-4 py-3">
          <span className="text-[12px] text-[#e05252]">{error}</span>
          <button
            type="button"
            onClick={() => fetchLogs(page)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#1b78ff]"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* ======================================================
          TABLE
      ====================================================== */}

      <section className="overflow-hidden rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex items-center gap-2 text-[13px] text-[#8b98aa]">
              <Loader2 size={18} className="animate-spin" />
              Loading activity logs...
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center text-[13px] text-[#8b98aa]">
            {hasFilters ? "No logs match your filters." : "No activity logs found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                  <th className="border-b border-[#edf0f4] px-3 py-3">Time</th>
                  <th className="border-b border-[#edf0f4] px-3 py-3">User</th>
                  <th className="border-b border-[#edf0f4] px-3 py-3">Action</th>
                  <th className="border-b border-[#edf0f4] px-3 py-3">Module</th>
                  <th className="border-b border-[#edf0f4] px-3 py-3">Description</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-[#f0f2f5] text-[12px] text-[#68778c] hover:bg-[#fafcff]"
                  >
                    {/* Time */}
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="text-[#344c69]">
                        {timeAgo(log.created_at)}
                      </div>
                      <div className="text-[10px] text-[#9aa7b6]">
                        {new Date(log.created_at).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    {/* User */}
                    <td className="px-3 py-3">
                      <div className="font-medium text-[#344c69]">
                        {log.user_email || "System"}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-3 py-3">
                      <ActionBadge action={log.action} />
                    </td>

                    {/* Module */}
                    <td className="px-3 py-3">
                      <TableBadge tableName={log.table_name} />
                    </td>

                    {/* Description */}
                    <td className="max-w-[300px] px-3 py-3 text-[#51627c]">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ======================================================
            PAGINATION
        ====================================================== */}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#edf0f4] px-4 py-3">
            <span className="text-[11px] text-[#8b98aa]">
              Page {page} of {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#e4e8ef] bg-white text-[#51627c] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => goToPage(pageNum)}
                    className={`grid h-8 w-8 place-items-center rounded-lg text-[12px] font-semibold transition ${
                      pageNum === page
                        ? "bg-[#1b78ff] text-white"
                        : "border border-[#e4e8ef] bg-white text-[#51627c] hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#e4e8ef] bg-white text-[#51627c] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
