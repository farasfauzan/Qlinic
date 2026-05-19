import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  Hospital,
  LogOut,
  Menu,
  Search,
  Stethoscope,
  Users,
  X
} from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = {
  pasien: [
    { label: "Dashboard", path: "/patient/dashboard", icon: Activity },
    { label: "Find Doctors", path: "/patient/find-doctor", icon: Search },
    { label: "Appointments", path: "/patient/appointments", icon: CalendarDays },
    { label: "My Records", path: "/patient/medical-records", icon: ClipboardList }
  ],
  dokter: [
    { label: "Dashboard", path: "/doctor/dashboard", icon: Activity },
    { label: "Schedule", path: "/doctor/schedule", icon: CalendarDays },
    { label: "Patients", path: "/doctor/patients", icon: Users }
  ],
  admin: [
    { label: "Dashboard", path: "/admin/dashboard", icon: Activity },
    { label: "Manajemen Dokter", path: "/admin/doctors", icon: Stethoscope },
    { label: "Manajemen Pasien", path: "/admin/patients", icon: Users },
    { label: "Poliklinik", path: "/admin/polyclinics", icon: Hospital },
    { label: "Booking/Antrean", path: "/admin/bookings", icon: HeartPulse },
    { label: "Report & Analytics", path: "/admin/reports", icon: BarChart3 }
  ]
};

export function DashboardLayout({ title, subtitle, children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const items = navItems[user?.role] || [];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-white/10 bg-navy text-white">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-clinical text-white">
          <HeartPulse className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xl font-bold">Qlinic</p>
          <p className="text-xs text-sky-100">Digital clinic queue</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-4">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                isActive ? "bg-white text-navy" : "text-sky-50 hover:bg-white/10"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 rounded-lg bg-white/10 p-3">
          <p className="text-sm font-semibold">{user?.nama}</p>
          <p className="text-xs capitalize text-sky-100">{user?.role}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-sky-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{sidebar}</div>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72">{sidebar}</div>
        </div>
      ) : null}

      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-clinical">Qlinic</p>
              <h1 className="text-2xl font-bold text-navy">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="rounded-lg border border-slate-200 p-2 text-navy lg:hidden"
              aria-label="Buka menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>
        <section className="px-4 py-6 sm:px-6 lg:px-8">{children}</section>
      </main>
    </div>
  );
}
