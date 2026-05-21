import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  ClipboardPlus,
  Clock3,
  Filter,
  HeartPulse,
  LogOut,
  Menu,
  RefreshCcw,
  Stethoscope,
  UserRound,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EmptyState, LoadingState } from "../../components/States";
import { useAuth } from "../../context/AuthContext";
import { formatDate, formatTime, toInputDate } from "../../utils";

const navItems = [
  { label: "Dashboard", path: "/doctor/dashboard" },
  { label: "Jadwal", path: "/doctor/schedule" },
  { label: "Pasien", path: "/doctor/patients" }
];

const statusOptions = [
  { label: "Semua", value: "" },
  { label: "Menunggu", value: "Pending" },
  { label: "Selesai", value: "Done" },
  { label: "Dibatalkan", value: "Cancelled" }
];

const statusLabel = {
  Pending: "Menunggu",
  Done: "Selesai",
  Cancelled: "Dibatalkan"
};

const statusStyles = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Done: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Cancelled: "bg-rose-50 text-rose-700 ring-rose-200"
};

export default function DoctorSchedule() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tanggal, setTanggal] = useState(toInputDate());
  const [status, setStatus] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [bookingToComplete, setBookingToComplete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadBookings() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tanggal) params.set("tanggal", tanggal);
      if (status) params.set("status", status);
      const response = await api.get(`/dokter/me/bookings?${params.toString()}`);
      setBookings(response.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, [tanggal, status]);

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) =>
          formatTime(a.jam_slot).localeCompare(formatTime(b.jam_slot)) ||
          Number(a.nomor_antrean || 0) - Number(b.nomor_antrean || 0)
      ),
    [bookings]
  );

  const counts = useMemo(
    () => ({
      pending: bookings.filter((booking) => booking.status_booking === "Pending").length,
      done: bookings.filter((booking) => booking.status_booking === "Done").length,
      cancelled: bookings.filter((booking) => booking.status_booking === "Cancelled").length
    }),
    [bookings]
  );

  const nextBooking = sortedBookings.find((booking) => booking.status_booking === "Pending");
  const isToday = tanggal === toInputDate();

  function confirmLogout() {
    logout();
    navigate("/login");
  }

  async function completeBooking() {
    if (!bookingToComplete) return;

    setActionLoading(true);
    try {
      await api.put(`/booking/${bookingToComplete.id}/status`, { status_booking: "Done" });
      toast.success("Kunjungan ditandai selesai");
      setBookingToComplete(null);
      await loadBookings();
    } catch (error) {
      toast.error(error.message || "Gagal mengubah status kunjungan");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fd] text-[#12385d]">
      <DoctorTopNav
        user={user}
        open={mobileMenuOpen}
        onToggleMenu={() => setMobileMenuOpen((value) => !value)}
        onCloseMenu={() => setMobileMenuOpen(false)}
        onLogout={() => setConfirmLogoutOpen(true)}
      />

      <main>
        <PageHeader
          date={tanggal}
          total={bookings.length}
          pending={counts.pending}
          onToday={() => setTanggal(toInputDate())}
          isToday={isToday}
        />

        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-10">
          <div className="content-stagger space-y-6">
            <ScheduleFilters
              tanggal={tanggal}
              status={status}
              total={bookings.length}
              loading={loading}
              onTanggalChange={setTanggal}
              onStatusChange={setStatus}
              onRefresh={loadBookings}
            />

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#12385d]">Daftar jadwal pasien</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(tanggal)} berisi {bookings.length} booking sesuai filter.
                    </p>
                  </div>
                  <Link
                    to="/doctor/patients"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#073e69] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#052f50]"
                  >
                    <ClipboardPlus className="h-4 w-4" />
                    Lihat pasien
                  </Link>
                </div>

                {loading ? (
                  <LoadingState />
                ) : sortedBookings.length ? (
                  <ScheduleList bookings={sortedBookings} onComplete={setBookingToComplete} />
                ) : (
                  <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-7">
                    <EmptyState
                      title="Jadwal kosong"
                      description="Tidak ada booking sesuai tanggal dan status yang dipilih."
                    />
                    {!isToday ? (
                      <div className="mt-4 flex justify-center">
                        <button
                          type="button"
                          onClick={() => setTanggal(toInputDate())}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#073e69] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#052f50]"
                        >
                          <CalendarDays className="h-4 w-4" />
                          Lihat jadwal hari ini
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </section>

              <ScheduleSummary
                counts={counts}
                total={bookings.length}
                nextBooking={nextBooking}
                doctorSchedule={user?.jadwal_praktik}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {confirmLogoutOpen ? (
        <ConfirmDialog
          title="Keluar dari portal dokter?"
          description="Sesi Anda akan ditutup. Pastikan perubahan pekerjaan klinis sudah selesai sebelum keluar."
          confirmLabel="Ya, keluar"
          cancelLabel="Tetap di jadwal"
          tone="warning"
          onConfirm={confirmLogout}
          onCancel={() => setConfirmLogoutOpen(false)}
        />
      ) : null}

      {bookingToComplete ? (
        <ConfirmDialog
          title="Selesaikan kunjungan pasien?"
          description="Status booking akan berubah menjadi selesai. Pastikan kunjungan pasien benar-benar sudah selesai sebelum melanjutkan."
          details={[
            { label: "Pasien", value: bookingToComplete.pasien_nama },
            {
              label: "Jadwal",
              value: `${formatDate(bookingToComplete.tanggal_kunjungan)} pukul ${formatTime(
                bookingToComplete.jam_slot
              )}`
            },
            { label: "Nomor antrean", value: `#${bookingToComplete.nomor_antrean}` }
          ]}
          confirmLabel="Ya, selesaikan"
          cancelLabel="Periksa lagi"
          tone="info"
          loading={actionLoading}
          onConfirm={completeBooking}
          onCancel={() => setBookingToComplete(null)}
        />
      ) : null}
    </div>
  );
}

function DoctorTopNav({ user, open, onToggleMenu, onCloseMenu, onLogout }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <Link to="/doctor/dashboard" className="flex items-center gap-2 text-[#0a4778]">
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
          <div className="hidden min-w-0 text-right lg:block">
            <p className="truncate text-sm font-bold text-[#12385d]">{user?.nama || "Dokter"}</p>
            <p className="text-xs font-medium text-slate-500">{user?.spesialisasi || "Dokter Klinik"}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-sky-50 px-3 text-sm font-semibold text-[#0a4778] ring-1 ring-sky-100 transition hover:bg-sky-100"
            aria-label={`Keluar dari akun ${user?.nama || "dokter"}`}
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
              aria-label={`Keluar dari akun ${user?.nama || "dokter"}`}
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

function PageHeader({ date, total, pending, onToday, isToday }) {
  return (
    <section className="page-enter bg-[#0a4778] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div>
          <p className="text-sm font-semibold text-sky-100">Jadwal praktik</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal sm:text-4xl">
            Jadwal Pasien
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-100">
            Pantau booking berdasarkan tanggal, cek status kunjungan, dan selesaikan pasien dari satu layar.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <HeaderPill icon={CalendarDays} label={formatDate(date)} />
          <HeaderPill icon={Clock3} label={`${pending} menunggu`} />
          {!isToday ? (
            <button
              type="button"
              onClick={onToday}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#58b9f6] px-4 py-3 text-sm font-semibold text-[#06385f] transition hover:bg-[#79c8fa]"
            >
              <CalendarCheck className="h-4 w-4" />
              Hari ini
            </button>
          ) : (
            <HeaderPill icon={CalendarCheck} label={`${total} booking`} />
          )}
        </div>
      </div>
    </section>
  );
}

function ScheduleFilters({
  tanggal,
  status,
  total,
  loading,
  onTanggalChange,
  onStatusChange,
  onRefresh
}) {
  return (
    <section className="surface-lift rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[220px_1fr_auto] lg:items-center">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tanggal
          </span>
          <input
            type="date"
            value={tanggal}
            onChange={(event) => onTanggalChange(event.target.value)}
            className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-[#12385d] outline-none transition focus:border-[#0a4778] focus:bg-white focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </span>
          <div className="flex gap-2 overflow-x-auto rounded-xl bg-slate-100 p-1">
            {statusOptions.map((option) => (
              <button
                key={option.value || "all"}
                type="button"
                onClick={() => onStatusChange(option.value)}
                className={`inline-flex min-h-10 min-w-fit items-center justify-center rounded-lg px-3 text-sm font-semibold transition ${
                  status === option.value
                    ? "bg-white text-[#0a4778] shadow-sm"
                    : "text-slate-500 hover:bg-white/60 hover:text-[#12385d]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 lg:pt-5">
          <div className="flex min-h-10 items-center gap-2 rounded-lg bg-slate-50 px-3 text-sm font-semibold text-slate-600">
            <Filter className="h-4 w-4 text-slate-400" />
            {total} booking
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0a4778] transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>
    </section>
  );
}

function ScheduleList({ bookings, onComplete }) {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
      <div className="hidden grid-cols-[110px_1fr_130px_150px_170px] gap-4 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 lg:grid">
        <span>Antrean</span>
        <span>Pasien</span>
        <span>Waktu</span>
        <span>Status</span>
        <span className="text-right">Aksi</span>
      </div>

      <div className="divide-y divide-slate-100">
        {bookings.map((booking) => (
          <ScheduleRow key={booking.id} booking={booking} onComplete={onComplete} />
        ))}
      </div>
    </div>
  );
}

function ScheduleRow({ booking, onComplete }) {
  const canComplete = booking.status_booking === "Pending";

  return (
    <article className="grid gap-4 bg-white p-4 transition hover:bg-sky-50/40 lg:grid-cols-[110px_1fr_130px_150px_170px] lg:items-center">
      <div className="flex items-center justify-between gap-3 lg:block">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#073e69] text-sm font-bold text-white">
          {booking.nomor_antrean}
        </span>
        <VisitStatus className="inline-flex lg:hidden" status={booking.status_booking} />
      </div>

      <div className="min-w-0">
        <h3 className="truncate font-bold text-[#12385d]">{booking.pasien_nama}</h3>
        <p className="mt-1 text-sm text-slate-500">NIK {booking.nik || "-"}</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Waktu</p>
        <p className="mt-1 text-sm font-bold text-[#12385d] lg:mt-0">
          {formatTime(booking.jam_slot)}
        </p>
      </div>

      <VisitStatus className="hidden lg:inline-flex" status={booking.status_booking} />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <Link
          to="/doctor/patients"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-sm font-semibold text-[#0a4778] transition hover:bg-sky-100"
        >
          <ClipboardPlus className="h-4 w-4" />
          Rekam medis
        </Link>
        <button
          type="button"
          onClick={() => onComplete(booking)}
          disabled={!canComplete}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#073e69] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#052f50] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <CheckCircle2 className="h-4 w-4" />
          Selesaikan
        </button>
      </div>
    </article>
  );
}

function ScheduleSummary({ counts, total, nextBooking, doctorSchedule }) {
  return (
    <aside className="space-y-6">
      <section className="surface-lift rounded-xl bg-[#073e69] p-5 text-white shadow-sm">
        <h2 className="text-base font-semibold">Antrean aktif</h2>
        {nextBooking ? (
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-lg font-bold ring-1 ring-white/20">
                {nextBooking.nomor_antrean}
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold">{nextBooking.pasien_nama}</p>
                <p className="mt-1 text-sm font-medium text-sky-100">
                  Pukul {formatTime(nextBooking.jam_slot)}
                </p>
              </div>
            </div>
            <Link
              to="/doctor/patients"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#58b9f6] px-4 py-3 text-sm font-semibold text-[#06385f] transition hover:bg-[#79c8fa]"
            >
              <UserRound className="h-4 w-4" />
              Buka detail pasien
            </Link>
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-white/10 p-4 text-sm leading-6 text-sky-50">
            Tidak ada pasien menunggu pada filter ini.
          </p>
        )}
      </section>

      <section className="surface-lift rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[#12385d]">Ringkasan jadwal</h2>
        <div className="mt-4 grid gap-3">
          <SummaryRow icon={CalendarClock} label="Total booking" value={total} />
          <SummaryRow icon={Clock3} label="Menunggu" value={counts.pending} />
          <SummaryRow icon={CheckCircle2} label="Selesai" value={counts.done} />
          <SummaryRow icon={CalendarX} label="Dibatalkan" value={counts.cancelled} />
        </div>
      </section>

      <section className="surface-lift rounded-xl border border-sky-100 bg-sky-50/70 p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#12385d]">
          <Stethoscope className="h-5 w-5 text-[#0a4778]" />
          Pola praktik
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {doctorSchedule || "Jadwal praktik belum tersedia di profil dokter."}
        </p>
      </section>
    </aside>
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

function VisitStatus({ status, className = "" }) {
  return (
    <span
      className={`items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        statusStyles[status] || "bg-slate-100 text-slate-700 ring-slate-200"
      } ${className || "inline-flex"}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel[status] || status}
    </span>
  );
}

function SummaryRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-3">
      <span className="flex items-center gap-3 text-sm font-semibold text-slate-600">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-[#0a4778]">
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </span>
      <span className="text-lg font-bold text-[#12385d]">{value}</span>
    </div>
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
