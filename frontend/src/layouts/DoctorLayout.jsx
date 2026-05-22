import {
  Activity,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  LogOut,
  Menu,
  Users,
  X
} from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/doctor/dashboard", icon: Activity },
  { label: "Patients", path: "/doctor/patients", icon: Users },
  { label: "Records", path: "/doctor/medical-records", icon: ClipboardList },
  { label: "Schedule", path: "/doctor/schedule", icon: CalendarDays }
];

const doctorNotifications = [
  {
    id: "doctor-lab",
    judul: "Hasil lab pasien sudah tersedia",
    pesan: "Hasil lab untuk pasien antrean berikutnya siap ditinjau.",
    jenis: "rekam_medis",
    is_read: 0,
    created_at: new Date(Date.now() - 2 * 60000).toISOString()
  },
  {
    id: "doctor-cancel",
    judul: "Jadwal berubah",
    pesan: "Satu pasien membatalkan janji temu. Slot sudah kembali tersedia.",
    jenis: "booking_cancelled",
    is_read: 0,
    created_at: new Date(Date.now() - 60 * 60000).toISOString()
  }
];

function shouldKeepSidebarExpanded() {
  return Number(sessionStorage.getItem("qlinic_sidebar_expanded_until") || 0) > Date.now();
}

export function DoctorLayout({ title, subtitle, headerActions, children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const doctorName = user?.nama || "Dokter";
  const displayName = doctorName.toLowerCase().startsWith("dr") ? doctorName : `dr. ${doctorName}`;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function keepExpandedDuringNavigation() {
    sessionStorage.setItem("qlinic_sidebar_expanded_until", String(Date.now() + 900));
  }

  const sidebar = (
    <aside className="portal-sidebar group/sidebar flex h-full w-72 flex-col overflow-hidden border-r border-white/10 bg-[linear-gradient(180deg,#07172c_0%,#0b1f3a_58%,#12395f_100%)] text-white shadow-nav transition-all duration-300 ease-out">
      <div className="px-5 py-5">
        <div className="sidebar-logo-card flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 transition-all duration-300">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-clinical text-white shadow-lg shadow-sky-950/20">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div className="sidebar-text overflow-hidden whitespace-nowrap transition-all duration-300">
            <p className="text-xl font-bold">Qlinic</p>
            <p className="text-xs text-sky-100">Doctor workspace</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              setOpen(false);
              keepExpandedDuringNavigation();
            }}
            className={({ isActive }) =>
              `sidebar-nav-item group flex items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-sm font-semibold transition duration-200 hover:shadow-lg hover:shadow-sky-950/10 ${
                isActive
                  ? "bg-white text-navy shadow-lg shadow-sky-950/10"
                  : "text-sky-50 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="sidebar-text overflow-hidden whitespace-nowrap transition-all duration-300">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="sidebar-profile mb-3 overflow-hidden rounded-xl bg-white/10 p-3 ring-1 ring-white/10 transition-all duration-300 lg:px-2 lg:group-hover/sidebar:px-3">
          <p className="sidebar-text overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300">
            {displayName}
          </p>
          <p className="sidebar-text overflow-hidden whitespace-nowrap text-xs text-sky-100 transition-all duration-300">
            {user?.spesialisasi || "Dokter"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-navy transition duration-200 hover:-translate-y-0.5 hover:bg-sky-50 lg:px-0 lg:group-hover/sidebar:px-4"
        >
          <LogOut className="h-4 w-4" />
          <span className="sidebar-text overflow-hidden whitespace-nowrap transition-all duration-300">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-cloud lg:flex">
      <div
        className={`portal-sidebar-shell hidden shrink-0 lg:sticky lg:top-0 lg:block lg:h-screen ${shouldKeepSidebarExpanded() ? "is-expanded" : ""}`}
        onMouseLeave={(event) => {
          sessionStorage.removeItem("qlinic_sidebar_expanded_until");
          event.currentTarget.classList.remove("is-expanded");
        }}
      >
        {sidebar}
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72">{sidebar}</div>
        </div>
      ) : null}

      <main className="portal-main min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-clinical">Qlinic Workspace</p>
              <h1 className="text-2xl font-bold tracking-tight text-navy">
                {title || `Halo, ${displayName}`}
              </h1>
              {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            <div className="flex items-center gap-4">
              {headerActions}
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 sm:flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Online
                </div>
                <div className="hidden sm:block">
                  <NotificationBell fallbackItems={doctorNotifications} />
                </div>
                <button
                  type="button"
                  onClick={() => setOpen((value) => !value)}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-navy shadow-sm lg:hidden"
                  aria-label="Buka menu"
                >
                  {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </header>
        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </section>
      </main>
    </div>
  );
}
