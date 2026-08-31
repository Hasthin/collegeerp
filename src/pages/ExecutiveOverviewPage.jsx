import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  ShieldCheck,
  Layers3,
  Eye,
  KeyRound,
  ArrowUpRight,
  RefreshCw,
  Activity,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { authFetch } from "../authFetch";

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
   SECTION HEADER
========================================================= */

function SectionHeader({ title, description }) {
  return (
    <div className="border-b border-[#edf0f4] px-4 py-3">
      <h3 className="text-[13px] font-bold tracking-[.35px] text-[#1d4c86]">
        {title}
      </h3>

      <p className="mt-[2px] text-[11px] text-[#8d9aac]">{description}</p>
    </div>
  );
}

/* =========================================================
   SAFE ARRAY NORMALIZER
========================================================= */

function normalizeArray(data, keys = []) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.data?.items)) {
    return data.data.items;
  }

  if (Array.isArray(data?.result)) {
    return data.result;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

/* =========================================================
   ACTIVE CHECK
========================================================= */

function isActiveRecord(item) {
  if (!item) {
    return false;
  }

  const status = String(item.status || "")
    .trim()
    .toLowerCase();

  return (
    status === "active" ||
    status === "enabled" ||
    status === "1" ||
    item.is_active === 1 ||
    item.is_active === true ||
    item.active === 1 ||
    item.active === true ||
    item.enabled === 1 ||
    item.enabled === true
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function ExecutiveOverviewPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [views, setViews] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     SAFE JSON FETCH
  ======================================================= */

  const fetchJSON = async (url) => {
    const response = await authFetch(url);

    const text = await response.text();

    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch (err) {
      console.error(`Invalid JSON from ${url}:`, text);

      throw new Error(
        `${url} did not return valid JSON. Please check the backend route.`,
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          `Request failed with status ${response.status}`,
      );
    }

    return data;
  };

  /* =======================================================
     LOAD USERS
  ======================================================= */

  const loadUsers = async () => {
    const data = await fetchJSON("/api/users");
    return normalizeArray(data, ["users", "data", "results", "items"]);
  };

  /* =======================================================
     LOAD ROLES
  ======================================================= */

  const loadRoles = async () => {
    const data = await fetchJSON("/api/roles");
    return normalizeArray(data, ["roles", "data", "results", "items"]);
  };

  /* =======================================================
     LOAD VIEWS
  ======================================================= */

  const loadViews = async () => {
    const data = await fetchJSON("/api/views");
    return normalizeArray(data, ["views", "data", "results", "items"]);
  };

  /* =======================================================
     LOAD PERMISSIONS (role_permissions matrix)
  ======================================================= */

  const loadPermissions = async () => {
    const data = await fetchJSON("/api/role-permissions/matrix");
    return normalizeArray(data, ["matrix", "permissions", "data", "results", "items"]);
  };

  /* =======================================================
     LOAD RECENT ACTIVITY
  ======================================================= */

  const loadRecentLogs = async () => {
    try {
      const data = await fetchJSON("/api/audit-logs/recent");
      setRecentLogs(normalizeArray(data, ["logs", "data", "results", "items"]));
    } catch (err) {
      console.error("Error loading recent logs:", err);
      setRecentLogs([]);
    }
  };

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const [usersData, rolesData, viewsData, permissionsData] =
        await Promise.all([
          loadUsers(),
          loadRoles(),
          loadViews(),
          loadPermissions(),
        ]);

      setUsers(usersData);
      setRoles(rolesData);
      setViews(viewsData);
      setPermissions(permissionsData);

      // Load recent activity (non-blocking)
      loadRecentLogs();

      console.log("=================================");
      console.log("DASHBOARD DATA");
      console.log("Users:", usersData);
      console.log("Roles:", rolesData);
      console.log("Views:", viewsData);
      console.log("Permissions:", permissionsData);
      console.log("=================================");
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(err.message || "Unable to load dashboard data.");

      setUsers([]);
      setRoles([]);
      setViews([]);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =======================================================
     DERIVE MODULES FROM VIEWS
  ======================================================= */

  const modules = useMemo(() => {
    const moduleMap = {};

    views.forEach((view) => {
      const moduleName =
        view.module_name ?? view.module ?? "Uncategorized";

      if (!moduleMap[moduleName]) {
        moduleMap[moduleName] = {
          name: moduleName,
          viewCount: 0,
        };
      }

      moduleMap[moduleName].viewCount++;
    });

    return Object.values(moduleMap).sort(
      (a, b) => b.viewCount - a.viewCount
    );
  }, [views]);

  /* =======================================================
     ACTIVE COUNTS
  ======================================================= */

  const activeUsers = useMemo(() => {
    return users.filter(isActiveRecord).length;
  }, [users]);

  const activeRoles = useMemo(() => {
    return roles.length; // Roles in collegeerp are always active
  }, [roles]);

  const activeViews = useMemo(() => {
    return views.length; // Views in collegeerp are always active
  }, [views]);

  /* =======================================================
     PERMISSION SUMMARY (by module)
  ======================================================= */

  const permissionSummary = useMemo(() => {
    const grouped = {};

    permissions.forEach((perm) => {
      const moduleName = String(
        perm.module_name ?? perm.module ?? "Other",
      ).trim();

      const finalName = moduleName || "Other";

      if (!grouped[finalName]) {
        grouped[finalName] = 0;
      }

      grouped[finalName]++;
    });

    return Object.entries(grouped)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [permissions]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-[13px] text-[#68778c]">
          <RefreshCw size={17} className="animate-spin" />
          Loading Super Admin Dashboard...
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="space-y-3">
        {/* Header */}
        <section className="rounded-lg bg-[#092f6d] px-6 py-5 text-white shadow-soft">
          <div className="flex items-center gap-2 text-[12px] font-bold tracking-[.4px]">
            <span className="h-2 w-2 rounded-full bg-[#75a8ff]" />
            SUPER ADMIN
          </div>

          <h2 className="mt-2 text-[22px] font-bold">SYSTEM OVERVIEW</h2>

          <p className="mt-1 text-[13px] text-[#b8c9e6]">
            Manage users, roles, views and permissions from a
            centralized administration dashboard.
          </p>
        </section>

        {/* Error */}
        <section className="rounded-lg border border-[#ffd6d6] bg-[#fff7f7] px-5 py-4">
          <div className="flex items-start gap-3">
            <Activity size={20} className="mt-0.5 shrink-0 text-[#e05252]" />

            <div className="flex-1">
              <h3 className="text-[14px] font-bold text-[#b83b3b]">
                Unable to load dashboard
              </h3>

              <p className="mt-1 text-[12px] text-[#8b5b5b]">{error}</p>

              <p className="mt-2 text-[11px] text-[#a46d6d]">
                Please check that all required backend routes are available:
                <br />
                /api/users, /api/roles, /api/views and
                /api/role-permissions/matrix
              </p>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              className="flex items-center gap-1.5 rounded-lg bg-[#1b78ff] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#1560e0]"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </section>
      </div>
    );
  }

  /* =======================================================
     DASHBOARD
  ======================================================= */

  return (
    <div className="space-y-3">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="rounded-lg bg-[#092f6d] px-6 py-5 text-white shadow-soft flex justify-between">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-bold tracking-[.4px]">
            <span className="h-2 w-2 rounded-full bg-[#75a8ff]" />
            SUPER ADMIN
          </div>

          <h2 className="mt-2 text-[22px] font-bold">SYSTEM OVERVIEW</h2>

          <p className="mt-1 text-[13px] text-[#b8c9e6]">
            Manage users, roles, views and permissions from a
            centralized administration dashboard.
          </p>
        </div>

        <div>
          <div className="flex justify-end ">
            <button
              type="button"
              onClick={loadDashboard}
              className="flex items-center gap-1.5 rounded-lg border border-[#e3e8ef] bg-white px-3 py-2 text-[11px] font-semibold text-[#51627c] hover:bg-[#f8fafc]"
            >
              <RefreshCw size={13} />
              Refresh Dashboard
            </button>
          </div>
        </div>
        
      </section>

      {/* =====================================================
          STAT CARDS
      ====================================================== */}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="TOTAL USERS"
          value={users.length}
          description={`${activeUsers} active users`}
          iconClass="bg-[#eef5ff] text-[#2469c7]"
        />

        <StatCard
          icon={ShieldCheck}
          label="TOTAL ROLES"
          value={roles.length}
          description={`${activeRoles} active roles`}
          iconClass="bg-[#eaf8f2] text-[#36a66e]"
        />

        <StatCard
          icon={Layers3}
          label="MODULES"
          value={modules.length}
          description="Derived from views"
          iconClass="bg-[#fff4e8] text-[#e58a27]"
        />

        <StatCard
          icon={Eye}
          label="TOTAL VIEWS"
          value={views.length}
          description={`${activeViews} active views`}
          iconClass="bg-[#f2edff] text-[#7654c7]"
        />
      </section>

      {/* =====================================================
          SYSTEM SUMMARY
      ====================================================== */}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.5fr_1fr]">
        {/* ===================================================
            MODULES
        ==================================================== */}

        <section className="overflow-hidden rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
          <SectionHeader
            title="SYSTEM MODULES"
            description="Modules derived from views.module_name"
          />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[550px] border-collapse">
              <thead>
                <tr className="bg-[#fafbfd] text-left text-[11px] font-bold uppercase text-[#8c99ab]">
                  <th className="border-b border-[#edf0f4] px-4 py-3">
                    MODULE
                  </th>

                  <th className="border-b border-[#edf0f4] px-4 py-3">VIEWS</th>
                </tr>
              </thead>

              <tbody>
                {modules.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-8 text-center text-[12px] text-[#8b98aa]"
                    >
                      No modules found.
                    </td>
                  </tr>
                ) : (
                  modules.slice(0, 8).map((module, index) => {
                    return (
                      <tr
                        key={module.name ?? index}
                        className="border-b border-[#f0f2f5] text-[12px] hover:bg-[#fafcff]"
                      >
                        {/* Module */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#1d4c86]">
                            {module.name}
                          </div>
                        </td>

                        {/* Views */}
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#2469c7]">
                            {module.viewCount}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===================================================
            QUICK SUMMARY
        ==================================================== */}

        <section className="rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
          <SectionHeader
            title="ACCESS CONTROL SUMMARY"
            description="Current RBAC configuration"
          />

          <div className="divide-y divide-[#f0f2f5]">
            <SummaryRow
              icon={Users}
              title="Users"
              value={users.length}
              description="System users"
            />

            <SummaryRow
              icon={ShieldCheck}
              title="Roles"
              value={roles.length}
              description="Configured roles"
            />

            <SummaryRow
              icon={Layers3}
              title="Modules"
              value={modules.length}
              description="System modules"
            />

            <SummaryRow
              icon={Eye}
              title="Views"
              value={views.length}
              description="Application views"
            />

            <SummaryRow
              icon={KeyRound}
              title="Permissions"
              value={permissions.length}
              description="Access permissions"
            />
          </div>
        </section>
      </div>

      {/* =====================================================
          PERMISSIONS BY MODULE
      ====================================================== */}

      <section className="rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        <SectionHeader
          title="PERMISSIONS BY MODULE"
          description="Distribution of configured permissions"
        />

        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {permissionSummary.length === 0 ? (
            <div className="col-span-full py-8 text-center text-[12px] text-[#8b98aa]">
              No permissions found.
            </div>
          ) : (
            permissionSummary.map((item) => {
              const percentage =
                permissions.length > 0
                  ? Math.min(100, (item.count / permissions.length) * 100)
                  : 0;

              return (
                <div
                  key={item.name}
                  className="rounded-lg border border-[#edf0f4] bg-[#fafbfd] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-[#344c69]">
                        {item.name}
                      </p>

                      <p className="mt-1 text-[11px] text-[#9aa7b6]">
                        Permissions
                      </p>
                    </div>

                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eef5ff] text-[12px] font-bold text-[#2469c7]">
                      {item.count}
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e9eef5]">
                    <div
                      className="h-full rounded-full bg-[#1b78ff]"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-right text-[10px] text-[#9aa7b6]">
                    {percentage.toFixed(0)}%
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* =====================================================
          RECENT ACTIVITY
      ====================================================== */}

      <section className="rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        <SectionHeader
          title="RECENT ACTIVITY"
          description="Last 10 system changes"
        />

        {recentLogs.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-[#8b98aa]">
            No activity recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-[#f0f2f5]">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                    log.action === "CREATE"
                      ? "bg-[#eaf8f2] text-[#36a66e]"
                      : log.action === "DELETE"
                        ? "bg-[#fff0f0] text-[#e05252]"
                        : "bg-[#eef5ff] text-[#2469c7]"
                  }`}
                >
                  {log.action === "CREATE" ? (
                    <Plus size={14} />
                  ) : log.action === "DELETE" ? (
                    <Trash2 size={14} />
                  ) : (
                    <Pencil size={14} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] text-[#344c69]">
                    {log.description}
                  </p>
                  <p className="text-[10px] text-[#9aa7b6]">
                    {log.user_email || "System"} · {timeAgo(log.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {recentLogs.length > 0 && (
          <div className="border-t border-[#edf0f4] px-4 py-3">
            <a
              href="/activity-log"
              className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#1b78ff] hover:underline"
            >
              View All Activity
              <ArrowUpRight size={12} />
            </a>
          </div>
        )}
      </section>

      {/* =====================================================
          QUICK ACTIONS
      ====================================================== */}

      <section className="rounded-lg border border-[#e5eaf1] bg-white shadow-soft">
        <SectionHeader
          title="ADMINISTRATION"
          description="Manage system access configuration"
        />

        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            icon={Users}
            title="Manage Users"
            description="Create and manage users"
            href="/users"
          />

          <QuickAction
            icon={ShieldCheck}
            title="Manage Roles"
            description="Configure system roles"
            href="/roles"
          />

          <QuickAction
            icon={Eye}
            title="Manage Views"
            description="Configure application views"
            href="/views"
          />

          <QuickAction
            icon={KeyRound}
            title="Manage Permissions"
            description="Configure role-permission matrix"
            href="/permissions"
          />
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({ icon: Icon, title, value, description }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eef5ff] text-[#2469c7]">
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <strong className="block text-[12px] text-[#344c69]">{title}</strong>

        <span className="text-[11px] text-[#9aa7b6]">{description}</span>
      </div>

      <strong className="text-[18px] font-bold text-[#1d4c86]">{value}</strong>
    </div>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({ icon: Icon, title, description, href }) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 rounded-lg border border-[#e7ebf1] bg-[#fafbfd] p-3 transition hover:border-[#cbdcf5] hover:bg-[#f7faff]"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eef5ff] text-[#2469c7]">
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <strong className="block text-[12px] font-semibold text-[#344c69]">
          {title}
        </strong>

        <p className="mt-0.5 text-[11px] text-[#9aa7b6]">{description}</p>
      </div>

      <ArrowUpRight
        size={15}
        className="text-[#9aa7b6] transition group-hover:text-[#1b78ff]"
      />
    </a>
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
  });
}
