import React, { useEffect, useState } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Activity,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Eye,
  FolderOpen,
  GraduationCap,
  Heart,
  Key,
  LogOut,
  Menu,
  Shield,
  Stethoscope,
  AlertTriangle,
  UserCircle,
  Users,
  X,
} from "lucide-react";

// ==========================================
// PAGES
// ==========================================

import ExecutiveOverviewPage from "./pages/ExecutiveOverviewPage";
import UsersPage from "./pages/UsersPage";
import RolesPage from "./pages/RolesPage";
import PermissionsPage from "./pages/PermissionsPage";
import ViewsPage from "./pages/ViewsPage";
import ModulesPage from "./pages/ModulesPage";
import ActivityLogPage from "./pages/ActivityLogPage";
import CoursesPage from "./pages/CoursesPage";
import FacultyPage from "./pages/FacultyPage";
import StudentsPage from "./pages/StudentsPage";
import FeesPage from "./pages/FeesPage";
import LoginPage from "./pages/LoginPage";

import {
  ExecutiveOverviewPage as DeanOverviewPage,
  ClassroomAttendancePage,
  ClinicalPostingReportPage,
  BunkingAnalyticsPage,
  StudentWelfarePage,
} from "./dean-hod";

// ==========================================
// NAVIGATION
// ==========================================

const navigation = [
  {
    label: "Executive Overview",
    path: "/",
    icon: Activity,
  },
  {
    label: "Users",
    path: "/users",
    icon: UserCircle,
  },
  {
    label: "Roles",
    path: "/roles",
    icon: Shield,
  },
  {
    label: "Modules",
    path: "/modules",
    icon: FolderOpen,
  },
  {
    label: "Views",
    path: "/views",
    icon: Eye,
  },
  {
    label: "Permissions",
    path: "/permissions",
    icon: Key,
  },
  {
    label: "Activity Log",
    path: "/activity-log",
    icon: Activity,
  },
  {
    label: "Courses & Branches",
    path: "/courses",
    icon: BookOpen,
  },
  {
    label: "Faculty",
    path: "/faculty",
    icon: Users,
  },
  {
    label: "Students",
    path: "/students",
    icon: GraduationCap,
  },
  {
    label: "Fees",
    path: "/fees",
    icon: CreditCard,
  },
];

const deanHodNavigation = [
  {
    label: "Dean Overview",
    path: "/dean-hod",
    icon: GraduationCap,
  },
  {
    label: "Classroom Attendance",
    path: "/dean-hod/classroom-attendance",
    icon: ClipboardCheck,
  },
  {
    label: "Clinical Posting",
    path: "/dean-hod/clinical-posting",
    icon: Stethoscope,
  },
  {
    label: "Bunking Analytics",
    path: "/dean-hod/bunking-analytics",
    icon: AlertTriangle,
  },
  {
    label: "Student Welfare",
    path: "/dean-hod/student-welfare",
    icon: Heart,
  },
];

// ==========================================
// SIDEBAR
// ==========================================

