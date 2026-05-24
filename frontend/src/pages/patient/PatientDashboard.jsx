import {
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  HelpCircle,
  MapPin,
  Navigation,
  Phone,
  Pill,
  Search,
  Stethoscope
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { EmptyState, LoadingState } from "../../components/States";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { PatientLayout } from "../../layouts/PatientLayout";
import { formatDate, formatTime } from "../../utils";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [bookingResponse, recordResponse] = await Promise.all([
          api.get("/pasien/bookings"),
          api.get("/pasien/medical-records")
        ]);
        setBookings(bookingResponse.data);
        setRecords(recordResponse.data);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status_booking === "Pending"),
    [bookings]
  );

  const upcoming = useMemo(
    () => [...pendingBookings].sort((a, b) => bookingDateTime(a) - bookingDateTime(b))[0],
    [pendingBookings]
  );

  const latestRecord = useMemo(
    () =>
      [...records].sort(
        (a, b) => new Date(b.tanggal_periksa || 0) - new Date(a.tanggal_periksa || 0)
      )[0],
    [records]
  );

  return (
    <PatientLayout>
      <main>
        <HeroBanner userName={firstName(user?.nama)} />

        {loading ? (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
            <LoadingState />
          </div>
        ) : (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="content-stagger space-y-6">
                <UpcomingAppointmentCard upcoming={upcoming} />
                <LatestRecordCard record={latestRecord} />
              </div>

              <aside className="content-stagger space-y-6">
                <ClinicInfoCard />
                <TipCard />
                <MapPreview />
              </aside>
            </div>
          </div>
        )}
      </main>
    </PatientLayout>
  );
}

function HeroBanner({ userName }) {
  return (
    <section className="page-enter bg-[#0a4778] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-9 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div>
          <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">
            Halo, {userName}!
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-100">
            Pantau janji temu, nomor antrean, dan rekam medis terbaru tanpa banyak langkah.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/patient/find-doctor"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#58b9f6] px-5 py-3 text-sm font-semibold text-[#06385f] shadow-sm transition hover:bg-[#79c8fa]"
          >
            <Search className="h-4 w-4" />
            Buat Janji
          </Link>
          <Link
            to="/patient/appointments"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <CalendarDays className="h-4 w-4" />
            Appointment
          </Link>
        </div>
      </div>
    </section>
  );
}

