import { CalendarPlus, Filter, Search, Star, Stethoscope } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import { Modal } from "../../components/Modal";
import { EmptyState, LoadingState } from "../../components/States";
import { StatusBadge } from "../../components/StatusBadge";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { formatDate, formatTime, timeSlots, toInputDate } from "../../utils";

export default function PatientFindDoctor() {
  const [doctors, setDoctors] = useState([]);
  const [polyclinics, setPolyclinics] = useState([]);
  const [search, setSearch] = useState("");
  const [poli, setPoli] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const keyword = `${doctor.nama} ${doctor.spesialisasi}`.toLowerCase();
      const matchesSearch = keyword.includes(search.toLowerCase());
      const matchesPoli = poli ? String(doctor.id_poli) === poli : true;
      return matchesSearch && matchesPoli;
    });
  }, [doctors, search, poli]);

  return (
    <DashboardLayout title="Find Doctors" subtitle="Cari dokter berdasarkan nama, spesialisasi, atau poliklinik.">
      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 app-card rounded-2xl p-4 md:grid-cols-[1fr_260px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
                placeholder="Cari nama dokter atau spesialisasi"
              />
            </label>
            <label className="relative block">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <select
                value={poli}
                onChange={(event) => setPoli(event.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
              >
                <option value="">Semua Poliklinik</option>
                {polyclinics.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nama_poli}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filteredDoctors.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredDoctors.map((doctor, index) => (
                <article key={doctor.id} className="app-card rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-clinical">
                        <Stethoscope className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="font-bold text-navy">{doctor.nama}</h2>
                        <p className="text-sm text-slate-500">{doctor.spesialisasi}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {(4.7 + (index % 3) / 10).toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>
                      <span className="font-medium text-navy">Poliklinik:</span> {doctor.nama_poli || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-navy">Jadwal:</span> {doctor.jadwal_praktik}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDoctor(doctor)}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 font-semibold text-white hover:bg-slate-800"
                  >
                    <CalendarPlus className="h-5 w-5" />
                    Buat Janji Temu
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Dokter tidak ditemukan" description="Ubah kata kunci atau filter poliklinik." />
          )}
        </div>
      )}

      {selectedDoctor ? (
        <BookingModal doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />
      ) : null}
    </DashboardLayout>
  );
}

function BookingModal({ doctor, onClose }) {
  const [tanggal, setTanggal] = useState(toInputDate());
  const [jamSlot, setJamSlot] = useState(timeSlots[0]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/booking", {
        id_dokter: doctor.id,
        tanggal_kunjungan: tanggal,
        jam_slot: jamSlot
      });
      setResult(response.data);
      toast.success("Booking berhasil dibuat");
    } catch (error) {
      toast.error(error.message || "Booking gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={`Booking ${doctor.nama}`} onClose={onClose}>
      {result ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Booking berhasil</p>
                <h3 className="mt-1 text-2xl font-bold text-navy">Antrean #{result.nomor_antrean}</h3>
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
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl bg-sky-50 p-4">
            <p className="font-semibold text-navy">{doctor.nama}</p>
            <p className="text-sm text-slate-600">
              {doctor.spesialisasi} - {doctor.jadwal_praktik}
            </p>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Tanggal Kunjungan</span>
            <input
              type="date"
              value={tanggal}
              min={toInputDate()}
              onChange={(event) => setTanggal(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-clinical focus:ring-2 focus:ring-sky-100"
              required
            />
          </label>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Jam Slot</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {timeSlots.map((slot) => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setJamSlot(slot)}
                  className={`rounded-lg border px-3 py-3 text-sm font-semibold ${
                    jamSlot === slot
                      ? "border-clinical bg-sky-50 text-clinical"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
          >
            <CalendarPlus className="h-5 w-5" />
            {loading ? "Mengecek slot..." : "Konfirmasi Booking"}
          </button>
        </form>
      )}
    </Modal>
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
