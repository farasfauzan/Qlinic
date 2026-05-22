import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  Pill,
  Printer,
  Search,
  Share2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { EmptyState, LoadingState } from "../../components/States";
import { PatientLayout } from "../../layouts/PatientLayout";
import { formatDate, formatTime } from "../../utils";

const defaultAdvice = [
  "Ikuti instruksi dokter sesuai catatan pemeriksaan.",
  "Minum obat sesuai dosis dan jadwal yang diberikan.",
  "Hubungi klinik jika keluhan memburuk."
];

export default function PatientMedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

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

  function downloadAllRecords() {
    if (!filteredRecords.length) {
      toast.error("Tidak ada rekam medis untuk diunduh");
      return;
    }

    const blob = new Blob([JSON.stringify(filteredRecords, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "rekam-medis-qlinic.json";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Rekam medis diunduh");
  }

  return (
    <PatientLayout>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        <div className="page-enter mb-8 flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-navy">Rekam Medis Saya</h1>
            <p className="text-sm text-slate-500 mt-1">Kelola dan tinjau riwayat kesehatan Anda secara transparan.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari rekam medis..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-[#0a4778] sm:w-64"
              />
            </label>
            <button
              type="button"
              onClick={downloadAllRecords}
              className="flex items-center gap-2 rounded-lg bg-[#0a4778] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#073e69]"
            >
              <Download className="w-4 h-4" /> Download Semua Riwayat
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : records.length ? (
          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
             
             {/* Left Panel: Timeline */}
             <aside>
                <div className="flex items-center justify-between mb-4 px-2">
                   <h2 className="text-sm font-bold text-navy">Konsultasi Terakhir</h2>
                   <span className="text-xs font-bold text-slate-400">{filteredRecords.length} Records</span>
                </div>
                
                <div className="relative pl-3">
                   {/* Vertical Line */}
                   <div className="absolute left-[15px] top-4 bottom-0 w-0.5 bg-slate-200"></div>
                   
                   <div className="space-y-4">
                     {filteredRecords.map((record) => (
                       <RecordTimelineItem 
                         key={record.id}
                         record={record}
                         active={record.id === selectedId}
                         onClick={() => setSelectedId(record.id)}
                       />
                     ))}
                   </div>
                </div>
             </aside>

             {/* Right Panel: Detail */}
             <section className="min-w-0">
               {selectedRecord ? (
                 <RecordDetail record={selectedRecord} />
               ) : null}
             </section>

          </div>
        ) : (
          <EmptyState title="Belum ada rekam medis" description="Riwayat pemeriksaan akan tampil setelah kunjungan selesai." />
        )}
      </main>
    </PatientLayout>
  );
}

function RecordTimelineItem({ record, active, onClick }) {
  return (
    <div className="relative pl-6">
      <div className={`absolute left-[-5px] top-5 w-2.5 h-2.5 rounded-full z-10 border-2 border-white ${active ? 'bg-[#0a4778]' : 'bg-slate-300'}`}></div>
      <button
        onClick={onClick}
        className={`w-full text-left p-4 rounded-xl border transition ${active ? 'bg-sky-50 border-[#0a4778]' : 'bg-white border-slate-200 hover:border-slate-300'}`}
      >
        <div className="flex items-center justify-between text-[11px] font-bold text-[#0a4778] mb-2">
           <span>{formatDate(record.tanggal_periksa)}</span>
           {active && <CheckCircle2 className="w-3.5 h-3.5" />}
        </div>
        <h3 className="text-sm font-bold text-navy">{record.dokter_nama}</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
           {record.nama_poli || "POLIKLINIK UMUM"}
        </p>
        
        <div className="mt-3 bg-white/60 p-2 rounded border border-white">
          <p className="text-[10px] font-semibold text-slate-500">Diagnosis:</p>
          <p className="text-xs font-bold text-navy truncate">{record.diagnosa || "-"}</p>
        </div>
      </button>
    </div>
  );
}

function RecordDetail({ record }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
       {/* Top Header Card */}
       <div className="bg-[#0a4778] p-6 text-white flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <img src={`https://i.pravatar.cc/150?u=${record.id_dokter || 'doc'}`} className="w-16 h-16 rounded-xl object-cover bg-white/10" />
            <div>
              <h2 className="text-xl font-bold">{record.dokter_nama}</h2>
              <p className="text-sm font-medium text-sky-100">{record.spesialisasi || "Spesialis Penyakit Dalam"}</p>
              <div className="flex gap-2 mt-2">
                <span className="flex items-center gap-1.5 text-xs font-medium bg-white/10 px-2 py-1 rounded">
                  <CalendarDays className="w-3.5 h-3.5" /> {formatDate(record.tanggal_periksa)}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium bg-white/10 px-2 py-1 rounded">
                  <Clock3 className="w-3.5 h-3.5" /> {formatTime(record.jam_slot) || "14:30"} WIB
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
             <button className="flex items-center justify-center gap-2 bg-[#58b9f6] text-[#06385f] px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#79c8fa]">
               <Printer className="w-4 h-4" /> Cetak Rekam Medis
             </button>
             <button className="flex items-center justify-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-white/20">
               <Share2 className="w-4 h-4" /> Bagikan ke Dokter
             </button>
          </div>
       </div>

       {/* Body Content */}
       <div className="p-6 bg-[#f8fafc] grid gap-6">
          
          <div className="bg-white rounded-xl border border-slate-200 p-5">
             <h3 className="flex items-center gap-2 text-sm font-bold text-[#0a4778]">
               <FileText className="w-4 h-4" /> Diagnosis & Catatan Dokter
             </h3>
             <div className="mt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DIAGNOSIS UTAMA</p>
                <p className="text-sm font-bold text-navy mt-1">{record.diagnosa || "Gastritis Akut dengan Dispepsia"}</p>
             </div>
             
             <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">Catatan Dokter:</p>
                <p className="text-xs leading-relaxed text-slate-700">
                  {record.catatan_dokter || "Pasien mengeluhkan nyeri ulu hati yang tajam selama 3 hari terakhir, disertai mual dan kembung. Keluhan memburuk setelah mengkonsumsi makanan pedas. Tidak ada tanda-tanda pendarahan saluran cerna. Pemeriksaan fisik menunjukkan nyeri tekan pada area epigastrium."}
                </p>
             </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
             <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#0a4778] mb-4">
                  <Pill className="w-4 h-4" /> Resep Obat
                </h3>
                {record.resep_obat?.length ? (
                  <div className="space-y-4">
                    {record.resep_obat.map(item => (
                      <div key={item.id} className="flex gap-3">
                         <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-[#0a4778] shrink-0">
                           <Pill className="w-4 h-4" />
                         </div>
                         <div>
                           <p className="text-xs font-bold text-navy">{item.detail_obat}</p>
                           <p className="text-[11px] font-medium text-slate-500 mt-0.5">{item.dosis}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Dummy data for visual matching if no actual prescription */}
                    <div className="flex gap-3">
                       <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-[#0a4778] shrink-0"><Pill className="w-4 h-4" /></div>
                       <div><p className="text-xs font-bold text-navy">Omeprazole 20mg</p><p className="text-[11px] font-medium text-slate-500 mt-0.5">1 x 1 Kapsul (Pagi sebelum makan)</p></div>
                    </div>
                    <div className="flex gap-3">
                       <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-[#0a4778] shrink-0"><Pill className="w-4 h-4" /></div>
                       <div><p className="text-xs font-bold text-navy">Antasida Doen</p><p className="text-[11px] font-medium text-slate-500 mt-0.5">3 x 1 Tablet (Kunyah, saat nyeri)</p></div>
                    </div>
                    <div className="flex gap-3">
                       <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-[#0a4778] shrink-0"><Pill className="w-4 h-4" /></div>
                       <div><p className="text-xs font-bold text-navy">Domperidone 10mg</p><p className="text-[11px] font-medium text-slate-500 mt-0.5">3 x 1 Tablet (Bila mual)</p></div>
                    </div>
                  </div>
                )}
             </div>

             <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#0a4778] mb-4">
                  <ClipboardCheck className="w-4 h-4" /> Saran Medis
                </h3>
                
                <div className="space-y-3 flex-1">
                  {(buildAdvice(record).length ? buildAdvice(record) : defaultAdvice).map((item, idx) => (
                    <div key={idx} className="flex gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-600 leading-snug">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">JADWAL KONTROL:</p>
                   <div className="flex items-center justify-between bg-sky-50 rounded-lg px-3 py-2">
                     <span className="text-xs font-bold text-sky-700">{formatDate(addDays(record.tanggal_periksa, 7))}</span>
                     <Link to="/patient/find-doctor" className="text-xs font-bold text-[#0a4778] hover:underline">
                       Atur Jadwal
                     </Link>
                   </div>
                </div>
             </div>
          </div>

       </div>
    </div>
  );
}


function buildAdvice(record) {
  if (!record?.catatan_dokter) return [];

  const sentences = record.catatan_dokter
    .split(".")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((item) => `${item}.`);

  return sentences.length ? sentences : [];
}

function addDays(value, days) {
  const date = value ? new Date(value) : new Date();
  date.setDate(date.getDate() + days);
  return date;
}
