import {
  AlertTriangle,
  Banknote,
  Calendar,
  CalendarDays,
  Download,
  FileText,
  Stethoscope,
  TrendingUp,
  UserPlus
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { api } from "../../api/client";
import { LoadingState } from "../../components/States";
import { DashboardLayout } from "../../layouts/DashboardLayout";

// --- MOCK DATA ---
const chartData = [
  { name: "Sen", online: 30, walkIn: 20 },
  { name: "Sel", online: 45, walkIn: 25 },
  { name: "Rab", online: 40, walkIn: 30 },
  { name: "Kam", online: 50, walkIn: 35 },
  { name: "Jum", online: 70, walkIn: 45 },
  { name: "Sab", online: 90, walkIn: 60 },
  { name: "Min", online: 80, walkIn: 55 }
];

const activities = [
  {
    id: 1,
    title: "Dr. Smith updated his schedule for Poliklinik Umum",
    time: "10 minutes ago",
    icon: <Calendar className="h-4 w-4 text-slate-600" />,
    bg: "bg-slate-100"
  },
  {
    id: 2,
    title: (
      <span>
        New patient <strong>Amanda Rizky</strong> registered through mobile app
      </span>
    ),
    time: "45 minutes ago",
    icon: <UserPlus className="h-4 w-4 text-emerald-600" />,
    bg: "bg-emerald-50"
  },
  {
    id: 3,
    title: "Peak load warning: Internal Medicine queue exceeding 20 patients",
    time: "1 hour ago",
    icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
    bg: "bg-amber-50"
  },
  {
    id: 4,
    title: "Monthly financial report for May 2024 has been generated",
    time: "3 hours ago",
    icon: <FileText className="h-4 w-4 text-clinical" />,
    bg: "bg-sky-50"
  }
];

const queueData = [
  {
    id: 1,
    dept: "General Practitioner",
    doctor: "Dr. Sarah Johnson + 4 others",
    queue: "12 Pasien",
    waitTime: "15 menit",
    status: "Optimal"
  },
  {
    id: 2,
    dept: "Pediatrics",
    doctor: "Dr. Michael Chen + 2 others",
    queue: "8 Pasien",
    waitTime: "25 menit",
    status: "Optimal"
  },
  {
    id: 3,
    dept: "Internal Medicine",
    doctor: "Dr. Robert Smith + 1 other",
    queue: "24 Pasien",
    waitTime: "55 menit",
    status: "High Load"
  },
  {
    id: 4,
    dept: "Cardiology",
    doctor: "Dr. Elena Rodriguez",
    queue: "5 Pasien",
    waitTime: "10 menit",
    status: "Optimal"
  }
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  // We keep this to show loading state simulating API fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const headerActions = (
    <div className="flex items-center gap-3">
      <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
        <Calendar className="h-4 w-4" />
        This Month
      </button>
      <button className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
        <Download className="h-4 w-4" />
        Ekspor Data
      </button>
    </div>
  );

  return (
    <DashboardLayout
      title="Overview Operasional"
      subtitle="Selamat datang kembali, Admin. Berikut ringkasan performa klinik hari ini."
      headerActions={headerActions}
    >
      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">
          {/* Top Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-clinical">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  <TrendingUp className="h-3 w-3" />
                  12.5%
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500">Total Pasien Terdaftar</p>
              <h3 className="mt-1 text-3xl font-bold text-navy">12,482</h3>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-clinical">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  <TrendingUp className="h-3 w-3" />
                  8%
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500">Booking Hari Ini</p>
              <h3 className="mt-1 text-3xl font-bold text-navy">145</h3>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Banknote className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-clinical">
                  Target: 90%
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500">Pendapatan Hari Ini</p>
              <h3 className="mt-1 text-3xl font-bold text-navy">Rp 42.5M</h3>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-clinical">
                  On Duty
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500">Dokter Aktif</p>
              <h3 className="mt-1 text-3xl font-bold text-navy">32 / 45</h3>
            </div>
          </div>

          {/* Middle Section */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Chart */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h3 className="font-bold text-navy">Tren Booking Mingguan</h3>
                  <p className="text-xs text-slate-500">Data kunjungan 7 hari terakhir</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-navy"></span>
                    <span className="text-slate-600">Online</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-300"></span>
                    <span className="text-slate-600">Walk-in</span>
                  </div>
                </div>
              </div>
              <div className="h-72 w-full flex-1 p-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="online"
                      stroke="#0b1f3a"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#0b1f3a", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="walkIn"
                      stroke="#7dd3fc"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#7dd3fc", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <h3 className="font-bold text-navy">Aktivitas Terbaru</h3>
                <button className="text-xs font-semibold text-clinical hover:underline">
                  See all
                </button>
              </div>
              <div className="flex-1 p-5">
                <div className="space-y-6">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${activity.bg}`}
                      >
                        {activity.icon}
                      </div>
                      <div>
                        <p className="text-sm text-slate-700">{activity.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h3 className="font-bold text-navy">Status Antrean Poliklinik</h3>
                <p className="text-xs text-slate-500">
                  Pemantauan real-time beban kerja tiap departemen
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600">Normal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  <span className="text-slate-600">High Load</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">
                      Departemen
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">
                      Dokter Bertugas
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">
                      Total Antrean
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">
                      Waktu Tunggu Rata-rata
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queueData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-navy">{row.dept}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {row.doctor}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        {row.queue}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {row.waitTime}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                            row.status === "Optimal"
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-sm font-bold text-clinical hover:underline">
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
