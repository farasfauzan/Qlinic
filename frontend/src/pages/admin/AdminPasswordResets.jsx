import { CheckCircle2, Clipboard, KeyRound, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../api/client";
import { Modal } from "../../components/Modal";
import { EmptyState, LoadingState } from "../../components/States";
import { DashboardLayout } from "../../layouts/DashboardLayout";

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusClass(status) {
  const map = {
    PENDING: "bg-amber-100 text-amber-800 ring-amber-200",
    APPROVED: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    CANCELLED: "bg-slate-100 text-slate-700 ring-slate-200"
  };

  return map[status] || "bg-slate-100 text-slate-700 ring-slate-200";
}

export default function AdminPasswordResets() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  async function loadRequests(nextStatus = status) {
    setLoading(true);
    try {
      const response = await api.get(`/auth/password-reset-requests?status=${nextStatus}`);
      setRequests(response.data);
    } catch (error) {
      toast.error(error.message || "Gagal memuat permintaan reset");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests(status);
  }, [status]);

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return requests;

    return requests.filter((item) =>
      [item.code, item.nama, item.email, item.requester_role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [requests, search]);

  async function approveRequest(request) {
    if (!window.confirm(`Setujui reset password untuk kode ${request.code}?`)) return;

    setApprovingId(request.id);
    try {
      const response = await api.patch(`/auth/password-reset-requests/${request.id}/approve`);
      setTemporaryPassword({
        code: response.data.code,
        password: response.data.temporaryPassword,
        nama: request.nama,
        role: request.requester_role
      });
      toast.success("Password sementara berhasil dibuat");
      await loadRequests(status);
    } catch (error) {
      toast.error(error.message || "Gagal menyetujui reset password");
    } finally {
      setApprovingId(null);
    }
  }

  const headerActions = (
    <button
      type="button"
      onClick={() => loadRequests(status)}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50"
    >
      <RefreshCw className="h-4 w-4" />
      Refresh
    </button>
  );

  return (
    <DashboardLayout
      title="Permintaan Reset"
      subtitle="Cari kode reset dari pasien atau dokter, lalu setujui untuk membuat password sementara."
      headerActions={headerActions}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-medium text-navy outline-none transition focus:border-[#0a4778] focus:ring-2 focus:ring-sky-100"
            placeholder="Cari kode, nama, atau email"
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-navy outline-none transition focus:border-[#0a4778] focus:ring-2 focus:ring-sky-100"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="ALL">Semua Status</option>
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : filteredRequests.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {["Kode", "Pemohon", "Role", "Status", "Dibuat", "Aksi"].map((head) => (
                    <th
                      key={head}
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-1.5 font-mono text-sm font-bold text-[#0a4778]">
                        <KeyRound className="h-4 w-4" />
                        {request.code}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-navy">{request.nama}</p>
                      <p className="text-xs text-slate-500">{request.email}</p>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold capitalize text-slate-700">
                      {request.requester_role}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClass(request.status)}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDateTime(request.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      {request.status === "PENDING" ? (
                        <button
                          type="button"
                          onClick={() => approveRequest(request)}
                          disabled={approvingId === request.id}
                          className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {approvingId === request.id ? "Menyetujui..." : "Setujui"}
                        </button>
                      ) : (
                        <span className="text-sm text-slate-400">Kode hangus</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState title="Tidak ada permintaan reset" description="Coba ubah filter status atau kata kunci pencarian." />
      )}

      {temporaryPassword ? (
        <Modal title="Password Sementara" onClose={() => setTemporaryPassword(null)}>
          <div className="space-y-5">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
              Reset untuk {temporaryPassword.nama} ({temporaryPassword.role}) sudah disetujui.
              Berikan password sementara ini ke pemohon.
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Kode Reset</p>
              <p className="mt-1 font-mono text-lg font-bold text-navy">{temporaryPassword.code}</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">Password Sementara</p>
              <p className="mt-1 break-all font-mono text-2xl font-bold text-[#0a4778]">
                {temporaryPassword.password}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(temporaryPassword.password)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 font-semibold text-white hover:bg-slate-800"
            >
              <Clipboard className="h-5 w-5" />
              Salin Password
            </button>
          </div>
        </Modal>
      ) : null}
    </DashboardLayout>
  );
}
