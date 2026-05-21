import {
  Activity,
  Bell,
  CalendarDays,
  HeartPulse,
  HelpCircle,
  Menu,
  Settings,
  Users,
  X
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/doctor/dashboard", icon: Activity },
  { label: "Patients", path: "/doctor/patients", icon: Users },
  { label: "Schedule", path: "/doctor/schedule", icon: CalendarDays },
  { label: "Settings", path: "/doctor/settings", icon: Settings },
  { label: "Help", path: "/doctor/help", icon: HelpCircle }
];

export function DoctorLayout({ title, children }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // Fallback name if user.nama is not available
  const doctorName = user?.nama || "Smith";

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white shadow-sm">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a4778] text-white">
          <HeartPulse className="h-5 w-5" />
        </div>
        <span className="text-xl font-bold text-[#0a4778]">Qlinic</span>
      </div>

      {/* Profile Info */}
      <div className="flex flex-col items-center px-6 pb-6 pt-2">
        <div className="relative mb-3 h-20 w-20 rounded-full border-4 border-sky-50 bg-sky-100 p-1">
          <img
            src={`https://ui-avatars.com/api/?name=${doctorName}&background=0D8ABC&color=fff&size=150`}
            alt="Doctor Avatar"
            className="h-full w-full rounded-full object-cover"
          />
          <div className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500"></div>
        </div>
        <h3 className="text-base font-bold text-navy">Dr. {doctorName}</h3>
        <p className="text-xs font-medium text-slate-500">General Practitioner</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-[#0a4778] text-white shadow-md shadow-[#0a4778]/20"
                  : "text-slate-600 hover:bg-slate-50 hover:text-navy"
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Action */}
      <div className="p-4">
        <button className="w-full rounded-lg bg-[#0a4778] py-2.5 text-sm font-bold text-white shadow hover:bg-[#073e69]">
          View Schedule
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Mobile Sidebar Overlay */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setOpen(false)} />
          <div className="relative h-full w-64">{sidebar}</div>
        </div>
      ) : null}

      {/* Desktop Sidebar */}
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{sidebar}</div>

      {/* Main Content Area */}
      <main className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-navy">{title || `Halo, dr. ${doctorName}! 👋`}</h1>
            <div className="flex items-center gap-4">
              <button className="relative text-slate-400 hover:text-navy">
                <Bell className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              <img
                src={`https://ui-avatars.com/api/?name=${doctorName}&background=0D8ABC&color=fff&size=40`}
                alt="Avatar"
                className="h-8 w-8 rounded-full border border-slate-200"
              />
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-navy shadow-sm lg:hidden"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 px-6 py-6">
          {children}
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <p className="font-bold text-[#0a4778]">
            Qlinic <span className="font-normal text-slate-500">© 2024 Clinic Management. All rights reserved.</span>
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-navy">Privacy Policy</a>
            <a href="#" className="hover:text-navy">Terms of Service</a>
            <a href="#" className="hover:text-navy">Contact Support</a>
            <a href="#" className="hover:text-navy">Clinic Locations</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
