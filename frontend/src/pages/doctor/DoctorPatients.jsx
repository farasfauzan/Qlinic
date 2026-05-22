import {
  CalendarDays,
  CheckCircle2,
  ClipboardPlus,
  Clock,
  Download,
  Eye,
  FileText,
  Pill,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { Modal } from "../../components/Modal";
import { EmptyState, LoadingState } from "../../components/States";
import { DoctorLayout } from "../../layouts/DoctorLayout";
import { formatDate, formatTime } from "../../utils";

const filterOptions = ["Semua", "Menunggu", "Konsultasi", "Selesai"];

export default function DoctorPatients() {
  const [searchParams] = useSearchParams();
  const requestedBookingParam = searchParams.get("booking");
  const requestedAction = searchParams.get("action");
  const [bookings, setBookings] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Semua");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [recordModal, setRecordModal] = useState(null);

  // Mocking to match the design's "Konsultasi" status visually since backend only has Pending/Done/Cancelled
  // We'll treat the first Pending as "Konsultasi" (active) just for visual fidelity if needed, 
  // or just map: Pending -> Menunggu, Done -> Selesai.
  const [activeConsultationId, setActiveConsultationId] = useState(null);

  async function loadBookings() {
    setLoading(true);
    try {
      const [bookingResponse, recordResponse] = await Promise.all([
        api.get("/dokter/me/bookings"),
        api.get("/rekam-medis")
      ]);
      const nextBookings = bookingResponse.data;
      const nextRecords = recordResponse.data;
      setBookings(nextBookings);
      setRecords(nextRecords);

      if (nextBookings.length > 0) {
        const requestedBookingId = Number(requestedBookingParam);
        const requestedBooking = nextBookings.find((booking) => booking.id === requestedBookingId);
        const nextSelected = requestedBooking || nextBookings[0];
        setSelectedPatient(nextSelected);

        if (requestedBooking && requestedAction === "record") {
          const existingRecord = nextRecords.find((record) => record.id_booking === requestedBooking.id);
          setRecordModal({
            booking: requestedBooking,
            record: existingRecord || null,
            mode: existingRecord ? "view" : "create"
          });
        }

        // Mock the first pending as 'Konsultasi'
        const firstPending = nextBookings.find(b => b.status_booking === 'Pending');
        if (firstPending) setActiveConsultationId(firstPending.id);
      } else {
        setSelectedPatient(null);
        setActiveConsultationId(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, [requestedBookingParam, requestedAction]);

  const recordsByBookingId = useMemo(() => {
    return new Map(records.map((record) => [record.id_booking, record]));
  }, [records]);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      selesai: bookings.filter(b => b.status_booking === 'Done').length,
      menunggu: bookings.filter(b => b.status_booking === 'Pending' && b.id !== activeConsultationId).length
    };
  }, [bookings, activeConsultationId]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch = b.pasien_nama.toLowerCase().includes(search.toLowerCase()) || 
                          String(b.nomor_antrean).toLowerCase().includes(search.toLowerCase());
      
      let matchFilter = true;
      if (filter === "Menunggu") matchFilter = b.status_booking === "Pending" && b.id !== activeConsultationId;
      if (filter === "Konsultasi") matchFilter = b.id === activeConsultationId;
      if (filter === "Selesai") matchFilter = b.status_booking === "Done";

      return matchSearch && matchFilter;
    });
  }, [bookings, search, filter, activeConsultationId]);

  const handleExport = () => {
    if (!filteredBookings.length) {
      toast.error("Tidak ada data pasien untuk diekspor");
      return;
    }

    const rows = filteredBookings.map((booking) => ({
      nomor_antrean: booking.nomor_antrean,
      nama_pasien: booking.pasien_nama,
      nik: booking.nik || "",
      tanggal_kunjungan: booking.tanggal_kunjungan,
      jam_slot: booking.jam_slot,
      status_booking: booking.status_booking,
      rekam_medis: recordsByBookingId.has(booking.id) ? "Ada" : "Belum ada"
    }));

    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "daftar-pasien-dokter-qlinic.json";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Daftar pasien diekspor");
  };

  function openRecordModal(booking) {
    const record = recordsByBookingId.get(booking.id);
    setRecordModal({
      booking,
      record: record || null,
      mode: record ? "view" : "create"
    });
  }

  async function handleRecordSaved() {
    setRecordModal(null);
    await loadBookings();
  }

  const getStatusDisplay = (booking) => {
    if (booking.id === activeConsultationId && booking.status_booking === 'Pending') {
      return { text: "Konsultasi", color: "text-[#0a4778]", dot: "bg-[#0a4778]" };
    }
    if (booking.status_booking === 'Done') {
      return { text: "Selesai", color: "text-slate-500", dot: "bg-slate-400" };
    }
    return { text: "Menunggu", color: "text-slate-500", dot: "bg-slate-300" };
  };

  // Mocking demographic data since backend doesn't provide age/gender yet
  const mockDemographics = (booking) => {
    const idNum = parseInt(booking.id || 0);
    return {
      usia: 25 + (idNum % 30) + " Tahun",
      gender: idNum % 2 === 0 ? "Laki-laki" : "Perempuan",
      keluhan: booking.status_booking === "Done" ? "Pemeriksaan rutin." : "Batuk berdahak sejak 3 hari yang lalu, disertai demam ringan di malam hari."
    };
  };

  const selectedRecord = selectedPatient ? recordsByBookingId.get(selectedPatient.id) : null;
  const selectedCanCreateRecord = selectedPatient?.status_booking !== "Cancelled";

  return (
    <DoctorLayout title="Daftar Pasien Hari Ini">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
           <CalendarDays className="w-4 h-4" />
           {formatDate(new Date())}
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition">
          <Download className="w-4 h-4" /> Export List
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] gap-6">
         
         <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
               <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-[#0a4778] flex items-center justify-center text-white shrink-0">
                   <Users className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pasien</p>
                   <p className="text-2xl font-bold text-navy leading-none mt-1">{stats.total}</p>
                 </div>
               </div>
               
               <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-[#0a4778] shrink-0">
                   <CheckCircle2 className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selesai</p>
                   <p className="text-2xl font-bold text-navy leading-none mt-1">{stats.selesai}</p>
                 </div>
               </div>

               <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                   <Clock className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Menunggu</p>
                   <p className="text-2xl font-bold text-navy leading-none mt-1">{stats.menunggu}</p>
                 </div>
               </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                   type="text" 
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   placeholder="Cari nama pasien..." 
                   className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-[#0a4778]"
                 />
               </div>
               <div className="flex gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100 overflow-x-auto">
                 {filterOptions.map(opt => (
                   <button
                     key={opt}
                     onClick={() => setFilter(opt)}
                     className={`px-4 py-1.5 text-[11px] font-bold rounded-md whitespace-nowrap transition ${filter === opt ? 'bg-[#0a4778] text-white shadow-sm' : 'text-slate-500 hover:text-navy hover:bg-slate-100'}`}
                   >
                     {opt}
                   </button>
                 ))}
               </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24">No. Antrean</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Pasien</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipe</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr><td colSpan="5" className="p-8"><LoadingState /></td></tr>
                      ) : filteredBookings.length > 0 ? (
                        filteredBookings.map(booking => {
                          const isSelected = selectedPatient?.id === booking.id;
                          const stat = getStatusDisplay(booking);
                          const isDone = booking.status_booking === 'Done';

                          return (
                            <tr 
                              key={booking.id} 
                              onClick={() => setSelectedPatient(booking)}
                              className={`cursor-pointer transition hover:bg-sky-50/50 ${isSelected ? 'bg-sky-50' : ''}`}
                            >
                              <td className="px-6 py-4">
                                <span className={`text-xs font-bold ${isSelected ? 'text-[#0a4778]' : 'text-slate-600'}`}>
                                  {booking.nomor_antrean}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold text-navy">{booking.pasien_nama}</p>
                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">ID: #{booking.nik?.substring(0, 5) || "99021"}</p>
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                                {booking.jam_slot.substring(0, 5)} - {parseInt(booking.jam_slot.substring(0, 2)) + 1}:00
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${isDone ? 'bg-orange-50 text-orange-600' : 'bg-sky-50 text-[#0a4778]'}`}>
                                  {isDone ? 'Baru' : 'Follow-up'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className={`flex items-center gap-2 text-xs font-bold ${stat.color}`}>
                                  {isDone ? (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  ) : (
                                    <span className={`w-2 h-2 rounded-full ${stat.dot}`}></span>
                                  )}
                                  {stat.text}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan="5" className="p-8"><EmptyState title="Tidak ada data" description="Tidak ada pasien yang cocok dengan filter." /></td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* Right Panel: Quick View */}
         <aside className="h-fit sticky top-[100px]">
            {selectedPatient ? (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                 <div className="bg-[#0a4778] p-5 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-sky-200 mb-4">Quick View</p>
                    <div className="flex items-center gap-4">
                       <img src={`https://ui-avatars.com/api/?name=${selectedPatient.pasien_nama}&background=ffffff&color=0a4778`} className="w-12 h-12 rounded-lg object-cover" />
                       <div>
                          <p className="font-bold text-white leading-tight">{selectedPatient.pasien_nama}</p>
                          <p className="text-xs text-sky-100 mt-1">Antrean {selectedPatient.nomor_antrean}</p>
                       </div>
                    </div>
                 </div>

                 <div className="p-5 flex-1 flex flex-col gap-6">
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Data Pasien</p>
                       <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-500">NIK</span>
                            <span className="text-navy">{selectedPatient.nik || "3275000000000001"}</span>
                          </div>
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-500">Usia</span>
                            <span className="text-navy">{mockDemographics(selectedPatient).usia}</span>
                          </div>
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-500">Jenis Kelamin</span>
                            <span className="text-navy">{mockDemographics(selectedPatient).gender}</span>
                          </div>
                       </div>
                    </div>

                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Keluhan Utama</p>
                       <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 text-xs font-medium text-[#0a4778] leading-relaxed">
                          "{mockDemographics(selectedPatient).keluhan}"
                       </div>
                    </div>

                    <div className="mt-auto space-y-2 pt-2">
                       <button
                         type="button"
                         onClick={() => selectedCanCreateRecord && openRecordModal(selectedPatient)}
                         disabled={!selectedCanCreateRecord}
                         className="w-full flex items-center justify-center gap-2 bg-[#f0f7ff] hover:bg-[#e0efff] text-[#0a4778] px-4 py-2.5 rounded-lg text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
                       >
                         {selectedRecord ? (
                           <>
                             <Eye className="w-4 h-4" /> Lihat Rekam Medis
                           </>
                         ) : (
                           <>
                             <ClipboardPlus className="w-4 h-4" /> Isi Rekam Medis
                           </>
                         )}
                       </button>
                       {!selectedCanCreateRecord ? (
                         <p className="rounded-lg bg-slate-50 px-3 py-2 text-center text-[11px] font-semibold text-slate-500">
                           Booking dibatalkan, rekam medis tidak dapat dibuat.
                         </p>
                       ) : null}
                    </div>
                 </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 flex items-center justify-center text-center h-full">
                <p className="text-sm font-bold text-slate-400">Pilih pasien untuk melihat detail</p>
              </div>
            )}
         </aside>

      </div>

      {recordModal ? (
        <MedicalRecordModal
          booking={recordModal.booking}
          record={recordModal.record}
          mode={recordModal.mode}
          onClose={() => setRecordModal(null)}
          onSaved={handleRecordSaved}
        />
      ) : null}
    </DoctorLayout>
  );
}

function MedicalRecordModal({ booking, record, mode, onClose, onSaved }) {
  const title = record || mode === "view" ? "Detail Rekam Medis" : "Isi Rekam Medis";

  return (
    <Modal title={title} onClose={onClose}>
      {record ? (
        <MedicalRecordDetail booking={booking} record={record} />
      ) : (
        <MedicalRecordForm booking={booking} onCancel={onClose} onSaved={onSaved} />
      )}
    </Modal>
  );
}

function MedicalRecordDetail({ booking, record }) {
  return (
    <div className="space-y-5">
      <PatientVisitSummary booking={booking} />

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailBlock label="Keluhan" value={record.keluhan} />
        <DetailBlock label="Diagnosis" value={record.diagnosa} strong />
      </div>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[#0a4778]">
          <FileText className="h-4 w-4" />
          Catatan Dokter
        </h3>
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
          {record.catatan_dokter}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[#0a4778]">
          <Pill className="h-4 w-4" />
          Resep Obat
        </h3>
        {record.resep_obat?.length ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {record.resep_obat.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-bold text-navy">{item.detail_obat}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{item.dosis}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm font-medium text-slate-500">Tidak ada resep obat.</p>
        )}
      </section>
    </div>
  );
}

function MedicalRecordForm({ booking, onCancel, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    keluhan: "",
    diagnosa: "",
    catatan_dokter: "",
    resep_obat: [{ detail_obat: "", dosis: "" }]
  });

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updatePrescription(index, field, value) {
    setForm((current) => ({
      ...current,
      resep_obat: current.resep_obat.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    }));
  }

  function addPrescription() {
    setForm((current) => ({
      ...current,
      resep_obat: [...current.resep_obat, { detail_obat: "", dosis: "" }]
    }));
  }

  function removePrescription(index) {
    setForm((current) => ({
      ...current,
      resep_obat: current.resep_obat.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/rekam-medis", {
        id_booking: booking.id,
        keluhan: form.keluhan.trim(),
        diagnosa: form.diagnosa.trim(),
        catatan_dokter: form.catatan_dokter.trim(),
        resep_obat: form.resep_obat
          .map((item) => ({
            detail_obat: item.detail_obat.trim(),
            dosis: item.dosis.trim()
          }))
          .filter((item) => item.detail_obat)
      });
      toast.success("Rekam medis berhasil disimpan");
      await onSaved();
    } catch (error) {
      toast.error(error.message || "Gagal menyimpan rekam medis");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PatientVisitSummary booking={booking} />

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Keluhan pasien</span>
        <textarea
          required
          value={form.keluhan}
          onChange={(event) => updateField("keluhan", event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0a4778]"
          placeholder="Tuliskan keluhan utama pasien"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Diagnosis</span>
        <input
          required
          value={form.diagnosa}
          onChange={(event) => updateField("diagnosa", event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0a4778]"
          placeholder="Contoh: ISPA ringan"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Catatan dokter</span>
        <textarea
          required
          value={form.catatan_dokter}
          onChange={(event) => updateField("catatan_dokter", event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#0a4778]"
          placeholder="Ringkasan pemeriksaan, instruksi, dan saran kontrol"
        />
      </label>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#0a4778]">
            <Pill className="h-4 w-4" />
            Resep Obat
          </h3>
          <button
            type="button"
            onClick={addPrescription}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#0a4778] hover:bg-sky-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah
          </button>
        </div>

        <div className="space-y-3">
          {form.resep_obat.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-lg bg-white p-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                value={item.detail_obat}
                onChange={(event) => updatePrescription(index, "detail_obat", event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0a4778]"
                placeholder="Nama obat"
              />
              <input
                value={item.dosis}
                onChange={(event) => updatePrescription(index, "dosis", event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0a4778]"
                placeholder="Dosis dan aturan pakai"
              />
              <button
                type="button"
                onClick={() => removePrescription(index)}
                disabled={form.resep_obat.length === 1}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Hapus resep"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#0a4778] px-5 py-3 text-sm font-bold text-white hover:bg-[#073e69] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Menyimpan..." : "Simpan Rekam Medis"}
        </button>
      </div>
    </form>
  );
}

function PatientVisitSummary({ booking }) {
  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
      <SummaryItem label="Pasien" value={booking.pasien_nama} />
      <SummaryItem label="Tanggal" value={formatDate(booking.tanggal_kunjungan)} />
      <SummaryItem label="Jam" value={`${formatTime(booking.jam_slot)} WIB`} />
      <SummaryItem label="NIK" value={booking.nik || "-"} />
      <SummaryItem label="No. Antrean" value={`#${booking.nomor_antrean}`} />
      <SummaryItem label="Status" value={booking.status_booking} />
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-navy">{value}</p>
    </div>
  );
}

function DetailBlock({ label, value, strong = false }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 whitespace-pre-line text-sm leading-6 ${strong ? "font-bold text-navy" : "text-slate-700"}`}>
        {value || "-"}
      </p>
    </div>
  );
}
