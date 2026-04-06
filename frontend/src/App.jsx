import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import UserPage from "./pages/UserPage.jsx";
import CitizenLoginPage from "./pages/CitizenLoginPage.jsx";

const citizenLinks = [
  { to: "/", label: "Overview" },
  { to: "/citizen/login", label: "Citizen Login" },
  { to: "/citizen/workspace", label: "Citizen Workspace" }
];

const adminLinks = [
  { to: "/admin/login", label: "Admin Login" },
  { to: "/admin/dashboard", label: "Admin Command" }
];

function readSession(key) {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.sessionStorage.getItem(key);
  return value ? JSON.parse(value) : null;
}

function writeSession(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  if (value) {
    window.sessionStorage.setItem(key, JSON.stringify(value));
    return;
  }

  window.sessionStorage.removeItem(key);
}

function ProtectedRoute({ allowed, redirectTo, children }) {
  if (!allowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

function AppLayout({ citizenSession, adminSession, onCitizenLogout, onAdminLogout, children }) {
  const navigate = useNavigate();

  const navSections = useMemo(
    () => [
      { title: "Citizen Access", links: citizenLinks },
      { title: "Administration", links: adminLinks }
    ],
    []
  );

  return (
    <div className="app-shell min-h-screen">
      <div className="app-noise" />
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-5 px-4 py-4 sm:px-6 lg:flex-row lg:px-8">
        <aside className="glass-sidebar w-full shrink-0 rounded-lg border border-white/14 px-5 py-5 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-[320px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">CivicShield</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">Secure public welfare operations</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Claim intake, audit visibility, fraud defence, and intervention controls in one guided command surface.
              </p>
            </div>
            <div className="hidden rounded-lg border border-white/12 bg-white/10 px-3 py-2 text-right lg:block">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-300">Live</p>
              <p className="mt-1 text-sm font-semibold text-emerald-300">Protected</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            {navSections.map((section) => (
              <div key={section.title} className="rounded-lg border border-white/8 bg-white/6 p-3">
                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {section.title}
                </p>
                <div className="mt-3 grid gap-2">
                  {section.links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        `rounded-lg px-3 py-3 text-sm font-medium transition ${
                          isActive
                            ? "border border-cyan-300/30 bg-cyan-400/16 text-white shadow-panel"
                            : "border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/8 hover:text-white"
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-lg border border-white/10 bg-slate-950/35 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Citizen Session</p>
              {citizenSession ? (
                <>
                  <p className="mt-2 text-sm font-semibold text-white">{citizenSession.fullName}</p>
                  <p className="mt-1 text-sm text-slate-300">{citizenSession.citizenId}</p>
                  <button
                    type="button"
                    onClick={() => {
                      onCitizenLogout();
                      navigate("/citizen/login");
                    }}
                    className="mt-3 w-full rounded-lg border border-white/12 bg-white/8 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/12"
                  >
                    End Citizen Session
                  </button>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-400">No citizen session in this browser tab.</p>
              )}
            </div>

            <div className="rounded-lg border border-white/10 bg-slate-950/35 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Admin Session</p>
              {adminSession ? (
                <>
                  <p className="mt-2 text-sm font-semibold text-white">{adminSession.username}</p>
                  <p className="mt-1 text-sm text-slate-300">Authenticated for this session only.</p>
                  <button
                    type="button"
                    onClick={() => {
                      onAdminLogout();
                      navigate("/admin/login");
                    }}
                    className="mt-3 w-full rounded-lg border border-white/12 bg-white/8 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/12"
                  >
                    End Admin Session
                  </button>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-400">Admin controls require authentication.</p>
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 pb-4">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  const [citizenSession, setCitizenSession] = useState(() => readSession("civicshield.citizen"));
  const [adminSession, setAdminSession] = useState(() => readSession("civicshield.admin"));

  useEffect(() => {
    writeSession("civicshield.citizen", citizenSession);
  }, [citizenSession]);

  useEffect(() => {
    writeSession("civicshield.admin", adminSession);
  }, [adminSession]);

  return (
    <AppLayout
      citizenSession={citizenSession}
      adminSession={adminSession}
      onCitizenLogout={() => setCitizenSession(null)}
      onAdminLogout={() => setAdminSession(null)}
    >
      <Routes>
        <Route path="/" element={<HomePage citizenSession={citizenSession} adminSession={adminSession} />} />
        <Route
          path="/citizen/login"
          element={<CitizenLoginPage session={citizenSession} onLogin={setCitizenSession} />}
        />
        <Route
          path="/citizen/workspace"
          element={
            <ProtectedRoute allowed={Boolean(citizenSession)} redirectTo="/citizen/login">
              <UserPage session={citizenSession} onLogout={() => setCitizenSession(null)} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/login"
          element={<AdminLoginPage session={adminSession} onLogin={setAdminSession} />}
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowed={Boolean(adminSession)} redirectTo="/admin/login">
              <AdminDashboard credentials={adminSession} onLogout={() => setAdminSession(null)} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
