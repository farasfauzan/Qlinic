import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";
import { DoctorLayout } from "../../layouts/DoctorLayout";
import { formatDate } from "../../utils";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const initialSchedule = {
  Senin: { active: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }] },
  Selasa: { active: true, slots: [{ start: "09:00", end: "15:00" }] },
  Rabu: { active: false, slots: [] },
  Kamis: { active: true, slots: [{ start: "10:00", end: "14:00" }] },
  Jumat: { active: true, slots: [{ start: "13:00", end: "18:00" }] },
  Sabtu: { active: false, slots: [] },
  Minggu: { active: false, slots: [] }
};

export default function DoctorSchedule() {
  const { user, refreshUser } = useAuth();
  const [schedule, setSchedule] = useState(initialSchedule);
  const [saving, setSaving] = useState(false);
  
  const cutiKey = user?.id ? `qlinic_dokter_cuti_${user.id}` : null;
  const [cutiDates, setCutiDates] = useState([]);
  const [cutiToRemove, setCutiToRemove] = useState(null);

  // Month navigation for visual calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    // Attempt to parse existing jadwal_praktik if we implemented a JSON-like string, 
    // but for now, we'll just use the default visual state to match the wireframe perfectly
    // and override it on save.
    if (user?.jadwal_praktik) {
      try {
        const parsed = JSON.parse(user.jadwal_praktik);
        if (parsed && typeof parsed === "object" && parsed.Senin) {
          setSchedule(parsed);
        }
      } catch (e) {
        // Fallback to default if it's just a raw string
      }
    }
  }, [user?.jadwal_praktik]);

  useEffect(() => {
    if (!cutiKey) return;
    try {
      const stored = JSON.parse(localStorage.getItem(cutiKey) || "[]");
      if (Array.isArray(stored)) setCutiDates(stored);
    } catch {
      setCutiDates([]);
    }
  }, [cutiKey]);

  function persistCuti(next) {
    setCutiDates(next);
    if (cutiKey) {
      localStorage.setItem(cutiKey, JSON.stringify(next));
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Serialize schedule object to JSON string to save in DB
      const serialized = JSON.stringify(schedule);
      await api.put("/dokter/me/jadwal", { jadwal_praktik: serialized });
      toast.success("Jadwal praktik berhasil diperbarui");
      if (refreshUser) await refreshUser();
    } catch (error) {
      toast.error(error.message || "Gagal memperbarui jadwal");
    } finally {
      setSaving(false);
    }
  }

  const toggleDay = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], active: !prev[day].active }
    }));
  };

  const removeSlot = (day, index) => {
    setSchedule(prev => {
      const newSlots = [...prev[day].slots];
      newSlots.splice(index, 1);
      return { ...prev, [day]: { ...prev[day], slots: newSlots } };
    });
  };

  const addSlot = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], slots: [...prev[day].slots, { start: "08:00", end: "12:00" }] }
    }));
  };

  const updateSlot = (day, index, field, value) => {
    setSchedule(prev => {
      const newSlots = prev[day].slots.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, [field]: value } : slot
      );
      return { ...prev, [day]: { ...prev[day], slots: newSlots } };
    });
  };

  const toggleCuti = (dateStr) => {
    if (cutiDates.includes(dateStr)) {
      persistCuti(cutiDates.filter(d => d !== dateStr));
    } else {
      persistCuti([...cutiDates, dateStr].sort());
    }
  };

  function confirmRemoveCuti() {
    if (!cutiToRemove) return;
    persistCuti(cutiDates.filter((item) => item !== cutiToRemove));
    setCutiToRemove(null);
    toast.success("Hari cuti dihapus");
  }

  // Generate calendar days for visual calendar
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Pad empty slots before 1st day (assuming week starts on Sunday)
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const calendarDays = getCalendarDays();
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const totalSlots = useMemo(
    () => DAYS.reduce((total, day) => total + (schedule[day].active ? schedule[day].slots.length : 0), 0),
    [schedule]
  );
  const activeDays = useMemo(
    () => DAYS.filter((day) => schedule[day].active).length,
    [schedule]
  );

  return (
    <DoctorLayout
      title="Kelola Jadwal Praktik"
      subtitle="Konfigurasi waktu operasional dan ketersediaan praktik Anda."
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
         <div>
            <h1 className="text-2xl font-bold text-navy">Kelola Jadwal Praktik</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Konfigurasi waktu operasional dan ketersediaan praktik Anda.</p>
         </div>
         <button 
           onClick={handleSave} 
           disabled={saving}
           className="bg-[#0a4778] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-[#073e69] transition disabled:opacity-70"
         >
           {saving ? "Menyimpan..." : "Simpan Perubahan"}
         </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-8">
         
         {/* Left Panel: Weekly Availability */}
         <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit">
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-navy mb-6">
              <CalendarDays className="w-5 h-5 text-slate-400" /> Weekly Availability
            </h2>

            <div className="space-y-4">
               {DAYS.map(day => (
                 <div key={day} className={`flex items-start gap-4 p-4 rounded-xl border ${schedule[day].active ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/50'}`}>
                    
                    <div className="flex items-center gap-3 w-32 shrink-0 pt-1">
                       {/* Toggle Switch */}
                       <button 
                         onClick={() => toggleDay(day)}
                         className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${schedule[day].active ? 'bg-[#0a4778]' : 'bg-slate-200'}`}
                       >
                         <span className="sr-only">Use setting</span>
                         <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${schedule[day].active ? 'translate-x-2' : '-translate-x-2'}`} />
                       </button>
                       <span className={`text-sm font-bold ${schedule[day].active ? 'text-navy' : 'text-slate-400'}`}>{day}</span>
                    </div>

                    <div className="flex-1 flex flex-wrap gap-2">
                       {schedule[day].active ? (
                         <>
                           {schedule[day].slots.map((slot, index) => (
                             <div key={index} className="flex items-center bg-sky-50 border border-[#0a4778]/10 rounded-lg overflow-hidden h-9">
                                <input 
                                  type="time" 
                                  value={slot.start} 
                                  onChange={(e) => updateSlot(day, index, 'start', e.target.value)}
                                  className="bg-transparent text-xs font-bold text-[#0a4778] outline-none px-2 w-[70px]"
                                />
                                <span className="text-[#0a4778] font-bold">-</span>
                                <input 
                                  type="time" 
                                  value={slot.end} 
                                  onChange={(e) => updateSlot(day, index, 'end', e.target.value)}
                                  className="bg-transparent text-xs font-bold text-[#0a4778] outline-none px-2 w-[70px]"
                                />
                                <button 
                                  onClick={() => removeSlot(day, index)}
                                  className="h-full px-2 text-[#0a4778] hover:bg-[#0a4778]/10 transition border-l border-[#0a4778]/10"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                             </div>
                           ))}
                           <button 
                             onClick={() => addSlot(day)}
                             className="h-9 w-9 flex items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400 hover:bg-slate-50 hover:text-navy transition"
                           >
                             <Plus className="w-4 h-4" />
                           </button>
                         </>
                       ) : (
                         <span className="text-sm font-medium text-slate-400 pt-1">Tidak ada jadwal praktik</span>
                       )}
                    </div>
                 </div>
               ))}
            </div>
         </section>

         {/* Right Panel: Summary & Calendar */}
         <div className="space-y-6">
            
            {/* Summary Card */}
            <section className="bg-[#0a4778] rounded-xl p-6 text-white shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
               <h3 className="text-xs font-bold uppercase tracking-wider text-sky-100 mb-6">Ringkasan Slot Pekan Depan</h3>
               
               <div className="flex items-end gap-3 mb-8">
                 <span className="text-5xl font-bold">{totalSlots}</span>
                 <span className="text-sm font-medium text-sky-100 pb-1">Total Slot</span>
               </div>

               <div className="space-y-4">
                 <div>
                   <div className="flex justify-between text-xs font-bold mb-2">
                     <span>Hari Aktif</span>
                     <span>{activeDays} Hari</span>
                   </div>
                   <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                     <div className="h-full bg-sky-400 rounded-full" style={{ width: `${(activeDays / DAYS.length) * 100}%` }}></div>
                   </div>
                 </div>
                 
                 <div>
                   <div className="flex justify-between text-xs font-bold mb-2 text-sky-100">
                     <span>Cuti</span>
                     <span>{cutiDates.length} Hari</span>
                   </div>
                   <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                     <div className="h-full bg-[#58b9f6] rounded-full" style={{ width: `${Math.min(cutiDates.length * 12, 100)}%` }}></div>
                   </div>
                 </div>
               </div>
            </section>

            {/* Cuti & Libur Calendar */}
            <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="flex items-center gap-2 text-sm font-bold text-navy">
                   <CalendarDays className="w-4 h-4 text-red-500" /> Cuti & Libur
                 </h3>
                 <button
                   type="button"
                   onClick={() => {
                     const today = new Date();
                     const year = today.getFullYear();
                     const month = String(today.getMonth() + 1).padStart(2, "0");
                     const day = String(today.getDate()).padStart(2, "0");
                     toggleCuti(`${year}-${month}-${day}`);
                   }}
                   className="text-xs font-bold text-[#0a4778] hover:underline"
                 >
                   Tandai Hari Ini
                 </button>
               </div>

               {/* Custom Visual Calendar */}
               <div className="border border-slate-100 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <button 
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                      className="p-1 hover:bg-slate-50 rounded"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-400" />
                    </button>
                    <span className="text-sm font-bold text-navy">
                      {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                    </span>
                    <button 
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                      className="p-1 hover:bg-slate-50 rounded"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {weekDays.map(day => (
                      <div key={day} className="text-[10px] font-bold text-slate-400">{day}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((date, idx) => {
                      if (!date) return <div key={idx} className="h-8"></div>;
                      
                      // Format to YYYY-MM-DD local time for cuti comparison
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, "0");
                      const day = String(date.getDate()).padStart(2, "0");
                      const dateStr = `${year}-${month}-${day}`;
                      
                      const isSelected = cutiDates.includes(dateStr);
                      const isToday = new Date().toDateString() === date.toDateString();

                      return (
                        <button
                          key={idx}
                          onClick={() => toggleCuti(dateStr)}
                          className={`h-8 rounded-full text-xs font-bold transition flex items-center justify-center
                            ${isSelected ? 'bg-red-100 text-red-600 border border-red-200' : 
                              isToday ? 'bg-sky-50 text-[#0a4778] border border-sky-200' : 'text-slate-600 hover:bg-slate-50'}
                          `}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
               </div>

               {/* Selected Cuti List */}
               <div className="space-y-2">
                 {cutiDates.length > 0 ? cutiDates.map((date) => (
                   <div key={date} className="flex items-center justify-between bg-red-50/50 border border-red-100 rounded-lg p-3">
                     <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cuti Tahunan</p>
                       <p className="text-xs font-bold text-red-600">{formatDate(date)}</p>
                     </div>
                     <button 
                       onClick={() => setCutiToRemove(date)}
                       className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 )) : (
                   <div className="text-center p-3 text-xs font-medium text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
                     Belum ada jadwal cuti.
                   </div>
                 )}
               </div>
            </section>

         </div>
      </div>

      {cutiToRemove ? (
        <ConfirmDialog
          title="Hapus hari cuti?"
          description="Tanggal akan dihapus dari daftar cuti Anda. Anda dapat menambahkannya kembali kapan saja."
          details={[{ label: "Tanggal", value: formatDate(cutiToRemove) }]}
          confirmLabel="Ya, hapus"
          cancelLabel="Batal"
          tone="danger"
          onConfirm={confirmRemoveCuti}
          onCancel={() => setCutiToRemove(null)}
        />
      ) : null}
    </DoctorLayout>
  );
}
