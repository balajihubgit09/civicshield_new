import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import UserPage from "./pages/UserPage.jsx";
import CitizenLoginPage from "./pages/CitizenLoginPage.jsx";

const navLinks = [
  { to: "/", label: "Overview" },
  { to: "/citizen/login", label: "Citizen Login" },
  { to: "/citizen/workspace", label: "Citizen Workspace" },
  { to: "/admin/login", label: "Admin Login" },
  { to: "/admin/dashboard", label: "Admin Dashboard" }
];

const themes = [
  {
    id: "aurora",
    name: "Aurora Glass",
    description: "Deep slate with cyan and emerald highlights."
  },
  {
    id: "light",
    name: "Light Glass",
    description: "Bright frosted surfaces with cool blue highlights."
  }
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

function readTheme() {
  if (typeof window === "undefined") {
    return "aurora";
  }

  return window.localStorage.getItem("civicshield.theme") || "aurora";
}

function writeTheme(theme) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("civicshield.theme", theme);
}

function ProtectedRoute({ allowed, redirectTo, children }) {
  if (!allowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

function GearButton({ open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open interface settings"
      aria-expanded={open}
      className={`settings-trigger ${open ? "settings-trigger-active" : ""}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.3 3.9c.4-1.2 2-1.2 2.4 0l.3 1a1.7 1.7 0 0 0 2.2 1.1l1-.4c1.1-.5 2.3.7 1.8 1.8l-.4 1A1.7 1.7 0 0 0 18.7 11l1 .3c1.2.4 1.2 2 0 2.4l-1 .3a1.7 1.7 0 0 0-1.1 2.2l.4 1c.5 1.1-.7 2.3-1.8 1.8l-1-.4a1.7 1.7 0 0 0-2.2 1.1l-.3 1c-.4 1.2-2 1.2-2.4 0l-.3-1A1.7 1.7 0 0 0 8 18.6l-1 .4c-1.1.5-2.3-.7-1.8-1.8l.4-1a1.7 1.7 0 0 0-1.1-2.2l-1-.3c-1.2-.4-1.2-2 0-2.4l1-.3A1.7 1.7 0 0 0 5.6 8.8l-.4-1c-.5-1.1.7-2.3 1.8-1.8l1 .4A1.7 1.7 0 0 0 10.2 5z"
        />
        <circle cx="12" cy="12" r="3.2" />
      </svg>
    </button>
  );
}

function SettingsPanel({ theme, setTheme }) {
  return (
    <div className="settings-panel">
      <div className="settings-head">
        <div>
          <p className="settings-kicker">Appearance</p>
          <h2 className="settings-title">Interface settings</h2>
        </div>
        <span className="settings-pill">2 themes</span>
      </div>

      <div className="settings-section">
        <p className="settings-label">Available themes</p>
        <div className="settings-grid">
          {themes.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              className={`theme-option ${theme === option.id ? "theme-option-active" : ""}`}
            >
              <span className={`theme-swatch theme-swatch-${option.id}`} />
              <span className="theme-copy">
                <span className="theme-name">{option.name}</span>
                <span className="theme-description">{option.description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SessionSummary({ citizenSession, adminSession, onCitizenLogout, onAdminLogout }) {
  const navigate = useNavigate();

  return (
    <div className="session-strip">
      <div className="session-card">
        <p className="session-label">Citizen session</p>
        <p className="session-value">{citizenSession ? citizenSession.fullName : "Not signed in"}</p>
        <p className="session-meta">{citizenSession ? citizenSession.citizenId : "Open citizen login to continue."}</p>
        {citizenSession ? (
          <button
            type="button"
            onClick={() => {
              onCitizenLogout();
              navigate("/citizen/login");
            }}
            className="session-action"
          >
            End citizen session
          </button>
        ) : null}
      </div>

      <div className="session-card">
        <p className="session-label">Admin session</p>
        <p className="session-value">{adminSession ? adminSession.username : "Protected access"}</p>
        <p className="session-meta">
          {adminSession ? "Authenticated in this browser session." : "Open admin login to access operations."}
        </p>
        {adminSession ? (
          <button
            type="button"
            onClick={() => {
              onAdminLogout();
              navigate("/admin/login");
            }}
            className="session-action"
          >
            End admin session
          </button>
        ) : null}
      </div>
    </div>
  );
}

function AppLayout({ theme, setTheme, citizenSession, adminSession, onCitizenLogout, onAdminLogout, children }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSettingsOpen(false);
  }, [location.pathname]);

  const pageTitle = useMemo(() => {
    const match = navLinks.find((link) => link.to === location.pathname);
    return match ? match.label : "CivicShield";
  }, [location.pathname]);

  return (
    <div className="app-shell min-h-screen" data-theme={theme}>
      <div className="app-backdrop" />
      <div className="app-grid" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <header className="topbar">
          <div className="topbar-brand">
            <div className="brand-mark">CS</div>
            <div>
              <p className="brand-kicker">CivicShield Platform</p>
              <h1 className="brand-title">Welfare operations command interface</h1>
            </div>
          </div>

          <div className="topbar-nav">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `nav-chip ${isActive ? "nav-chip-active" : ""}`}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="topbar-actions">
            <div className="topbar-page">
              <p className="topbar-page-label">Current page</p>
              <p className="topbar-page-title">{pageTitle}</p>
            </div>
            <GearButton open={settingsOpen} onClick={() => setSettingsOpen((current) => !current)} />
          </div>
        </header>

        {settingsOpen ? <SettingsPanel theme={theme} setTheme={setTheme} /> : null}

        <SessionSummary
          citizenSession={citizenSession}
          adminSession={adminSession}
          onCitizenLogout={onCitizenLogout}
          onAdminLogout={onAdminLogout}
        />

        <main className="page-enter flex-1 pt-6">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  const [citizenSession, setCitizenSession] = useState(() => readSession("civicshield.citizen"));
  const [adminSession, setAdminSession] = useState(() => readSession("civicshield.admin"));
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    writeSession("civicshield.citizen", citizenSession);
  }, [citizenSession]);

  useEffect(() => {
    writeSession("civicshield.admin", adminSession);
  }, [adminSession]);

  useEffect(() => {
    writeTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <AppLayout
      theme={theme}
      setTheme={setTheme}
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
