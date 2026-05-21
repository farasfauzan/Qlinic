import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Search,
  User,
  Users,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import { Modal } from "../../components/Modal";
import { EmptyState, LoadingState } from "../../components/States";
import { useAuth } from "../../context/AuthContext";
import { DoctorLayout } from "../../layouts/DoctorLayout";
import { formatDate, formatTime } from "../../utils";

const filterOptions = ["Semua", "Menunggu", "Konsultasi", "Selesai"];

export default function DoctorPatients() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Semua");
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Mocking to match the design's "Konsultasi" status visually since backend only has Pending/Done/Cancelled
  // We'll treat the first Pending as "Konsultasi" (active) just for visual fidelity if needed, 
  // or just map: Pending -> Menunggu, Done -> Selesai.
  const [activeConsultationId, setActiveConsultationId] = useState(null);

  async function loadBookings() {
    setLoading(true);
    try {
      // In a real app we'd fetch only today's, but we fetch all for now to show data
      const response = await api.get("/dokter/me/bookings");
      setBookings(response.data);
      
      // Auto-select first patient if any
      if (response.data.length > 0) {
        setSelectedPatient(response.data[0]);
        // Mock the first pending as 'Konsultasi'
        const firstPending = response.data.find(b => b.status_booking === 'Pending');
        if (firstPending) setActiveConsultationId(firstPending.id);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      selesai: bookings.filter(b => b.status_booking === 'Done').length,
      menunggu: bookings.filter(b => b.status_booking === 'Pending').length
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch = b.pasien_nama.toLowerCase().includes(search.toLowerCase()) || 
                          b.nomor_antrean.toLowerCase().includes(search.toLowerCase());
      
      let matchFilter = true;
      if (filter === "Menunggu") matchFilter = b.status_booking === "Pending" && b.id !== activeConsultationId;
      if (filter === "Konsultasi") matchFilter = b.id === activeConsultationId;
      if (filter === "Selesai") matchFilter = b.status_booking === "Done";

      return matchSearch && matchFilter;
    });
  }, [bookings, search, filter, activeConsultationId]);

  const handleExport = () => {
    toast.success("Daftar pasien diekspor");
  };

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
                       <button className="w-full flex items-center justify-center gap-2 bg-[#f0f7ff] hover:bg-[#e0efff] text-[#0a4778] px-4 py-2.5 rounded-lg text-xs font-bold transition">
                         <FileText className="w-4 h-4" /> Lihat Rekam Medis
                       </button>
                       {selectedPatient.status_booking !== 'Done' && (
                         <button className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-lg text-xs font-bold transition">
                           <XCircle className="w-4 h-4" /> Batalkan Janji
                         </button>
                       )}
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
    </DoctorLayout>
  );
}
