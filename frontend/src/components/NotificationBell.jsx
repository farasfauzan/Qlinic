import { useEffect, useState } from "react";
import { api } from "../api/client";

export function NotificationBell({ fallbackItems = [] }) {
    const hasFallback = fallbackItems.length > 0;
    const [unreadCount, setUnreadCount] = useState(hasFallback ? fallbackItems.filter(i => !i.is_read).length : 0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [notifications, setNotifications] = useState(fallbackItems);

    useEffect(() => {
        async function loadNotifications() {
            if (hasFallback) {
                setNotifications(current => current.length ? current : fallbackItems);
                setUnreadCount(current => current);
                return;
            }
            try {
                const response = await api.get("/notifikasi/", { params: { unread: "1" } });
                setNotifications(response.data.data || []);
                setUnreadCount(response.data.meta?.unread || 0);
            } catch (error) {
                // Silently fail - notifications not critical
            }
        }
        loadNotifications();
    }, [hasFallback, fallbackItems]);

    const markAsRead = async (id) => {
        if (hasFallback) {
             setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
             setUnreadCount(prev => Math.max(0, prev - 1));
             return;
        }
        try {
            await api.put(`/notifikasi/${id}/read`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            // Silently fail
        }
    };

    const markAllAsRead = async () => {
        if (hasFallback) {
             setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
             setUnreadCount(0);
             return;
        }
        try {
            await api.put("/notifikasi/read-all");
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            // Silently fail
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-slate-400 hover:text-[#0a4778]"
                aria-label="Notifikasi"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#0a4778] text-[10px] text-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 p-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-[#12385d]">Notifikasi</h3>
                            {notifications.length > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllAsRead}
                                    className="text-xs font-semibold text-[#0a4778] hover:underline"
                                >
                                    Tandai semua dibaca
                                </button>
                            )}
                        </div>
                    </div>

                    {notifications.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className="border-b border-slate-100 p-3 hover:bg-slate-50"
                                >
                                    <p className="text-xs font-semibold text-[#0a4778]">{notif.judul}</p>
                                    <p className="mt-1 text-sm text-slate-600">{notif.pesan}</p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        {new Date(notif.created_at).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                    </p>
                                    {!notif.is_read && (
                                        <button
                                            type="button"
                                            onClick={() => markAsRead(notif.id)}
                                            className="mt-2 w-full rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-[#0a4778] hover:bg-sky-100"
                                        >
                                            Tandai dibaca
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center">
                            <p className="text-sm text-slate-500">Belum ada notifikasi</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
