import {
  Briefcase,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Info as InfoCircle,
  MapPin,
  Search,
  Star
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import { Modal } from "../../components/Modal";
import { EmptyState, LoadingState } from "../../components/States";
import { StatusBadge } from "../../components/StatusBadge";
import { PatientLayout } from "../../layouts/PatientLayout";
import { formatDate, formatTime, timeSlots } from "../../utils";

const availabilityOptions = ["Hari Ini", "Besok", "Minggu Ini"];
const PAGE_SIZE = 4;
const sortOptions = [
  { label: "Direkomendasikan", value: "recommended" },
  { label: "Rating tertinggi", value: "rating" },
  { label: "Pengalaman", value: "experience" },
  { label: "Nama A-Z", value: "name" }
];

export default function PatientFindDoctor() {
  const [doctors, setDoctors] = useState([]);
  const [polyclinics, setPolyclinics] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPolis, setSelectedPolis] = useState([]);
  const [availability, setAvailability] = useState("Hari Ini");
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("recommended");
  const [currentPage, setCurrentPage] = useState(1);
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

  const enrichedDoctors = useMemo(
    () => doctors.map((doctor, index) => ({ ...doctor, ui: doctorUiMeta(index, doctor) })),
    [doctors]
  );

  const filteredDoctors = useMemo(() => {
    return enrichedDoctors
      .filter((doctor) => {
        const keyword = `${doctor.nama} ${doctor.spesialisasi} ${doctor.nama_poli || ""}`.toLowerCase();
        const matchesSearch = keyword.includes(search.toLowerCase());
        const matchesPoli = selectedPolis.length === 0 || selectedPolis.includes(String(doctor.id_poli));
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
  }, [availability, enrichedDoctors, minRating, search, selectedPolis, sortBy]);
  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE));
  const visibleDoctors = filteredDoctors.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [availability, minRating, search, selectedPolis, sortBy]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <PatientLayout>
      <main className="min-h-screen bg-[#f4f7fd]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          
          {/* Header Search Bar */}
          <div className="page-enter mb-8 flex flex-col divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm sm:flex-row sm:divide-x sm:divide-y-0">
             <div className="flex-1 flex items-center px-4 py-2">
               <Search className="h-5 w-5 text-slate-400 shrink-0" />
               <input
                 type="text"
                 placeholder="Cari nama dokter, spesialisasi, atau klinik..."
                 className="w-full bg-transparent border-none outline-none pl-3 text-sm text-navy placeholder-slate-400"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
             </div>
             <div className="sm:w-64 flex items-center px-4 py-2">
               <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
               <select className="w-full bg-transparent border-none outline-none pl-3 text-sm text-navy font-medium">
                 <option>Jakarta Pusat</option>
                 <option>Jakarta Selatan</option>
                 <option>Bandung</option>
               </select>
             </div>
             <div className="p-1">
               <button className="w-full sm:w-auto bg-[#0a4778] text-white px-8 py-2.5 rounded-full text-sm font-bold hover:bg-[#073e69]">
                 Cari
               </button>
             </div>
          </div>

          <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
             <div>
               <h1 className="text-2xl font-bold text-navy">Temukan Dokter</h1>
               <p className="text-sm text-slate-500 mt-1">Menampilkan {filteredDoctors.length}+ dokter terbaik untuk Anda</p>
             </div>
             <div className="flex items-center gap-2 mt-4 sm:mt-0 text-sm">
               <span className="text-slate-500 font-medium">Urutkan:</span>
               <select 
                 className="font-bold text-navy border-none outline-none bg-transparent"
                 value={sortBy}
                 onChange={e => setSortBy(e.target.value)}
               >
                 {sortOptions.map(opt => (
                   <option key={opt.value} value={opt.value}>{opt.label}</option>
                 ))}
               </select>
             </div>
          </div>

          <div className="grid lg:grid-cols-[240px_1fr] gap-8">
            <FilterPanel
              polyclinics={polyclinics}
              selectedPolis={selectedPolis}
              setSelectedPolis={setSelectedPolis}
              availability={availability}
              setAvailability={setAvailability}
              minRating={minRating}
              setMinRating={setMinRating}
            />

            <section className="min-w-0">
              {loading ? (
                <LoadingState />
              ) : visibleDoctors.length ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {visibleDoctors.map((doctor, index) => (
                    <DoctorCard
                      key={doctor.id}
                      doctor={doctor}
                      variant={index}
                      onBook={() => setSelectedDoctor(doctor)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState title="Dokter tidak ditemukan" description="Coba ubah kata kunci atau filter." />
              )}

              {/* Pagination */}
              {filteredDoctors.length ? (
              <div className="mb-8 mt-8 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredDoctors.length)} dari {filteredDoctors.length} dokter
                </p>
                <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 rounded-full text-sm font-bold ${
                      currentPage === page
                        ? "bg-[#0a4778] text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                </div>
              </div>
              ) : null}

            </section>
          </div>
        </div>
      </main>

      {selectedDoctor ? (
        <BookingModal doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />
      ) : null}
    </PatientLayout>
  );
}

function FilterPanel({
  polyclinics,
  selectedPolis,
  setSelectedPolis,
  availability,
  setAvailability,
  minRating,
  setMinRating
}) {
  const togglePoli = (id) => {
    if (id === "") {
      setSelectedPolis([]);
    } else {
      setSelectedPolis(prev => 
        prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      );
    }
  };

  return (
    <aside className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 h-fit">
      <h2 className="text-base font-bold text-navy mb-6">Filter</h2>

      <FilterGroup title="SPESIALISASI">
        <FilterCheckbox 
           checked={selectedPolis.length === 0} 
           label="Semua Spesialisasi" 
           onChange={() => togglePoli("")} 
        />
        {polyclinics.slice(0, 5).map((item) => (
          <FilterCheckbox
            key={item.id}
            checked={selectedPolis.includes(String(item.id))}
            label={item.nama_poli}
            onChange={() => togglePoli(String(item.id))}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="BIAYA KONSULTASI">
         <div className="mt-4 relative pt-1">
            <div className="overflow-hidden h-1.5 mb-4 text-xs flex rounded bg-slate-200">
               <div style={{ width: "60%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-slate-400"></div>
            </div>
            <div className="flex justify-between text-[10px] font-semibold text-slate-500">
               <span>Rp 50rb</span>
               <span>Rp 1Jt+</span>
            </div>
         </div>
      </FilterGroup>

      <FilterGroup title="KETERSEDIAAN">
        <div className="flex flex-wrap gap-2">
          {availabilityOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setAvailability(option)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition ${availability === option
                  ? "border-[#0a4778] bg-sky-50 text-[#0a4778]"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                }`}
            >
              {option}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="RATING PASIEN">
         <div className="space-y-3">
            {[4.5, 4.0].map((rating) => (
              <label key={rating} className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="ratingFilter"
                  checked={minRating === rating} 
                  onChange={() => setMinRating(rating)} 
                  className="w-4 h-4 text-[#0a4778] border-slate-300 focus:ring-[#0a4778]"
                />
                <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                  {rating.toFixed(1)}+ <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>
              </label>
            ))}
         </div>
      </FilterGroup>
    </aside>
  );
}

function DoctorCard({ doctor, variant, onBook }) {
  const avatarUrl = `https://i.pravatar.cc/150?u=${doctor.id || variant}`;
  
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 hover:border-sky-200 transition">
      <div className="flex items-start gap-4">
        {/* Photo */}
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100">
          <img src={avatarUrl} alt={doctor.nama} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[17px] font-bold text-navy truncate">{doctor.nama}</h2>
              <p className="text-sm font-medium text-[#0d78b7] mt-0.5">{doctor.spesialisasi || "Dokter Umum"}</p>
            </div>
            <div className="flex items-center gap-1 bg-sky-50 text-[#0a4778] px-2 py-0.5 rounded text-xs font-bold shrink-0">
               <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
               {doctor.ui.rating.toFixed(1)}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 font-medium">
             {doctor.ui.experience > 5 && (
               <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 rounded font-bold uppercase tracking-wider text-[10px]">
                 Aktif
               </span>
             )}
             <span className="flex items-center gap-1.5">
               <MapPin className="w-3.5 h-3.5 text-slate-400" />
               Siloam Hospitals, Kebon Jeruk
             </span>
             <span className="flex items-center gap-1.5">
               <Briefcase className="w-3.5 h-3.5 text-slate-400" />
               {doctor.ui.experience} Tahun Pengalaman
             </span>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
            <p className="text-[11px] font-medium text-slate-400">Jadwal Terdekat</p>
            <p className="text-sm font-bold text-navy mt-0.5">{doctor.ui.nextSchedule} WIB</p>
         </div>
         <div className="flex items-center gap-4">
            <button className="text-sm font-bold text-[#0a4778] hover:underline">
               Lihat Profil
            </button>
            <button
               onClick={onBook}
               className="bg-[#0a4778] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#073e69]"
            >
               Buat Janji Temu
            </button>
         </div>
      </div>
    </article>
  );
}

function BookingModal({ doctor, onClose }) {
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const availableSlots = timeSlots.slice(0, 6);
  // Example: disabled last slot
  const disabledSlots = new Set([availableSlots[availableSlots.length - 1]]);
  
  const [tanggal, setTanggal] = useState(dateOptions[1]?.value || toInputDateLocal(new Date()));
  const [jamSlot, setJamSlot] = useState(availableSlots.find((slot) => !disabledSlots.has(slot)) || timeSlots[0]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function confirmBooking() {
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
    <Modal title="Jadwal Praktik" onClose={onClose}>
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
             <div className="rounded-lg border border-slate-200 p-4"><p className="text-xs text-slate-500">Dokter</p><p className="mt-1 font-semibold text-navy">{result.dokter_nama}</p></div>
             <div className="rounded-lg border border-slate-200 p-4"><p className="text-xs text-slate-500">Tanggal</p><p className="mt-1 font-semibold text-navy">{formatDate(result.tanggal_kunjungan)}</p></div>
          </div>
          <button onClick={onClose} className="w-full mt-4 bg-[#0a4778] text-white py-3 rounded-lg font-bold">Selesai</button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <img src={`https://i.pravatar.cc/150?u=${doctor.id}`} className="w-12 h-12 rounded-full" />
            <div>
              <p className="font-bold text-navy text-sm">dr. {doctor.nama}</p>
              <p className="text-xs font-medium text-slate-500">{doctor.spesialisasi} • Penyakit Dalam</p>
            </div>
          </div>

          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-navy">
              <CalendarDays className="h-4 w-4 text-[#0a4778]" />
              Pilih Hari & Waktu
            </p>
            
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {dateOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setTanggal(option.value)}
                  className={`min-w-[60px] rounded-xl border p-2 text-center transition ${tanggal === option.value
                      ? "border-[#0a4778] bg-[#58b9f6] text-[#06385f]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                >
                  <span className="block text-[11px] font-medium">{option.day}</span>
                  <span className="mt-0.5 block text-lg font-bold">{option.date}</span>
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
              {availableSlots.map((slot) => {
                const disabled = disabledSlots.has(slot);
                return (
                  <button
                    type="button"
                    key={slot}
                    disabled={disabled}
                    onClick={() => setJamSlot(slot)}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${disabled
                        ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
                        :
                        jamSlot === slot
                          ? "border-[#0a4778] bg-[#0a4778] text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                  >
                    {disabled ? "Penuh" : `${slot} - ${addOneHour(slot)}`}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-[#0a4778]/10 bg-sky-50/50 p-4 text-[#12385d]">
            <InfoCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#0a4778]" />
            <div>
              <p className="text-sm font-bold">Informasi Penting</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Pastikan Anda datang 15 menit sebelum waktu janji temu untuk proses administrasi ulang di meja pendaftaran.
              </p>
            </div>
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={confirmBooking}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-[#0a4778] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#073e69] disabled:opacity-70"
            >
              {loading ? "Menyimpan..." : "Konfirmasi Jadwal"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div className="border-t border-slate-200/60 pt-5 mt-5 first:border-0 first:pt-0 first:mt-0">
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function FilterCheckbox({ checked, label, onChange }) {
  return (
    <button type="button" onClick={onChange} className="flex items-center gap-3 text-left cursor-pointer group">
      <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${checked ? "bg-[#0a4778] border-[#0a4778] text-white" : "border-slate-300 bg-white"}`}>
         {checked && <Check className="w-3 h-3" />}
      </div>
      <span className="text-sm font-medium text-slate-600 group-hover:text-navy">{label}</span>
    </button>
  );
}

function doctorUiMeta(index, doctor) {
  const schedules = ["Besok, 09:00", "Hari Ini, 14:30", "Senin, 08:00", "Besok, 16:00"];
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
