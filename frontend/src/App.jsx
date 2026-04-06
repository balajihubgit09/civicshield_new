import { NavLink, Route, Routes } from "react-router-dom";
import UserPage from "./pages/UserPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

const linkClass = ({ isActive }) =>
  `rounded-lg px-4 py-2 text-sm font-medium transition ${
    isActive ? "bg-sky-500 text-white shadow-sm" : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
  }`;

export default function App() {
  return (
    <div className="grid-surface min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="glass-panel mb-6 rounded-lg border border-white/70 px-5 py-4 shadow-panel">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">CivicShield</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">Tamper-Proof Welfare Disbursement System</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Secure citizen claim validation with fraud detection, budget control, and a chained ledger.
              </p>
            </div>
            <nav className="flex gap-2 self-start rounded-lg border border-slate-200/80 bg-white/60 p-1">
              <NavLink to="/" end className={linkClass}>
                User Portal
              </NavLink>
              <NavLink to="/admin" className={linkClass}>
                Admin Dashboard
              </NavLink>
            </nav>
          </div>
        </header>
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<UserPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
