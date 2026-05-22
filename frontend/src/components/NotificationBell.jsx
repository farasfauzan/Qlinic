import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";

const POLL_INTERVAL_MS = 30000;

const jenisLabel = {
    booking_created: "Booking dibuat",
    booking_cancelled: "Booking dibatalkan",
    booking_done: "Pemeriksaan selesai",
    rekam_medis: "Rekam medis"
};

export function NotificationBell({ fallbackItems = [] }) {
    const hasFallback = fallbackItems.length > 0;
    const [items, setItems] = useState(fallbackItems);
    const [unread, setUnread] = useState(fallbackItems.filter((item) => !item.is_read).length);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [marking, setMarking] = useState(false);
    const containerRef = useRef(null);

    async function load() {
        if (hasFallback) {
            setItems((current) => (current.length ? current : fallbackItems));
            setUnread((current) => current);
            return;
        }
        try {
            const response = await api.get("/notifikasi");
            setItems(response.data || []);
            setUnread(response.meta?.unread || 0);
        } catch {
            // diam-diam saja, jangan ganggu UI utama
        }
    }

    useEffect(() => {
        load();
        const interval = setInterval(load, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [hasFallback]);

    useEffect(() => {
        function onClickOutside(event) {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener("mousedown", onClickOutside);
        }
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [open]);

    async function toggleOpen() {
        const next = !open;
        setOpen(next);
        if (next) {
            setLoading(true);
            try {
                await load();
            } finally {
                setLoading(false);
            }
        }
    }

    async function markOneRead(item) {
        if (item.is_read) return;
        if (hasFallback) {
            setItems((prev) =>
                prev.map((row) => (row.id === item.id ? { ...row, is_read: 1 } : row))
            );
            setUnread((value) => Math.max(0, value - 1));
            return;
        }
        try {
            await api.put(`/notifikasi/${item.id}/read`);
            setItems((prev) =>
                prev.map((row) => (row.id === item.id ? { ...row, is_read: 1 } : row))
            );
            setUnread((value) => Math.max(0, value - 1));
        } catch {
            // abaikan kegagalan; dapat dicoba ulang lewat refresh
        }
    }

    async function markAllRead() {
        if (!unread || marking) return;
        setMarking(true);
        if (hasFallback) {
            setItems((prev) => prev.map((row) => ({ ...row, is_read: 1 })));
            setUnread(0);
            setMarking(false);
            return;
        }
        try {
            await api.put("/notifikasi/read-all");
            setItems((prev) => prev.map((row) => ({ ...row, is_read: 1 })));
            setUnread(0);
        } finally {
            setMarking(false);
        }
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={toggleOpen}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-[#0a4778] ring-1 ring-sky-100 transition hover:bg-sky-100"
                aria-label="Notifikasi"
                title="Notifikasi"
            >
                <Bell className="h-4 w-4" />
                {unread > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                        {unread > 9 ? "9+" : unread}
                    </span>
                ) : null}
            </button>

            {open ? (
                <div className="absolute right-0 z-40 mt-2 w-80 max-w-[92vw] rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-[#12385d]">Notifikasi</p>
                        <button
                            type="button"
                            onClick={markAllRead}
                            disabled={!unread || marking}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a4778] transition hover:text-[#052f50] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {marking ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <CheckCheck className="h-3.5 w-3.5" />
                            )}
                            Tandai semua
                        </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-slate-500">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Memuat...
                            </div>
                        ) : items.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-slate-500">
                                Belum ada notifikasi.
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {items.map((item) => (
                                    <li
                                        key={item.id}
                                        className={`px-4 py-3 transition hover:bg-sky-50/40 ${item.is_read ? "" : "bg-sky-50/60"
                                            }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => markOneRead(item)}
                                            className="flex w-full items-start gap-3 text-left"
                                        >
                                            <span
                                                className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${item.is_read ? "bg-slate-300" : "bg-rose-500"
                                                    }`}
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-center justify-between gap-2">
                                                    <span className="truncate text-sm font-semibold text-[#12385d]">
                                                        {item.judul}
                                                    </span>
                                                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                                        {jenisLabel[item.jenis] || item.jenis}
                                                    </span>
                                                </span>
                                                <span className="mt-1 block text-xs leading-5 text-slate-600">
                                                    {item.pesan}
                                                </span>
                                                <span className="mt-1 block text-[11px] text-slate-400">
                                                    {formatRelative(item.created_at)}
                                                </span>
                                            </span>
                                            {!item.is_read ? (
                                                <Check className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
                                            ) : null}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function formatRelative(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} hari lalu`;
    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}
