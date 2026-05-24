import { HeartPulse, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/patient/dashboard" },
  { label: "Cari Dokter", path: "/patient/find-doctor" },
  { label: "Janji Temu", path: "/patient/appointments" },
  { label: "Rekam Medis", path: "/patient/medical-records" }
];

export function PatientLayout({ children, className = "bg-[#f4f7fd] text-[#12385d]" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  function confirmLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className={`min-h-screen ${className}`}>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <Link to="/patient/dashboard" className="flex items-center gap-2 text-[#0a4778]">
            <HeartPulse className="h-6 w-6" />
            <span className="text-xl font-extrabold tracking-tight">Qlinic</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `border-b-2 py-5 text-sm font-bold transition ${
                    isActive
                      ? "border-[#0a4778] text-[#0a4778]"
                      : "border-transparent text-slate-500 hover:text-[#0a4778]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <NotificationBell />
            <button
              type="button"
              onClick={() => setConfirmLogoutOpen(true)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-sky-50 px-3 text-sm font-semibold text-[#0a4778] ring-1 ring-sky-100 transition hover:bg-sky-100"
              aria-label={`Keluar dari akun ${user?.nama || "pasien"}`}
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">Keluar</span>
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <NotificationBell />
            <button
              type="button"
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="rounded-lg border border-slate-200 bg-white p-2 text-[#0a4778] shadow-sm"
              aria-label="Buka menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg md:hidden">
            <nav className="grid gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-bold ${
                      isActive ? "bg-sky-50 text-[#0a4778]" : "text-slate-600"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setConfirmLogoutOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          </div>
        ) : null}
      </header>

      {children}

      <footer className="mt-20 border-t border-[#c8d7ec] bg-[#dfeafb]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-slate-600 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-10">
          <div>
            <p className="font-extrabold text-[#0a4778]">Qlinic</p>
            <p className="mt-4 text-xs font-medium">&copy; 2024 Qlinic Clinical Management. All rights reserved.</p>
          </div>
          <nav className="flex flex-wrap gap-x-7 gap-y-3 text-xs font-semibold">
            <a href="#privacy" className="hover:text-[#0a4778]">Privacy Policy</a>
            <a href="#terms" className="hover:text-[#0a4778]">Terms of Service</a>
            <a href="#support" className="hover:text-[#0a4778]">Contact Support</a>
            <a href="#locations" className="hover:text-[#0a4778]">Clinic Locations</a>
          </nav>
        </div>
      </footer>

      {confirmLogoutOpen ? (
        <ConfirmDialog
          title="Keluar dari akun?"
          description="Sesi Anda akan ditutup. Anda perlu login kembali untuk melihat janji temu dan rekam medis."
          confirmLabel="Ya, keluar"
          cancelLabel="Tetap di halaman"
          tone="warning"
          onConfirm={confirmLogout}
          onCancel={() => setConfirmLogoutOpen(false)}
        />
      ) : null}
    </div>
  );
}
