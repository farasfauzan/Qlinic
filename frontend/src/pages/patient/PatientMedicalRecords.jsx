import { FileText, Pill } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { EmptyState, LoadingState } from "../../components/States";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { formatDate } from "../../utils";

export default function PatientMedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <DashboardLayout title="My Records" subtitle="Riwayat pemeriksaan, diagnosa, catatan dokter, dan resep.">
      {loading ? (
        <LoadingState />
      ) : records.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {records.map((record) => (
            <article key={record.id} className="app-card rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-clinical">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{formatDate(record.tanggal_periksa)}</p>
                  <h2 className="text-lg font-bold text-navy">{record.dokter_nama}</h2>
                  <p className="text-sm text-slate-500">{record.spesialisasi}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <Info label="Keluhan" value={record.keluhan} />
                <Info label="Diagnosa" value={record.diagnosa} />
                <Info label="Catatan Dokter" value={record.catatan_dokter} />
              </div>
              <div className="mt-4 rounded-lg bg-emerald-50 p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold text-emerald-700">
                  <Pill className="h-4 w-4" />
                  Resep Obat
                </div>
                {record.resep_obat?.length ? (
                  <ul className="space-y-2 text-sm text-slate-700">
                    {record.resep_obat.map((item) => (
                      <li key={item.id}>
                        <span className="font-semibold">{item.detail_obat}</span> - {item.dosis}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-600">Tidak ada resep obat.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="Belum ada rekam medis" description="Data dummy seed akan muncul jika database sudah disiapkan." />
      )}
    </DashboardLayout>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value || "-"}</p>
    </div>
  );
}