function Sidebar({ open, onClose, user, onLogout }) {
  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col",
          "bg-gradient-to-b from-[#071c46] to-[#06204d] text-[#d8e2f5]",
          "transition-transform duration-200",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[#0a2a5b]">
            <BookOpen size={22} strokeWidth={1.9} />
          </div>

          <div>
            <div className="text-[14px] font-bold leading-[1.15] text-white">
              Medico
            </div>

            <div className="text-[14px] font-bold leading-[1.15] text-white">
              University
            </div>

            <div className="mt-[3px] text-[11px] text-[#9fb1d1]">
              Super Admin Panel
            </div>
          </div>

          {/* Mobile close */}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto grid h-8 w-8 place-items-center rounded-md text-white/70 hover:bg-white/10 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-[4px] px-3 py-4">
          <div className="mb-1 px-2 text-[10px] font-bold tracking-[1px] text-[#7f98bf]">
            ADMINISTRATION
          </div>

          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  "flex h-10 items-center gap-2 rounded-lg px-3 text-[13px]",
                  "transition-colors",
                  isActive
                    ? "bg-[#1b78ff] text-white shadow-[0_3px_9px_rgba(27,120,255,.25)]"
                    : "text-[#d4def1] hover:bg-white/[0.08]",
                ].join(" ")
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}

          {hasDeanHodAccess(user) && (
            <>
              <div className="mb-1 mt-3 px-2 text-[10px] font-bold tracking-[1px] text-[#7f98bf]">
                DEAN / HOD
              </div>

              {deanHodNavigation.map(({ label, path, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === "/dean-hod"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    [
                      "flex h-10 items-center gap-2 rounded-lg px-3 text-[13px]",
                      "transition-colors",
                      isActive
                        ? "bg-[#1b78ff] text-white shadow-[0_3px_9px_rgba(27,120,255,.25)]"
                        : "text-[#d4def1] hover:bg-white/[0.08]",
                    ].join(" ")
                  }
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User / Logout */}
        <div className="border-t border-white/10 px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-[12px] font-bold text-[#0b2b63]">
              {getInitials(user)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold text-white">
                {user?.full_name ||
                  user?.username ||
                  user?.name ||
                  "Super Admin"}
              </div>

              <div className="mt-[2px] text-[10px] text-[#9fb1d1]">
                {getUserRole(user)}
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Logout"
              className="grid h-8 w-8 place-items-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ==========================================
// HEADER
// ==========================================

function Header({ onMenu, user }) {
  const location = useLocation();

  const current =
    navigation.find((item) => item.path === location.pathname) ||
    navigation[0];

  const fullName =
    user?.full_name ||
    user?.username ||
    user?.name ||
    "Super Admin";

  const initials = getInitials(user);

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "long",
  });

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-[#e7ebf2] bg-white px-5">
      {/* Mobile Menu */}
      <button
        type="button"
        onClick={onMenu}
        className="grid h-9 w-9 place-items-center rounded-md text-[#183258] hover:bg-slate-100 lg:hidden"
      >
        <Menu size={22} />
      </button>

      {/* Page Title */}
      <div>
        <h1 className="m-0 text-[16px] font-bold tracking-[.2px] text-[#1a345c]">
          Super Admin Panel
        </h1>

        <p className="mt-[3px] text-[12px] text-[#91a0b5]">
          {current.label} · Manage and monitor academic activities
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Date */}
        <button
          type="button"
          className="hidden h-9 items-center gap-[6px] rounded-lg border border-[#e3e8ef] bg-white px-3 text-[12px] text-[#51627c] sm:flex"
        >
          <CalendarDays size={14} />
          <span>{formattedDate}</span>
        </button>

        {/* Notification */}
        <button
          type="button"
          className="relative grid h-9 w-9 place-items-center rounded-lg border border-[#e3e8ef] bg-white text-[#51627c] hover:bg-slate-50"
          title="Notifications"
        >
          <Bell size={16} />

          <span className="absolute right-[6px] top-[6px] h-[6px] w-[6px] rounded-full bg-[#1b78ff]" />
        </button>

        {/* Profile */}
        <div className="hidden items-center gap-2 sm:flex">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#eef4ff] text-[12px] font-bold text-[#1768dc]">
            {initials}
          </div>

          <div className="hidden md:block">
            <p className="text-[12px] font-semibold text-[#1a345c]">
              {fullName}
            </p>

            <p className="text-[10px] text-[#8b98aa]">
              {getUserRole(user)}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

// ==========================================
// AUTH PROTECTED ROUTE
// ==========================================

function ProtectedRoutes({ user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // User login nahi hai
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const deanHodAllowed = hasDeanHodAccess(user);

  return (
    <div className="min-h-screen bg-[#f7f9fc] font-inter">
      <Sidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        onLogout={onLogout}
      />

      <div className="min-h-screen lg:ml-[240px]">
        <Header
          onMenu={() => setMobileOpen(true)}
          user={user}
        />

        <main className="mx-auto max-w-[1200px] px-4 py-4 sm:px-5 sm:py-5">
          <Routes>
            {/* Dashboard */}
            <Route
              path="/"
              element={<ExecutiveOverviewPage />}
            />

            {/* Users */}
            <Route
              path="/users"
              element={<UsersPage />}
            />

            {/* Roles */}
            <Route
              path="/roles"
              element={<RolesPage />}
            />

            {/* Modules */}
            <Route
              path="/modules"
              element={<ModulesPage />}
            />

            {/* Views */}
            <Route
              path="/views"
              element={<ViewsPage />}
            />

            {/* Permissions */}
            <Route
              path="/permissions"
              element={<PermissionsPage />}
            />

            {/* Activity Log */}
            <Route
              path="/activity-log"
              element={<ActivityLogPage />}
            />

            {/* Courses & Branches */}
            <Route
              path="/courses"
              element={<CoursesPage />}
            />

            {/* Faculty */}
            <Route
              path="/faculty"
              element={<FacultyPage />}
            />

            {/* Students */}
            <Route
              path="/students"
              element={<StudentsPage />}
            />

            {/* Fees */}
            <Route
              path="/fees"
              element={<FeesPage />}
            />

            {/* Dean / HOD Routes - Role Protected */}
            {deanHodAllowed && (
              <>
                <Route
                  path="/dean-hod"
                  element={<DeanOverviewPage />}
                />
                <Route
                  path="/dean-hod/classroom-attendance"
                  element={<ClassroomAttendancePage />}
                />
                <Route
                  path="/dean-hod/clinical-posting"
                  element={<ClinicalPostingReportPage />}
                />
                <Route
                  path="/dean-hod/bunking-analytics"
                  element={<BunkingAnalyticsPage />}
                />
                <Route
                  path="/dean-hod/student-welfare"
                  element={<StudentWelfarePage />}
                />
              </>
            )}

            {/* Unknown dashboard URL */}
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ==========================================
// MAIN APP
// ==========================================

export default function App() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        return null;
      }

      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Invalid stored user:", error);

      localStorage.removeItem("user");
      localStorage.removeItem("token");

      return null;
    }
  });

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = (userData) => {
    console.log("Login successful:", userData);

    /*
      LoginPage se jo userData milega,
      usko localStorage mein save karenge.
    */

    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);

      // Login ke baad dashboard
      navigate("/", { replace: true });
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setUser(null);

    // Login page
    navigate("/login", { replace: true });
  };

  return (
    <Routes>
      {/* ======================================
          LOGIN ROUTE
      ====================================== */}

      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage onLogin={handleLogin} />
          )
        }
      />

      {/* ======================================
          PROTECTED APPLICATION
      ====================================== */}

      <Route
        path="/*"
        element={
          <ProtectedRoutes
            user={user}
            onLogout={handleLogout}
          />
        }
      />
    </Routes>
  );
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getInitials(user) {
  const fullName =
    user?.full_name ||
    user?.username ||
    user?.name ||
    "Super Admin";

  return fullName
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getUserRole(user) {
  if (!user) {
    return "User";
  }

  if (Array.isArray(user.roles)) {
    return user.roles.join(", ");
  }

  if (typeof user.roles === "string") {
    return user.roles;
  }

  return (
    user.role_name ||
    user.role ||
    user.user_type ||
    "Super Admin"
  );
}

function hasDeanHodAccess(user) {
  if (!user) return false;

  const roles = Array.isArray(user.roles)
    ? user.roles
    : typeof user.roles === "string"
    ? user.roles.split(",").map((r) => r.trim())
    : [];

  return roles.some(
    (role) =>
      role.toLowerCase() === "dean" ||
      role.toLowerCase() === "hod" ||
      role.toLowerCase() === "super admin"
  );
}