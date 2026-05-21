import {
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Info,
  LogOut,
  MapPin,
  Menu,
  Navigation,
  RefreshCcw,
  Search,
  ShieldCheck,
  Stethoscope,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EmptyState, LoadingState } from "../../components/States";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { formatDate, formatTime } from "../../utils";

const navItems = [
  { label: "Dashboard", path: "/patient/dashboard" },
  { label: "Cari Dokter", path: "/patient/find-doctor" },
  { label: "Janji Temu", path: "/patient/appointments" },
  { label: "Rekam Medis", path: "/patient/medical-records" }
];

const statusTabs = [
  { label: "Semua", value: "all" },
  { label: "Aktif", value: "Pending" },
  { label: "Selesai", value: "Done" },
  { label: "Batal", value: "Cancelled" }
];

export default function PatientAppointments() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  async function loadBookings() {
    setLoading(true);
    try {
      const response = await api.get("/pasien/bookings");
      setBookings(response.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  const sortedBookings = useMemo(
    () => [...bookings].sort((a, b) => bookingDateTime(a) - bookingDateTime(b)),
    [bookings]
  );

  const filteredBookings = useMemo(
    () =>
      selectedStatus === "all"
        ? sortedBookings
        : sortedBookings.filter((booking) => booking.status_booking === selectedStatus),
    [selectedStatus, sortedBookings]
  );

  const nextAppointment = useMemo(
    () => sortedBookings.find((booking) => booking.status_booking === "Pending"),
    [sortedBookings]
  );

  const counts = useMemo(
    () => ({
      Pending: bookings.filter((booking) => booking.status_booking === "Pending").length,
      Done: bookings.filter((booking) => booking.status_booking === "Done").length,
      Cancelled: bookings.filter((booking) => booking.status_booking === "Cancelled").length
    }),
    [bookings]
  );

  function handleLogout() {
    setConfirmLogoutOpen(true);
  }

  function confirmLogout() {
    logout();
    navigate("/login");
  }

  async function confirmCancelBooking() {
    if (!bookingToCancel) return;
    setCancelling(true);
    try {
      await api.put(`/booking/${bookingToCancel.id}/cancel`);
      toast.success("Booking berhasil dibatalkan");
      setBookingToCancel(null);
      await loadBookings();
    } catch (error) {
      toast.error(error.message || "Gagal membatalkan booking");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fd] text-[#12385d]">
      <PatientTopNav
        user={user}
        open={mobileMenuOpen}
        onToggleMenu={() => setMobileMenuOpen((value) => !value)}
        onCloseMenu={() => setMobileMenuOpen(false)}
        onLogout={handleLogout}
      />

      <main>
        <PageHeader total={bookings.length} active={counts.Pending} />

        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-10">
          {loading ? (
            <LoadingState />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="content-stagger min-w-0 space-y-6">
                <NextAppointmentCard appointment={nextAppointment} />

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-[#12385d]">Daftar appointment</h2>
                      <p className="mt-1 text-sm text-slate-500">Pantau jadwal, antrean, dan status kunjungan.</p>
                    </div>
                    <button
                      type="button"
                      onClick={loadBookings}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0a4778] transition hover:bg-sky-50"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Refresh
                    </button>
                  </div>

                  <StatusTabs value={selectedStatus} onChange={setSelectedStatus} counts={counts} />

                  {filteredBookings.length ? (
                    <div className="mt-5 grid gap-4">
                      {filteredBookings.map((booking) => (
                        <AppointmentCard key={booking.id} booking={booking} onCancel={setBookingToCancel} />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-7">
                      <EmptyState
                        title="Tidak ada appointment"
                        description="Appointment sesuai filter akan tampil di sini."
                      />
                    </div>
                  )}
                </section>
              </div>

              <aside className="content-stagger space-y-6">
                <SummaryCard counts={counts} />
                <PreparationCard />
                <ClinicDirectionsCard />
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />

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

      {bookingToCancel ? (
        <ConfirmDialog
          title="Batalkan janji temu?"
          description="Tindakan ini akan mengubah status janji temu menjadi batal. Pastikan jadwal yang dipilih benar sebelum melanjutkan."
          details={[
            { label: "Dokter", value: bookingToCancel.dokter_nama },
            {
              label: "Jadwal",
              value: `${formatDate(bookingToCancel.tanggal_kunjungan)} pukul ${formatTime(bookingToCancel.jam_slot)}`
            },
            { label: "Nomor antrean", value: `#${bookingToCancel.nomor_antrean}` }
          ]}
          confirmLabel="Ya, batalkan"
          cancelLabel="Tidak, kembali"
          tone="danger"
          loading={cancelling}
          onConfirm={confirmCancelBooking}
          onCancel={() => setBookingToCancel(null)}
        />
      ) : null}
    </div>
  );
}

function PatientTopNav({ user, open, onToggleMenu, onCloseMenu, onLogout }) {
  return (
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
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-sky-50 px-3 text-sm font-semibold text-[#0a4778] ring-1 ring-sky-100 transition hover:bg-sky-100"
            aria-label={`Keluar dari akun ${user?.nama || "pasien"}`}
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Keluar</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleMenu}
          className="rounded-lg border border-slate-200 bg-white p-2 text-[#0a4778] shadow-sm md:hidden"
          aria-label="Buka menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg md:hidden">
          <nav className="grid gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMenu}
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
              onClick={onLogout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              aria-label={`Keluar dari akun ${user?.nama || "pasien"}`}
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function PageHeader({ total, active }) {
  return (
    <section className="page-enter bg-[#0a4778] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Appointment</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-100">
            Kelola jadwal kunjungan dan antrean klinik dengan tenang.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <HeaderPill icon={CalendarCheck} label={`${active} aktif`} />
          <HeaderPill icon={Clock3} label={`${total} total`} />
          <Link
            to="/patient/find-doctor"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#58b9f6] px-5 py-3 text-sm font-semibold text-[#06385f] shadow-sm transition hover:bg-[#79c8fa]"
          >
            <CalendarPlus className="h-4 w-4" />
            Buat Janji
          </Link>
        </div>
      </div>
    </section>
  );
}

function NextAppointmentCard({ appointment }) {
  return (
    <section className="surface-lift rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-sm font-semibold text-[#0a4778]">
            <CalendarDays className="h-4 w-4" />
            Kunjungan berikutnya
          </p>
          <h2 className="mt-4 text-xl font-bold text-[#12385d]">
            {appointment ? appointment.dokter_nama : "Belum ada jadwal aktif"}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#0d78b7]">
            {appointment ? appointment.spesialisasi || "Dokter Umum" : "Cari dokter untuk membuat appointment baru."}
          </p>
        </div>

        {appointment ? (
          <div className="rounded-xl bg-[#073e69] px-5 py-4 text-center text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-200">Antrean</p>
            <p className="mt-1 text-3xl font-bold">#{appointment.nomor_antrean}</p>
          </div>
        ) : (
          <Link
            to="/patient/find-doctor"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#073e69] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#052f50]"
          >
            <Search className="h-4 w-4" />
            Cari Dokter
          </Link>
        )}
      </div>

      {appointment ? (
        <div className="mt-5 grid gap-3 rounded-xl border border-sky-100 bg-sky-50/70 p-4 sm:grid-cols-3">
          <AppointmentInfo icon={CalendarDays} label="Tanggal" value={formatDate(appointment.tanggal_kunjungan)} />
          <AppointmentInfo icon={Clock3} label="Jam" value={formatTime(appointment.jam_slot)} />
          <AppointmentInfo icon={MapPin} label="Poliklinik" value={appointment.nama_poli || "Qlinic Pusat"} />
        </div>
      ) : null}
    </section>
  );
}

function StatusTabs({ value, onChange, counts }) {
  function tabCount(tabValue) {
    if (tabValue === "all") return counts.Pending + counts.Done + counts.Cancelled;
    return counts[tabValue] || 0;
  }

  return (
    <div className="mt-5 flex gap-2 overflow-x-auto rounded-xl bg-slate-100 p-1">
      {statusTabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`inline-flex min-w-fit items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            value === tab.value
              ? "bg-white text-[#0a4778] shadow-sm"
              : "text-slate-500 hover:bg-white/60 hover:text-[#12385d]"
          }`}
        >
          {tab.label}
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
            {tabCount(tab.value)}
          </span>
        </button>
      ))}
    </div>
  );
}

function AppointmentCard({ booking, onCancel }) {
  const canCancel = booking.status_booking === "Pending";

  return (
    <article className="surface-lift rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-sky-200 hover:shadow-card">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#0a4778] ring-1 ring-sky-100">
            <Stethoscope className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-[#12385d]">{booking.dokter_nama}</h3>
              <StatusBadge status={booking.status_booking} />
            </div>
            <p className="mt-1 text-sm font-semibold text-[#0d78b7]">{booking.spesialisasi || "Dokter Umum"}</p>
            <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <InlineDetail icon={CalendarDays} text={formatDate(booking.tanggal_kunjungan)} />
              <InlineDetail icon={Clock3} text={formatTime(booking.jam_slot)} />
              <InlineDetail icon={MapPin} text={booking.nama_poli || "Qlinic Pusat"} />
              <InlineDetail icon={ShieldCheck} text={`Antrean #${booking.nomor_antrean}`} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
          <button
            type="button"
            onClick={() => onCancel(booking)}
            disabled={!canCancel}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CalendarX className="h-4 w-4" />
            Batalkan
          </button>
        </div>
      </div>
    </article>
  );
}

function SummaryCard({ counts }) {
  return (
    <section className="surface-lift rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-[#12385d]">Ringkasan</h2>
      <div className="mt-4 grid gap-3">
        <SummaryRow icon={CalendarCheck} label="Aktif" value={counts.Pending} tone="sky" />
        <SummaryRow icon={CheckCircle2} label="Selesai" value={counts.Done} tone="emerald" />
        <SummaryRow icon={CalendarX} label="Batal" value={counts.Cancelled} tone="rose" />
      </div>
    </section>
  );
}

function PreparationCard() {
  return (
    <section className="surface-lift rounded-xl border border-emerald-100 bg-emerald-50/70 p-5 text-emerald-900 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <Info className="h-5 w-5" />
        Sebelum datang
      </h2>
      <div className="mt-4 space-y-3 text-sm font-medium leading-6">
        <ChecklistItem text="Datang 10 menit lebih awal." />
        <ChecklistItem text="Bawa kartu identitas." />
        <ChecklistItem text="Simpan nomor antrean." />
      </div>
    </section>
  );
}

function ClinicDirectionsCard() {
  return (
    <section className="surface-lift overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5">
        <h2 className="text-base font-semibold text-[#12385d]">Lokasi klinik</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Jl. Sudirman No. 45, Jakarta Selatan</p>
      </div>
      <div className="relative min-h-40 bg-[#1b7a89]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_25%,transparent_25%),linear-gradient(225deg,rgba(255,255,255,0.18)_25%,transparent_25%),linear-gradient(45deg,rgba(255,255,255,0.18)_25%,transparent_25%),linear-gradient(315deg,rgba(255,255,255,0.18)_25%,#1b7a89_25%)] bg-[length:54px_54px] bg-[position:27px_0,27px_0,0_0,0_0]" />
        <div className="absolute inset-x-0 top-1/2 h-7 -rotate-12 bg-white/70" />
        <div className="absolute bottom-4 left-5 h-14 w-24 rotate-[-12deg] rounded-lg bg-emerald-200/70" />
        <div className="absolute right-5 top-5 h-16 w-20 rotate-[-12deg] rounded-lg bg-sky-100/70" />
        <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0a4778] ring-4 ring-white/80" />
        <div className="relative flex min-h-40 items-center justify-center">
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0a4778] shadow-lg"
          >
            <Navigation className="h-4 w-4" />
            Petunjuk Arah
          </a>
        </div>
      </div>
    </section>
  );
}

function HeaderPill({ icon: Icon, label }) {
  return (
    <div className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-sky-50 ring-1 ring-white/15">
      <Icon className="h-4 w-4" />
      {label}
    </div>
  );
}

function AppointmentInfo({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Icon className="h-4 w-4" />
        {label}
      </p>
      <p className="mt-1 font-semibold text-[#12385d]">{value}</p>
    </div>
  );
}

function InlineDetail({ icon: Icon, text }) {
  return (
    <p className="flex min-w-0 items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      <span className="truncate">{text}</span>
    </p>
  );
}

function SummaryRow({ icon: Icon, label, value, tone }) {
  const tones = {
    sky: "bg-sky-50 text-[#0a4778]",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-600"
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-3">
      <span className="flex items-center gap-3 text-sm font-semibold text-slate-600">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </span>
      <span className="text-lg font-bold text-[#12385d]">{value}</span>
    </div>
  );
}

function ChecklistItem({ text }) {
  return (
    <p className="flex items-center gap-3">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      {text}
    </p>
  );
}

function Footer() {
  return (
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
  );
}

function bookingDateTime(booking) {
  const time = booking.jam_slot ? formatTime(booking.jam_slot) : "00:00";
  return new Date(`${booking.tanggal_kunjungan}T${time}`).getTime();
}
