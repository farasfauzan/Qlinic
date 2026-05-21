import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  HeartPulse,
  LogOut,
  Menu,
  Pill,
  Printer,
  Search,
  Stethoscope,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EmptyState, LoadingState } from "../../components/States";
import { useAuth } from "../../context/AuthContext";
import { formatDate, formatTime } from "../../utils";

const navItems = [
  { label: "Dashboard", path: "/patient/dashboard" },
  { label: "Cari Dokter", path: "/patient/find-doctor" },
  { label: "Janji Temu", path: "/patient/appointments" },
  { label: "Rekam Medis", path: "/patient/medical-records" }
];

const defaultAdvice = [
  "Ikuti instruksi dokter sesuai catatan pemeriksaan.",
  "Minum obat sesuai dosis dan jadwal yang diberikan.",
  "Hubungi klinik jika keluhan memburuk."
];

export default function PatientMedicalRecords() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadRecords() {
      try {
        const response = await api.get("/pasien/medical-records");
        setRecords(response.data);
      } finally {
        setLoading(false);
      }
    }

    loadRecords();
  }, []);

  const sortedRecords = useMemo(
    () =>
      [...records].sort(
        (a, b) => new Date(b.tanggal_periksa || 0) - new Date(a.tanggal_periksa || 0)
      ),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return sortedRecords;

    return sortedRecords.filter((record) =>
      [
        record.dokter_nama,
        record.spesialisasi,
        record.diagnosa,
        record.keluhan,
        record.catatan_dokter
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [search, sortedRecords]);

  useEffect(() => {
    if (!filteredRecords.length) {
      setSelectedId(null);
      return;
    }

    const stillVisible = filteredRecords.some((record) => record.id === selectedId);
    if (!selectedId || !stillVisible) {
      setSelectedId(filteredRecords[0].id);
    }
  }, [filteredRecords, selectedId]);

  const selectedRecord = useMemo(
    () => filteredRecords.find((record) => record.id === selectedId) || filteredRecords[0],
    [filteredRecords, selectedId]
  );

  function handleLogout() {
    setConfirmLogoutOpen(true);
  }

  function confirmLogout() {
    logout();
    navigate("/login");
  }

  function handleDownload() {
    if (!records.length) {
      toast.error("Belum ada riwayat untuk diunduh");
      return;
    }

    setConfirmAction({
      type: "download",
      title: "Download riwayat rekam medis?",
      description: "File berisi data kesehatan pribadi. Simpan hanya di perangkat yang aman dan jangan bagikan sembarangan.",
      confirmLabel: "Ya, download",
      details: [{ label: "Jumlah data", value: `${records.length} rekam medis` }]
    });
  }

  function downloadRecords() {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "qlinic-rekam-medis.json";
    link.click();
    URL.revokeObjectURL(url);
    setConfirmAction(null);
    toast.success("Riwayat berhasil diunduh");
  }

  async function handleShare(record) {
    if (!record) return;

    const text = `${formatDate(record.tanggal_periksa)} - ${record.dokter_nama}: ${
      record.diagnosa || "Rekam medis"
    }`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Ringkasan disalin");
    } catch (_error) {
      toast.error("Gagal menyalin ringkasan");
    }
  }

  async function confirmRecordAction() {
    if (!confirmAction) return;

    if (confirmAction.type === "download") {
      downloadRecords();
      return;
    }

    if (confirmAction.type === "print") {
      setConfirmAction(null);
      window.print();
      return;
    }

    if (confirmAction.type === "share") {
      setActionLoading(true);
      await handleShare(confirmAction.record);
      setActionLoading(false);
      setConfirmAction(null);
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
        <PageHeader total={records.length} onDownload={handleDownload} />

        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-10">
          {loading ? (
            <LoadingState />
          ) : records.length ? (
            <div className="space-y-6">
              <RecordsToolbar
                search={search}
                onSearch={setSearch}
                total={records.length}
                shown={filteredRecords.length}
              />

              <div className="content-stagger grid gap-6 lg:grid-cols-[320px_1fr]">
                <RecordsPanel
                  records={filteredRecords}
                  total={records.length}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />

                <RecordDetail
                  record={selectedRecord}
                  onPrint={() =>
                    setConfirmAction({
                      type: "print",
                      title: "Cetak rekam medis ini?",
                      description: "Pastikan printer atau PDF tujuan aman karena dokumen berisi informasi kesehatan pribadi.",
                      confirmLabel: "Ya, cetak",
                      record: selectedRecord
                    })
                  }
                  onShare={() =>
                    setConfirmAction({
                      type: "share",
                      title: "Salin ringkasan rekam medis?",
                      description: "Ringkasan akan disalin ke clipboard perangkat. Data di clipboard bisa ditempel ke aplikasi lain.",
                      confirmLabel: "Ya, salin",
                      record: selectedRecord
                    })
                  }
                />
              </div>
            </div>
          ) : (
            <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <EmptyState
                title="Belum ada rekam medis"
                description="Riwayat pemeriksaan akan tampil setelah kunjungan selesai."
              />
            </section>
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

      {confirmAction ? (
        <ConfirmDialog
          title={confirmAction.title}
          description={confirmAction.description}
          details={confirmAction.details || buildRecordDetails(confirmAction.record)}
          confirmLabel={confirmAction.confirmLabel}
          cancelLabel="Kembali"
          tone="warning"
          loading={actionLoading}
          onConfirm={confirmRecordAction}
          onCancel={() => setConfirmAction(null)}
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

function PageHeader({ total, onDownload }) {
  return (
    <section className="page-enter bg-[#0a4778] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div>
          <h1 className="text-3xl font-bold tracking-normal">Rekam Medis Saya</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-sky-100">
            Kelola dan tinjau riwayat kesehatan Anda secara transparan.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-sky-50 ring-1 ring-white/15">
            <FileText className="h-4 w-4" />
            {total} rekam medis
          </div>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#58b9f6] px-5 py-3 text-sm font-semibold text-[#06385f] shadow-sm transition hover:bg-[#79c8fa]"
          >
            <Download className="h-4 w-4" />
            Download Riwayat
          </button>
        </div>
      </div>
    </section>
  );
}

function RecordsToolbar({ search, onSearch, total, shown }) {
  return (
    <section className="surface-lift rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-[#12385d] outline-none transition placeholder:text-slate-400 focus:border-[#0a4778] focus:bg-white focus:ring-2 focus:ring-sky-100"
            placeholder="Cari dokter, diagnosis, atau catatan"
          />
        </label>
        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          {shown} dari {total} rekam medis
        </div>
      </div>
    </section>
  );
}

function RecordsPanel({ records, total, selectedId, onSelect }) {
  return (
    <aside className="surface-lift h-fit rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#12385d]">Riwayat konsultasi</h2>
        <p className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-[#0a4778]">
          {total} rekam medis
        </p>
      </div>

      {records.length ? (
        <div className="mt-4 grid gap-3">
          {records.map((record) => (
            <RecordListItem
              key={record.id}
              record={record}
              active={record.id === selectedId}
              onClick={() => onSelect(record.id)}
            />
          ))}
        </div>
      ) : (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-6 shadow-sm">
          <EmptyState title="Record tidak ditemukan" description="Coba kata kunci lain." />
        </section>
      )}
    </aside>
  );
}

function RecordListItem({ record, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`surface-lift w-full rounded-xl border p-4 text-left ${
        active
          ? "border-[#0a4778] bg-sky-50 shadow-sm ring-1 ring-[#0a4778]"
          : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
            {formatDate(record.tanggal_periksa)}
          </p>
          <h3 className="mt-3 truncate text-base font-semibold text-[#12385d]">
            {record.dokter_nama}
          </h3>
          <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
            {record.spesialisasi || "Dokter Umum"}
          </p>
        </div>
        {active ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#0a4778]" /> : null}
      </div>
      <div className="mt-4 rounded-lg bg-white/75 p-3">
        <p className="text-xs font-semibold text-slate-500">Diagnosis:</p>
        <p className="mt-1 text-sm font-semibold text-[#12385d]">{record.diagnosa || "-"}</p>
      </div>
    </button>
  );
}

function RecordDetail({ record, onPrint, onShare }) {
  if (!record) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <EmptyState title="Pilih rekam medis" description="Detail pemeriksaan akan tampil di sini." />
      </section>
    );
  }

  return (
    <section className="surface-lift overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <RecordHero record={record} onPrint={onPrint} onShare={onShare} />

      <div className="grid gap-5 p-4 sm:p-5">
        <DiagnosisCard record={record} />

        <div className="grid gap-5 lg:grid-cols-2">
          <PrescriptionCard items={record.resep_obat || []} />
          <AdviceCard record={record} />
        </div>
      </div>
    </section>
  );
}

function RecordHero({ record, onPrint, onShare }) {
  return (
    <div className="bg-[#0a4778] p-5 text-white">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-white/15 text-sky-100 ring-1 ring-white/20">
            <Stethoscope className="h-10 w-10" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-normal sm:text-2xl">
              {record.dokter_nama}
            </h2>
            <p className="mt-1 text-sm font-semibold text-sky-100">
              {record.spesialisasi || "Dokter Umum"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <HeroPill icon={CalendarDays} label={formatDate(record.tanggal_periksa)} />
              <HeroPill icon={Clock3} label={formatTime(record.jam_slot)} />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:w-52 md:grid-cols-1">
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#58b9f6] px-4 py-3 text-sm font-semibold text-[#06385f] transition hover:bg-[#79c8fa]"
          >
            <Printer className="h-4 w-4" />
            Cetak Rekam Medis
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
          >
            <ClipboardCheck className="h-4 w-4" />
            Salin Ringkasan
          </button>
        </div>
      </div>
    </div>
  );
}

function DiagnosisCard({ record }) {
  return (
    <article className="rounded-xl border border-sky-100 bg-sky-50/70 p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold text-[#12385d]">
        <FileText className="h-5 w-5 text-[#0a4778]" />
        Diagnosis & Catatan Dokter
      </h3>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Diagnosis utama</p>
        <p className="mt-1 font-semibold text-[#12385d]">{record.diagnosa || "-"}</p>
      </div>

      <div className="mt-4 rounded-lg bg-white p-4">
        <p className="text-xs font-semibold text-slate-500">Catatan Dokter:</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {record.catatan_dokter || record.keluhan || "Catatan dokter belum tersedia."}
        </p>
      </div>
    </article>
  );
}

function PrescriptionCard({ items }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold text-[#12385d]">
        <Pill className="h-5 w-5 text-[#0a4778]" />
        Resep Obat
      </h3>

      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-[#0a4778]">
                <Pill className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#12385d]">{item.detail_obat}</p>
                <p className="mt-0.5 text-sm font-medium text-slate-500">{item.dosis}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm font-medium text-slate-600">
          Tidak ada resep obat.
        </p>
      )}
    </article>
  );
}

function AdviceCard({ record }) {
  const advice = buildAdvice(record);
  const controlDate = addDays(record.tanggal_periksa, 7);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold text-[#12385d]">
        <ClipboardCheck className="h-5 w-5 text-[#0a4778]" />
        Saran Medis
      </h3>

      <div className="mt-4 space-y-3">
        {advice.map((item) => (
          <p key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-orange-400" />
            {item}
          </p>
        ))}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Jadwal kontrol:</p>
        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-sky-50 px-3 py-3">
          <span className="text-sm font-semibold text-sky-700">{formatDate(controlDate)}</span>
          <Link to="/patient/find-doctor" className="text-sm font-semibold text-[#0a4778]">
            Atur Jadwal
          </Link>
        </div>
      </div>
    </article>
  );
}

function HeroPill({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-sky-50 ring-1 ring-white/15">
      <Icon className="h-4 w-4" />
      {label}
    </span>
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

function buildAdvice(record) {
  if (!record?.catatan_dokter) return defaultAdvice;

  const sentences = record.catatan_dokter
    .split(".")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((item) => `${item}.`);

  return sentences.length ? sentences : defaultAdvice;
}

function buildRecordDetails(record) {
  if (!record) return [];

  return [
    { label: "Dokter", value: record.dokter_nama || "-" },
    { label: "Tanggal", value: formatDate(record.tanggal_periksa) },
    { label: "Diagnosis", value: record.diagnosa || "-" }
  ];
}

function addDays(value, days) {
  const date = value ? new Date(value) : new Date();
  date.setDate(date.getDate() + days);
  return date;
}
