import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardPlus,
  Clock3,
  HeartPulse,
  LogOut,
  Menu,
  Pill,
  RefreshCcw,
  Save,
  Search,
  Stethoscope,
  UserRound,
  Users,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Modal } from "../../components/Modal";
import { EmptyState, LoadingState } from "../../components/States";
import { useAuth } from "../../context/AuthContext";
import { formatDate, formatTime } from "../../utils";

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

export default function DoctorPatients() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [quickBookingId, setQuickBookingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  async function loadBookings() {
    setLoading(true);
    try {
      const response = await api.get("/dokter/me/bookings");
      setBookings(response.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort((a, b) => {
        const aDate = bookingDateTime(a);
        const bDate = bookingDateTime(b);
        if (a.status_booking === "Pending" && b.status_booking !== "Pending") return -1;
        if (a.status_booking !== "Pending" && b.status_booking === "Pending") return 1;
        return aDate - bDate;
      }),
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return sortedBookings.filter((booking) => {
      const matchesStatus = status ? booking.status_booking === status : true;
      const searchable = [booking.pasien_nama, booking.nik, booking.nomor_antrean]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = keyword ? searchable.includes(keyword) : true;
      return matchesStatus && matchesSearch;
    });
  }, [search, sortedBookings, status]);

  const counts = useMemo(
    () => ({
      total: bookings.length,
      pending: bookings.filter((booking) => booking.status_booking === "Pending").length,
      done: bookings.filter((booking) => booking.status_booking === "Done").length,
      cancelled: bookings.filter((booking) => booking.status_booking === "Cancelled").length
    }),
    [bookings]
  );

  useEffect(() => {
    if (!filteredBookings.length) {
      setQuickBookingId(null);
      return;
    }

    const stillVisible = filteredBookings.some((booking) => booking.id === quickBookingId);
    if (!quickBookingId || !stillVisible) {
      setQuickBookingId(filteredBookings[0].id);
    }
  }, [filteredBookings, quickBookingId]);

  const quickBooking =
    filteredBookings.find((booking) => booking.id === quickBookingId) || filteredBookings[0];

  function confirmLogout() {
    logout();
    navigate("/login");
  }

  function resetFilters() {
    setSearch("");
    setStatus("");
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
        <PageHeader total={counts.total} pending={counts.pending} done={counts.done} />

        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-10">
          <div className="content-stagger space-y-6">
            <PatientsStats counts={counts} />

            <PatientsToolbar
              search={search}
              status={status}
              shown={filteredBookings.length}
              total={bookings.length}
              loading={loading}
              onSearch={setSearch}
              onStatusChange={setStatus}
              onRefresh={loadBookings}
            />

            {loading ? (
              <LoadingState />
            ) : bookings.length ? (
              <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                <PatientsList
                  bookings={filteredBookings}
                  quickBookingId={quickBookingId}
                  onSelect={setQuickBookingId}
                  onRecord={setSelectedBooking}
                  onReset={resetFilters}
                />
                <QuickView booking={quickBooking} onRecord={setSelectedBooking} />
              </div>
            ) : (
              <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                <EmptyState
                  title="Belum ada pasien booking"
                  description="Pasien yang membuat booking dengan Anda akan tampil di halaman ini."
                />
                <div className="mt-4 flex justify-center">
                  <Link
                    to="/doctor/schedule"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#073e69] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#052f50]"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Lihat jadwal
                  </Link>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {selectedBooking ? (
        <MedicalRecordModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onSaved={loadBookings}
        />
      ) : null}

      {confirmLogoutOpen ? (
        <ConfirmDialog
          title="Keluar dari portal dokter?"
          description="Sesi Anda akan ditutup. Pastikan rekam medis yang sedang dikerjakan sudah disimpan sebelum keluar."
          confirmLabel="Ya, keluar"
          cancelLabel="Tetap di pasien"
          tone="warning"
          onConfirm={confirmLogout}
          onCancel={() => setConfirmLogoutOpen(false)}
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

function PageHeader({ total, pending, done }) {
  return (
    <section className="page-enter bg-[#0a4778] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div>
          <p className="text-sm font-semibold text-sky-100">Daftar pasien</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal sm:text-4xl">
            Pasien Booking
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-100">
            Cari pasien, cek status kunjungan, lalu isi rekam medis dari alur yang singkat.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <HeaderPill icon={Users} label={`${total} pasien`} />
          <HeaderPill icon={Clock3} label={`${pending} menunggu`} />
          <HeaderPill icon={CheckCircle2} label={`${done} selesai`} />
        </div>
      </div>
    </section>
  );
}

function PatientsStats({ counts }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <MetricCard icon={Users} label="Total pasien" value={counts.total} hint="Semua booking dokter" />
      <MetricCard icon={Clock3} label="Menunggu" value={counts.pending} hint="Perlu pemeriksaan" />
      <MetricCard icon={CheckCircle2} label="Selesai" value={counts.done} hint="Kunjungan selesai" />
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <article className="surface-lift rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-[#12385d]">{value}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-[#0a4778] ring-1 ring-sky-100">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-slate-500">{hint}</p>
    </article>
  );
}

function PatientsToolbar({
  search,
  status,
  shown,
  total,
  loading,
  onSearch,
  onStatusChange,
  onRefresh
}) {
  return (
    <section className="surface-lift rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cari pasien
          </span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-[#12385d] outline-none transition placeholder:text-slate-400 focus:border-[#0a4778] focus:bg-white focus:ring-2 focus:ring-sky-100"
              placeholder="Cari nama pasien, NIK, atau nomor antrean"
            />
          </span>
        </label>

        <div className="flex flex-col gap-3 lg:min-w-[520px]">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
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
      </div>

      <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-500">
          Menampilkan {shown} dari {total} pasien
        </p>
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
    </section>
  );
}

function PatientsList({ bookings, quickBookingId, onSelect, onRecord, onReset }) {
  if (!bookings.length) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <EmptyState
          title="Pasien tidak ditemukan"
          description="Coba ubah kata kunci atau filter status."
        />
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#073e69] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#052f50]"
          >
            Reset filter
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#12385d]">Daftar pasien booking</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pilih detail pasien atau langsung isi rekam medis.
          </p>
        </div>
        <Link
          to="/doctor/schedule"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0a4778] transition hover:bg-sky-50"
        >
          <CalendarDays className="h-4 w-4" />
          Lihat jadwal
        </Link>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
        <div className="hidden grid-cols-[100px_1fr_160px_140px_170px] gap-4 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 lg:grid">
          <span>Antrean</span>
          <span>Pasien</span>
          <span>Jadwal</span>
          <span>Status</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="divide-y divide-slate-100">
          {bookings.map((booking) => (
            <PatientRow
              key={booking.id}
              booking={booking}
              active={booking.id === quickBookingId}
              onSelect={() => onSelect(booking.id)}
              onRecord={() => onRecord(booking)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PatientRow({ booking, active, onSelect, onRecord }) {
  const canRecord = booking.status_booking === "Pending";

  return (
    <article
      className={`grid gap-4 p-4 transition lg:grid-cols-[100px_1fr_160px_140px_170px] lg:items-center ${
        active ? "bg-sky-50/80" : "bg-white hover:bg-sky-50/40"
      }`}
    >
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
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 lg:hidden">Jadwal</p>
        <p className="mt-1 text-sm font-bold text-[#12385d] lg:mt-0">
          {formatDate(booking.tanggal_kunjungan)}
        </p>
        <p className="mt-0.5 text-sm font-medium text-slate-500">{formatTime(booking.jam_slot)}</p>
      </div>

      <VisitStatus className="hidden lg:inline-flex" status={booking.status_booking} />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <button
          type="button"
          onClick={onSelect}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#0a4778] transition hover:bg-sky-50"
        >
          <UserRound className="h-4 w-4" />
          Detail
        </button>
        <button
          type="button"
          onClick={onRecord}
          disabled={!canRecord}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#073e69] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#052f50] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <ClipboardPlus className="h-4 w-4" />
          Rekam medis
        </button>
      </div>
    </article>
  );
}

function QuickView({ booking, onRecord }) {
  if (!booking) {
    return (
      <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <EmptyState title="Pilih pasien" description="Detail pasien akan tampil di sini." />
      </aside>
    );
  }

  const canRecord = booking.status_booking === "Pending";

  return (
    <aside className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-[#073e69] p-5 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <UserRound className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sky-100">Quick view</p>
              <h2 className="truncate text-lg font-bold">{booking.pasien_nama}</h2>
              <p className="mt-1 text-sm font-medium text-sky-100">
                Antrean #{booking.nomor_antrean}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="grid gap-3">
            <InfoRow label="NIK" value={booking.nik || "-"} />
            <InfoRow label="Tanggal" value={formatDate(booking.tanggal_kunjungan)} />
            <InfoRow label="Waktu" value={formatTime(booking.jam_slot)} />
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-3">
              <span className="text-sm font-semibold text-slate-500">Status</span>
              <VisitStatus status={booking.status_booking} />
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-sky-100 bg-sky-50/80 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Catatan booking</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Keluhan utama belum tersedia di data booking. Lengkapi saat mengisi rekam medis.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onRecord(booking)}
            disabled={!canRecord}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#073e69] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#052f50] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <ClipboardPlus className="h-4 w-4" />
            Isi rekam medis
          </button>
        </div>
      </section>

      <section className="surface-lift rounded-xl border border-sky-100 bg-sky-50/70 p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#12385d]">
          <Stethoscope className="h-5 w-5 text-[#0a4778]" />
          Alur pemeriksaan
        </h2>
        <div className="mt-4 space-y-3 text-sm font-medium leading-6 text-slate-600">
          <ChecklistItem text="Konfirmasi identitas pasien." />
          <ChecklistItem text="Isi keluhan, diagnosis, dan catatan klinis." />
          <ChecklistItem text="Simpan rekam medis setelah seluruh data benar." />
        </div>
      </section>
    </aside>
  );
}

function MedicalRecordModal({ booking, onClose, onSaved }) {
  const [form, setForm] = useState({
    keluhan: "",
    diagnosa: "",
    catatan_dokter: "",
    detail_obat: "",
    dosis: ""
  });
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setConfirmOpen(true);
  }

  async function saveRecord() {
    setLoading(true);
    try {
      await api.post("/rekam-medis", {
        id_booking: booking.id,
        keluhan: form.keluhan.trim(),
        diagnosa: form.diagnosa.trim(),
        catatan_dokter: form.catatan_dokter.trim(),
        resep_obat: form.detail_obat.trim()
          ? [{ detail_obat: form.detail_obat.trim(), dosis: form.dosis.trim() || "-" }]
          : []
      });
      toast.success("Rekam medis berhasil disimpan");
      setConfirmOpen(false);
      await onSaved();
      onClose();
    } catch (error) {
      toast.error(error.message || "Gagal menyimpan rekam medis");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={`Rekam medis ${booking.pasien_nama}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-sky-100 bg-sky-50/80 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-[#12385d]">{booking.pasien_nama}</p>
              <p className="mt-1 text-sm font-medium text-slate-600">NIK {booking.nik || "-"}</p>
            </div>
            <div className="rounded-lg bg-white px-4 py-3 text-center ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Antrean</p>
              <p className="mt-1 text-xl font-bold text-[#12385d]">#{booking.nomor_antrean}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Info label="Tanggal" value={formatDate(booking.tanggal_kunjungan)} />
            <Info label="Jam" value={formatTime(booking.jam_slot)} />
          </div>
        </div>

        <section className="grid gap-4">
          <FormTextarea
            label="Keluhan pasien"
            value={form.keluhan}
            onChange={(value) => updateField("keluhan", value)}
            placeholder="Tuliskan keluhan utama dan durasi keluhan pasien."
            required
          />
          <FormTextarea
            label="Diagnosis"
            value={form.diagnosa}
            onChange={(value) => updateField("diagnosa", value)}
            placeholder="Tuliskan diagnosis kerja atau diagnosis akhir."
            required
          />
          <FormTextarea
            label="Catatan dokter"
            value={form.catatan_dokter}
            onChange={(value) => updateField("catatan_dokter", value)}
            placeholder="Tuliskan temuan pemeriksaan, edukasi, atau rencana kontrol."
            required
          />
        </section>

        <section className="rounded-xl border border-slate-200 p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#12385d]">
            <Pill className="h-4 w-4 text-[#0a4778]" />
            Resep obat opsional
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Detail obat</span>
              <input
                value={form.detail_obat}
                onChange={(event) => updateField("detail_obat", event.target.value)}
                className="mt-1 h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-[#12385d] outline-none transition placeholder:text-slate-400 focus:border-[#0a4778] focus:bg-white focus:ring-2 focus:ring-sky-100"
                placeholder="Contoh: Amoxicillin 500mg"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Dosis</span>
              <input
                value={form.dosis}
                onChange={(event) => updateField("dosis", event.target.value)}
                className="mt-1 h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-[#12385d] outline-none transition placeholder:text-slate-400 focus:border-[#0a4778] focus:bg-white focus:ring-2 focus:ring-sky-100"
                placeholder="Contoh: 3x sehari setelah makan"
              />
            </label>
          </div>
        </section>

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Menyimpan rekam medis akan menyelesaikan booking pasien ini. Periksa kembali data sebelum konfirmasi.
        </div>

        <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#073e69] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#052f50] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save className="h-5 w-5" />
            {loading ? "Menyimpan..." : "Simpan rekam medis"}
          </button>
        </div>
      </form>

      {confirmOpen ? (
        <ConfirmDialog
          title="Simpan rekam medis pasien?"
          description="Data rekam medis akan disimpan dan status booking pasien akan berubah menjadi selesai. Pastikan keluhan, diagnosis, dan catatan dokter sudah benar."
          details={[
            { label: "Pasien", value: booking.pasien_nama },
            {
              label: "Jadwal",
              value: `${formatDate(booking.tanggal_kunjungan)} pukul ${formatTime(booking.jam_slot)}`
            },
            { label: "Diagnosis", value: form.diagnosa.trim() || "-" }
          ]}
          confirmLabel="Ya, simpan"
          cancelLabel="Periksa lagi"
          tone="info"
          loading={loading}
          onConfirm={saveRecord}
          onCancel={() => setConfirmOpen(false)}
        />
      ) : null}
    </Modal>
  );
}

function FormTextarea({ label, value, onChange, placeholder, required = false }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-500" aria-label="wajib diisi">*</span> : null}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-24 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-[#12385d] outline-none transition placeholder:text-slate-400 focus:border-[#0a4778] focus:bg-white focus:ring-2 focus:ring-sky-100"
        placeholder={placeholder}
        required={required}
      />
    </label>
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

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-3">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-right text-sm font-bold text-[#12385d]">{value}</span>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg bg-white px-4 py-3 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-[#12385d]">{value}</p>
    </div>
  );
}

function ChecklistItem({ text }) {
  return (
    <p className="flex gap-3">
      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#0a4778]" />
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
