import {
  CalendarDays,
  Clock3,
  FileText,
  Pill,
  Search,
  Stethoscope,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { EmptyState, LoadingState } from "../../components/States";
import { DoctorLayout } from "../../layouts/DoctorLayout";
import { formatDate, formatTime } from "../../utils";

export default function DoctorMedicalRecords() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    async function loadRecords() {
      try {
        const response = await api.get("/rekam-medis");
        setRecords(response.data);
      } finally {
        setLoading(false);
      }
    }

    loadRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const sorted = [...records].sort(
      (a, b) => new Date(b.tanggal_periksa || 0) - new Date(a.tanggal_periksa || 0)
    );

    if (!keyword) return sorted;

    return sorted.filter((record) =>
      [
        record.pasien_nama,
        record.nik,
        record.diagnosa,
        record.keluhan,
        record.catatan_dokter,
        record.spesialisasi
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [records, search]);

  useEffect(() => {
    if (!filteredRecords.length) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !filteredRecords.some((record) => record.id === selectedId)) {
      setSelectedId(filteredRecords[0].id);
    }
  }, [filteredRecords, selectedId]);

  const selectedRecord = useMemo(
    () => filteredRecords.find((record) => record.id === selectedId) || filteredRecords[0],
    [filteredRecords, selectedId]
  );

  return (
    <DoctorLayout
      title="Rekam Medis"
      subtitle="Tinjau rekam medis dari pasien yang pernah Anda tangani."
      headerActions={
        <button
          type="button"
          onClick={() => navigate("/doctor/patients")}
          className="hidden rounded-lg bg-[#0a4778] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#073e69] sm:inline-flex"
        >
          Buka Daftar Pasien
        </button>
      }
    >
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-[#0a4778]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-navy">{records.length} rekam medis</p>
            <p className="text-xs font-medium text-slate-500">
              Data dibatasi untuk booking milik dokter yang sedang login.
            </p>
          </div>
        </div>
        <label className="relative block w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari pasien, NIK, diagnosis..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#0a4778]"
          />
        </label>
      </div>

      {loading ? (
        <LoadingState />
      ) : records.length ? (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-3">
            {filteredRecords.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => setSelectedId(record.id)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  selectedRecord?.id === record.id
                    ? "border-[#0a4778] bg-sky-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-navy">{record.pasien_nama}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                      NIK {record.nik || "-"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-white px-2 py-1 text-[10px] font-bold text-[#0a4778]">
                    #{record.nomor_antrean || "-"}
                  </span>
                </div>
                <div className="mt-4 rounded-lg border border-white/80 bg-white/70 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Diagnosis
                  </p>
                  <p className="mt-1 truncate text-xs font-bold text-navy">{record.diagnosa}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(record.tanggal_periksa)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatTime(record.jam_slot)} WIB
                  </span>
                </div>
              </button>
            ))}
          </aside>

          <section className="min-w-0">
            {selectedRecord ? <DoctorRecordDetail record={selectedRecord} /> : null}
          </section>
        </div>
      ) : (
        <EmptyState
          title="Belum ada rekam medis"
          description="Rekam medis akan muncul setelah dokter mengisi hasil pemeriksaan pasien."
        />
      )}
    </DoctorLayout>
  );
}

function DoctorRecordDetail({ record }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-[#0a4778] p-6 text-white">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <UserRound className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{record.pasien_nama}</h2>
              <p className="mt-1 text-sm font-medium text-sky-100">NIK {record.nik || "-"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded bg-white/10 px-2 py-1 text-xs font-medium">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(record.tanggal_periksa)}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded bg-white/10 px-2 py-1 text-xs font-medium">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatTime(record.jam_slot)} WIB
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold">
            Antrean #{record.nomor_antrean || "-"}
          </div>
        </div>
      </div>

      <div className="grid gap-5 bg-slate-50 p-5">
        <InfoCard icon={Stethoscope} title="Keluhan & Diagnosis">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldBlock label="Keluhan pasien" value={record.keluhan} />
            <FieldBlock label="Diagnosis" value={record.diagnosa} strong />
          </div>
        </InfoCard>

        <InfoCard icon={FileText} title="Catatan Dokter">
          <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
            {record.catatan_dokter}
          </p>
        </InfoCard>

        <InfoCard icon={Pill} title="Resep Obat">
          {record.resep_obat?.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {record.resep_obat.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm font-bold text-navy">{item.detail_obat}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{item.dosis}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-500">Tidak ada resep obat.</p>
          )}
        </InfoCard>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[#0a4778]">
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function FieldBlock({ label, value, strong = false }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-sm leading-6 ${strong ? "font-bold text-navy" : "text-slate-700"}`}>
        {value || "-"}
      </p>
    </div>
  );
}
