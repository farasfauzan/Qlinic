import {
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronDown,
  Clock3,
  HeartPulse,
  Info as InfoCircle,
  LogOut,
  MapPin,
  Menu,
  Search,
  SlidersHorizontal,
  Star,
  Stethoscope,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { Modal } from "../../components/Modal";
import { EmptyState, LoadingState } from "../../components/States";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { formatDate, formatTime, timeSlots } from "../../utils";

const navItems = [
  { label: "Dashboard", path: "/patient/dashboard" },
  { label: "Cari Dokter", path: "/patient/find-doctor" },
  { label: "Janji Temu", path: "/patient/appointments" },
  { label: "Rekam Medis", path: "/patient/medical-records" }
];

const availabilityOptions = ["Semua", "Hari Ini", "Besok", "Minggu Ini"];
const sortOptions = [
  { label: "Direkomendasikan", value: "recommended" },
  { label: "Rating tertinggi", value: "rating" },
  { label: "Pengalaman", value: "experience" },
  { label: "Nama A-Z", value: "name" }
];

export default function PatientFindDoctor() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [polyclinics, setPolyclinics] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPoli, setSelectedPoli] = useState("");
  const [availability, setAvailability] = useState("Semua");
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("recommended");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [doctorResponse, poliResponse] = await Promise.all([
          api.get("/dokter"),
          api.get("/poliklinik")
        ]);
        setDoctors(doctorResponse.data);
        setPolyclinics(poliResponse.data);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const enrichedDoctors = useMemo(
    () => doctors.map((doctor, index) => ({ ...doctor, ui: doctorUiMeta(index, doctor) })),
    [doctors]
  );

  const filteredDoctors = useMemo(() => {
    return enrichedDoctors
      .filter((doctor) => {
        const keyword = `${doctor.nama} ${doctor.spesialisasi} ${doctor.nama_poli || ""}`.toLowerCase();
        const matchesSearch = keyword.includes(search.toLowerCase());
        const matchesPoli = selectedPoli ? String(doctor.id_poli) === selectedPoli : true;
        const matchesRating = doctor.ui.rating >= minRating;
        const schedule = (doctor.ui.nextSchedule || "").toLowerCase();
        const matchesAvailability =
          availability === "Semua" ||
          availability === "Minggu Ini" ||
          schedule.includes(availability.toLowerCase());
        return matchesSearch && matchesPoli && matchesRating && matchesAvailability;
      })
      .sort((a, b) => {
        if (sortBy === "rating") return b.ui.rating - a.ui.rating;
        if (sortBy === "experience") return b.ui.experience - a.ui.experience;
        if (sortBy === "name") return a.nama.localeCompare(b.nama);
        return b.ui.score - a.ui.score;
      });
  }, [availability, enrichedDoctors, minRating, search, selectedPoli, sortBy]);

  function handleLogout() {
    setConfirmLogoutOpen(true);
  }

  function confirmLogout() {
    logout();
    navigate("/login");
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
        <PageHeader total={filteredDoctors.length} />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
          <SearchToolbar
            search={search}
            setSearch={setSearch}
            selectedPoli={selectedPoli}
            setSelectedPoli={setSelectedPoli}
            polyclinics={polyclinics}
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
            <FilterPanel
              polyclinics={polyclinics}
              selectedPoli={selectedPoli}
              setSelectedPoli={setSelectedPoli}
              availability={availability}
              setAvailability={setAvailability}
              minRating={minRating}
              setMinRating={setMinRating}
            />

            <section className="min-w-0">
              <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {loading ? "Memuat dokter..." : `${filteredDoctors.length} dokter tersedia`}
                </p>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  Urutkan
                  <span className="relative">
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-semibold text-[#12385d] outline-none focus:border-[#0a4778] focus:ring-2 focus:ring-sky-100"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </span>
                </label>
              </div>

              {loading ? (
                <LoadingState />
              ) : filteredDoctors.length ? (
                <div className="content-stagger grid gap-4 xl:grid-cols-2">
                  {filteredDoctors.map((doctor, index) => (
                    <DoctorCard
                      key={doctor.id}
                      doctor={doctor}
                      variant={index}
                      onBook={() => setSelectedDoctor(doctor)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                  <EmptyState title="Dokter tidak ditemukan" description="Coba ubah kata kunci, poliklinik, atau rating minimum." />
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />

      {selectedDoctor ? (
        <BookingModal doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />
      ) : null}

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

function PageHeader({ total }) {
  return (
    <section className="page-enter bg-[#0a4778] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 sm:flex-row sm:items-end sm:justify-between lg:px-10">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">
            Temukan Dokter
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-100">
            Cari dokter, pilih jadwal, lalu buat janji temu dalam satu alur.
          </p>
        </div>
        <div className="w-fit rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-sky-50 ring-1 ring-white/15">
          {total} hasil
        </div>
      </div>
    </section>
  );
}

function SearchToolbar({ search, setSearch, selectedPoli, setSelectedPoli, polyclinics }) {
  return (
    <section className="surface-lift rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-[#12385d] outline-none transition placeholder:text-slate-400 focus:border-[#0a4778] focus:bg-white focus:ring-2 focus:ring-sky-100"
            placeholder="Cari nama dokter, spesialisasi, atau klinik"
          />
        </label>

        <label className="relative block">
          <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <select
            value={selectedPoli}
            onChange={(event) => setSelectedPoli(event.target.value)}
            className="h-12 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 pl-12 pr-10 text-sm font-semibold text-[#12385d] outline-none transition focus:border-[#0a4778] focus:bg-white focus:ring-2 focus:ring-sky-100"
          >
            <option value="">Semua Poliklinik</option>
            {polyclinics.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nama_poli}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </label>

      </div>
    </section>
  );
}

function FilterPanel({
  polyclinics,
  selectedPoli,
  setSelectedPoli,
  availability,
  setAvailability,
  minRating,
  setMinRating
}) {
  return (
    <aside className="surface-lift h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold text-[#12385d]">
          <SlidersHorizontal className="h-5 w-5 text-[#0a4778]" />
          Filter
        </h2>
        <button
          type="button"
          onClick={() => {
            setSelectedPoli("");
            setMinRating(0);
            setAvailability("Semua");
          }}
          className="text-sm font-semibold text-[#0a4778] hover:text-[#052f50]"
        >
          Reset
        </button>
      </div>

      <FilterGroup title="Poliklinik">
        <FilterOption checked={!selectedPoli} label="Semua Poliklinik" onChange={() => setSelectedPoli("")} />
        {polyclinics.slice(0, 5).map((item) => (
          <FilterOption
            key={item.id}
            checked={selectedPoli === String(item.id)}
            label={item.nama_poli}
            onChange={() => setSelectedPoli(String(item.id))}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Ketersediaan">
        <div className="flex flex-wrap gap-2">
          {availabilityOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setAvailability(option)}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                availability === option
                  ? "bg-[#073e69] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Rating Minimum">
        {[4.5, 4.0].map((rating) => (
          <FilterOption
            key={rating}
            checked={minRating === rating}
            label={`${rating.toFixed(1)}+`}
            suffix={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
            onChange={() => setMinRating(minRating === rating ? 0 : rating)}
          />
        ))}
      </FilterGroup>
    </aside>
  );
}

function DoctorCard({ doctor, variant, onBook }) {
  return (
    <article className="surface-lift rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-sky-200 hover:shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row">
        <DoctorAvatar variant={variant} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-[#12385d]">{doctor.nama}</h2>
              <p className="mt-1 text-sm font-semibold text-[#0d78b7]">{doctor.spesialisasi}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-semibold text-[#12385d]">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {doctor.ui.rating.toFixed(1)}
            </span>
          </div>

          <div className="mt-4 grid gap-2 text-sm text-slate-500">
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{doctor.nama_poli || "Qlinic Pusat"}</span>
            </p>
            <p className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 shrink-0 text-slate-400" />
              {doctor.ui.experience} tahun pengalaman
            </p>
            <p className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
              {doctor.jadwal_praktik || doctor.ui.nextSchedule}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Jadwal Terdekat</p>
          <p className="mt-1 text-sm font-semibold text-[#12385d]">{doctor.ui.nextSchedule}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBook}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#073e69] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#052f50]"
          >
            <CalendarPlus className="h-4 w-4" />
            Pilih Jadwal
          </button>
        </div>
      </div>
    </article>
  );
}

function BookingModal({ doctor, onClose }) {
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const availableSlots = timeSlots.slice(0, 6);
  const disabledSlots = new Set([availableSlots[availableSlots.length - 1]]);
  const [tanggal, setTanggal] = useState(dateOptions[1]?.value || toInputDateLocal(new Date()));
  const [jamSlot, setJamSlot] = useState(availableSlots.find((slot) => !disabledSlots.has(slot)) || timeSlots[0]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmBookingOpen, setConfirmBookingOpen] = useState(false);

  async function confirmBooking() {
    setLoading(true);
    try {
      const response = await api.post("/booking", {
        id_dokter: doctor.id,
        tanggal_kunjungan: tanggal,
        jam_slot: jamSlot
      });
      setResult(response.data);
      setConfirmBookingOpen(false);
      toast.success("Booking berhasil dibuat");
    } catch (error) {
      toast.error(error.message || "Booking gagal");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    setConfirmBookingOpen(true);
  }

  return (
    <Modal title="Pilih Jadwal" onClose={onClose}>
      {result ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Janji temu berhasil</p>
                <h3 className="mt-1 text-2xl font-semibold text-navy">Antrean #{result.nomor_antrean}</h3>
              </div>
              <StatusBadge status={result.status_booking} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Dokter" value={result.dokter_nama} />
            <Info label="Tanggal" value={formatDate(result.tanggal_kunjungan)} />
            <Info label="Jam" value={formatTime(result.jam_slot)} />
            <Info label="Poliklinik" value={result.nama_poli || "-"} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-[#0a4778] transition hover:bg-sky-50"
            >
              Tutup
            </button>
            <Link
              to="/patient/appointments"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg bg-[#073e69] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#052f50]"
            >
              Lihat Appointment
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex gap-3 rounded-xl bg-sky-50 p-4">
            <DoctorAvatar variant={0} />
            <div className="min-w-0">
              <p className="font-semibold text-[#12385d]">{doctor.nama}</p>
              <p className="mt-1 text-sm font-medium text-[#0d78b7]">{doctor.spesialisasi}</p>
              <p className="mt-2 text-sm text-slate-500">{doctor.jadwal_praktik || doctor.ui?.nextSchedule}</p>
            </div>
          </div>

          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#12385d]">
              <CalendarDays className="h-4 w-4 text-[#0a4778]" />
              Pilih Hari
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {dateOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setTanggal(option.value)}
                  className={`rounded-lg border px-3 py-3 text-center text-sm transition ${
                    tanggal === option.value
                      ? "border-[#0a4778] bg-[#58b9f6] text-[#06385f] shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-sky-50"
                  }`}
                >
                  <span className="block text-xs font-medium">{option.day}</span>
                  <span className="mt-1 block text-base font-semibold">{option.date}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#12385d]">
              <Clock3 className="h-4 w-4 text-[#0a4778]" />
              Pilih Jam
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {availableSlots.map((slot) => {
                const disabled = disabledSlots.has(slot);
                return (
                <button
                  type="button"
                  key={slot}
                  disabled={disabled}
                  onClick={() => setJamSlot(slot)}
                  className={`rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                    disabled
                      ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                      : 
                    jamSlot === slot
                      ? "border-[#073e69] bg-[#073e69] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-sky-50"
                  }`}
                >
                  {disabled ? "Penuh" : `${slot} - ${addOneHour(slot)}`}
                </button>
              );
              })}
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-sky-100 bg-sky-50/80 p-4 text-[#12385d]">
            <InfoCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#0a4778]" />
            <div>
              <p className="text-sm font-semibold">Informasi penting</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Datang 10 menit lebih awal dan siapkan kartu identitas untuk proses administrasi.
              </p>
            </div>
          </div>

          <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
          <button
            type="submit"
            disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#073e69] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#052f50] disabled:opacity-70"
          >
            <CalendarPlus className="h-5 w-5" />
              {loading ? "Mengecek slot..." : "Konfirmasi Jadwal"}
          </button>
          </div>
        </form>
      )}

      {confirmBookingOpen ? (
        <ConfirmDialog
          title="Konfirmasi jadwal janji temu?"
          description="Periksa kembali dokter, tanggal, dan jam. Setelah dikonfirmasi, nomor antrean akan dibuat untuk jadwal ini."
          details={[
            { label: "Dokter", value: doctor.nama },
            { label: "Poliklinik", value: doctor.nama_poli || "Qlinic Pusat" },
            { label: "Jadwal", value: `${formatDate(tanggal)} pukul ${jamSlot}` }
          ]}
          confirmLabel="Ya, buat janji"
          cancelLabel="Periksa lagi"
          tone="info"
          loading={loading}
          onConfirm={confirmBooking}
          onCancel={() => setConfirmBookingOpen(false)}
        />
      ) : null}
    </Modal>
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

function FilterGroup({ title, children }) {
  return (
    <div className="border-t border-slate-100 pt-5 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function FilterOption({ checked, label, suffix, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
      <span className="flex min-w-0 items-center gap-3">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
            checked ? "border-[#0a4778] bg-[#0a4778] text-white" : "border-slate-300 bg-white"
          }`}
        >
          {checked ? <Check className="h-3 w-3" /> : null}
        </span>
        <span className="truncate">{label}</span>
      </span>
      {suffix ? <span className="shrink-0">{suffix}</span> : null}
    </label>
  );
}

function DoctorAvatar({ variant }) {
  const tones = [
    "bg-sky-50 text-[#0a4778]",
    "bg-emerald-50 text-emerald-700",
    "bg-cyan-50 text-cyan-700",
    "bg-slate-100 text-slate-600"
  ];

  return (
    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${tones[variant % tones.length]}`}>
      <Stethoscope className="h-8 w-8" />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-navy">{value}</p>
    </div>
  );
}

function doctorUiMeta(index, doctor) {
  const schedules = ["Hari ini, 09:00", "Hari ini, 14:30", "Besok, 08:00", "Besok, 16:00"];
  const rating = [4.9, 4.8, 5.0, 4.7][index % 4];
  const experience = [12, 8, 15, 6][index % 4];

  return {
    rating,
    experience,
    nextSchedule: doctor.jadwal_praktik || schedules[index % schedules.length],
    score: rating * 10 + experience
  };
}

function buildDateOptions() {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      value: toInputDateLocal(date),
      day: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date),
      date: new Intl.DateTimeFormat("id-ID", { day: "2-digit" }).format(date)
    };
  });
}

function toInputDateLocal(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addOneHour(value) {
  const [hour, minute] = value.split(":").map(Number);
  return `${String(hour + 1).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
