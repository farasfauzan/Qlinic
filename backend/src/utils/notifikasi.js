const monthNamesId = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"
];

function formatTanggalIndo(value) {
    if (!value) return "-";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return `${date.getDate()} ${monthNamesId[date.getMonth()]} ${date.getFullYear()}`;
}

function formatJam(value) {
    if (!value) return "-";
    const text = String(value);
    return text.length >= 5 ? text.slice(0, 5) : text;
}

/**
 * Insert a single notifikasi row.
 *
 * @param {import("mysql2/promise").Pool | import("mysql2/promise").PoolConnection} executor
 * @param {{
 *   id_pasien: number,
 *   id_booking?: number | null,
 *   jenis: 'booking_created' | 'booking_cancelled' | 'booking_done' | 'rekam_medis',
 *   judul: string,
 *   pesan: string
 * }} payload
 */
export async function createNotifikasi(executor, payload) {
    const { id_pasien, id_booking = null, jenis, judul, pesan } = payload;
    if (!id_pasien || !jenis || !judul || !pesan) return null;

    try {
        const [result] = await executor.query(
            `INSERT INTO notifikasi (id_pasien, id_booking, jenis, judul, pesan)
       VALUES (?, ?, ?, ?, ?)`,
            [id_pasien, id_booking, jenis, judul, pesan]
        );
        return result.insertId;
    } catch (error) {
        // Notifikasi tidak boleh memutus alur utama. Cukup log.
        // eslint-disable-next-line no-console
        console.error("[notifikasi] gagal menyimpan:", error.message);
        return null;
    }
}

export function buildBookingCreatedMessage(booking) {
    return {
        judul: "Booking berhasil dibuat",
        pesan: `Janji temu dengan ${booking.dokter_nama || "dokter"} pada ${formatTanggalIndo(
            booking.tanggal_kunjungan
        )} pukul ${formatJam(booking.jam_slot)} berhasil dibuat. Nomor antrean Anda: ${booking.nomor_antrean
            }.`
    };
}

export function buildBookingCancelledMessage(booking) {
    return {
        judul: "Booking dibatalkan",
        pesan: `Janji temu dengan ${booking.dokter_nama || "dokter"} pada ${formatTanggalIndo(
            booking.tanggal_kunjungan
        )} pukul ${formatJam(booking.jam_slot)} telah dibatalkan.`
    };
}

export function buildBookingDoneMessage(booking) {
    return {
        judul: "Pemeriksaan selesai",
        pesan: `Sesi konsultasi dengan ${booking.dokter_nama || "dokter"} pada ${formatTanggalIndo(
            booking.tanggal_kunjungan
        )} telah selesai. Silakan cek rekam medis Anda.`
    };
}

export function buildRekamMedisMessage(booking) {
    return {
        judul: "Rekam medis baru tersedia",
        pesan: `Dokter telah menambahkan rekam medis untuk kunjungan pada ${formatTanggalIndo(
            booking.tanggal_kunjungan
        )}. Buka halaman Rekam Medis untuk melihat detailnya.`
    };
}