function UpcomingAppointmentCard({ upcoming }) {
  return (
    <section className="surface-lift rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader
        icon={CalendarDays}
        title="Janji temu mendatang"
        actionLabel="Lihat semua"
        actionTo="/patient/appointments"
      />

      {upcoming ? (
        <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50/70 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <DoctorAvatar />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-[#12385d]">{upcoming.dokter_nama}</h3>
                  <StatusBadge status={upcoming.status_booking} />
                </div>
                <p className="mt-1 text-sm font-semibold text-[#0a4778]">{upcoming.spesialisasi || "Dokter Umum"}</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <InfoInline icon={Clock3} text={`${formatDate(upcoming.tanggal_kunjungan)} pukul ${formatTime(upcoming.jam_slot)}`} />
                  <InfoInline icon={MapPin} text={upcoming.nama_poli || "Qlinic Pusat"} />
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white px-4 py-3 text-center ring-1 ring-slate-200 md:min-w-24">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Antrean</p>
              <p className="mt-1 text-xl font-bold text-[#12385d]">#{upcoming.nomor_antrean}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <EmptyState
            title="Belum ada janji aktif"
            description="Cari dokter dan buat appointment sesuai jadwal praktik."
          />
          <div className="mt-4 flex justify-center">
            <Link
              to="/patient/find-doctor"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#073e69] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#052f50]"
            >
              <Search className="h-4 w-4" />
              Cari Dokter
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

function LatestRecordCard({ record }) {
  const prescriptions = record?.resep_obat?.length || 0;

  return (
    <section className="surface-lift rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader
        icon={FileText}
        title="Rekam medis terakhir"
        actionLabel="Buka riwayat"
        actionTo="/patient/medical-records"
      />

      {record ? (
        <article className="mt-5 rounded-xl border border-slate-200 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#0a4778]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-[#12385d]">{record.diagnosa || "Pemeriksaan kesehatan"}</h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  {record.catatan_dokter || record.keluhan || "Catatan pemeriksaan belum tersedia."}
                </p>
              </div>
            </div>
            <time className="shrink-0 text-sm font-semibold text-slate-500">
              {formatDate(record.tanggal_periksa)}
            </time>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <RecordBadge icon={Pill} label={`${prescriptions} resep`} />
            <RecordBadge icon={FileText} label="Detail tersedia" />
          </div>
        </article>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <EmptyState
            title="Rekam medis kosong"
            description="Data akan muncul setelah pemeriksaan selesai."
          />
        </div>
      )}
    </section>
  );
}

function ClinicInfoCard() {
  return (
    <section className="surface-lift rounded-xl bg-[#073e69] p-5 text-white shadow-sm">
      <h2 className="text-base font-semibold">Info klinik</h2>
      <div className="mt-4 space-y-4">
        <InfoRow icon={MapPin} label="Alamat" value="Jl. Sudirman No. 45, Jakarta Selatan" />
        <InfoRow icon={Phone} label="Kontak 24/7" value="(021) 555-0123" />
        <InfoRow icon={Clock3} label="Operasional" value="Setiap hari, 07:00 - 22:00" />
      </div>
    </section>
  );
}

function TipCard() {
  return (
    <section className="surface-lift rounded-xl border border-orange-100 bg-[#fff8f3] p-5 text-[#7a4b2c] shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <HelpCircle className="h-5 w-5" />
        Tips sehat hari ini
      </h2>
      <p className="mt-3 text-sm leading-6">
        Minum air yang cukup dan siapkan dokumen kesehatan sebelum datang ke klinik agar proses kunjungan lebih lancar.
      </p>
    </section>
  );
}

function MapPreview() {
  return (
    <section className="surface-lift relative min-h-44 overflow-hidden rounded-xl bg-[#1b7a89] shadow-sm">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_25%,transparent_25%),linear-gradient(225deg,rgba(255,255,255,0.18)_25%,transparent_25%),linear-gradient(45deg,rgba(255,255,255,0.18)_25%,transparent_25%),linear-gradient(315deg,rgba(255,255,255,0.18)_25%,#1b7a89_25%)] bg-[length:54px_54px] bg-[position:27px_0,27px_0,0_0,0_0]" />
      <div className="absolute inset-x-0 top-1/2 h-7 -rotate-12 bg-white/70" />
      <div className="absolute bottom-4 left-5 h-14 w-24 rotate-[-12deg] rounded-lg bg-emerald-200/70" />
      <div className="absolute right-5 top-5 h-16 w-20 rotate-[-12deg] rounded-lg bg-sky-100/70" />
      <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0a4778] ring-4 ring-white/80" />
      <div className="relative flex min-h-44 items-center justify-center">
        <Link
          to="/patient/find-doctor"
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0a4778] shadow-lg"
        >
          <Navigation className="h-4 w-4" />
          Petunjuk Arah
        </Link>
      </div>
    </section>
  );
}

function SectionHeader({ icon: Icon, title, actionLabel, actionTo }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-2 text-base font-semibold text-[#12385d]">
        <Icon className="h-5 w-5 text-[#0a4778]" />
        {title}
      </h2>
      <Link to={actionTo} className="inline-flex items-center gap-1 text-sm font-semibold text-[#0a4778] hover:text-[#052f50]">
        {actionLabel}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function DoctorAvatar() {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-[#0a4778] ring-1 ring-sky-100">
      <Stethoscope className="h-7 w-7" />
    </div>
  );
}

function InfoInline({ icon: Icon, text }) {
  return (
    <p className="flex min-w-0 items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      <span className="truncate">{text}</span>
    </p>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
      <div>
        <p className="text-sm font-semibold text-sky-200">{label}</p>
        <p className="mt-0.5 text-sm font-medium leading-5 text-white">{value}</p>
      </div>
    </div>
  );
}

function RecordBadge({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-sm font-semibold text-[#37638a]">
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
}

function firstName(name) {
  return name?.trim().split(/\s+/)[0] || "Pasien";
}

function bookingDateTime(booking) {
  const time = booking.jam_slot ? formatTime(booking.jam_slot) : "00:00";
  return new Date(`${booking.tanggal_kunjungan}T${time}`).getTime();
}
