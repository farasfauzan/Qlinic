import { Router } from "express";
import { pool, withTransaction } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertRequired, HttpError } from "../utils/httpError.js";

const router = Router();
const allowedStatuses = ["Pending", "Done", "Cancelled"];

const bookingSelect = `
  SELECT b.*, ps.nama AS pasien_nama, ps.nik, ps.no_telp AS pasien_no_telp,
         d.nama AS dokter_nama, d.spesialisasi, d.jadwal_praktik,
         p.nama_poli
  FROM booking_antrean b
  JOIN pasien ps ON ps.id = b.id_pasien
  JOIN dokter d ON d.id = b.id_dokter
  LEFT JOIN poliklinik p ON p.id = d.id_poli
`;

async function getBookingById(id) {
  const [rows] = await pool.query(`${bookingSelect} WHERE b.id = ? LIMIT 1`, [id]);
  return rows[0];
}

function ensureBookingAccess(user, booking) {
  if (user.role === "admin") return;
  if (user.role === "pasien" && booking.id_pasien === user.id) return;
  if (user.role === "dokter" && booking.id_dokter === user.id) return;
  throw new HttpError(403, "Anda tidak memiliki akses ke booking ini");
}

router.post(
  "/",
  authenticate,
  authorize("pasien"),
  asyncHandler(async (req, res) => {
    assertRequired(req.body, ["id_dokter", "tanggal_kunjungan", "jam_slot"]);
    const { id_dokter, tanggal_kunjungan, jam_slot } = req.body;

    const bookingId = await withTransaction(async (connection) => {
      const [doctorRows] = await connection.query("SELECT id FROM dokter WHERE id = ? LIMIT 1 FOR UPDATE", [
        id_dokter
      ]);
      if (!doctorRows[0]) {
        throw new HttpError(404, "Dokter tidak ditemukan");
      }

      const [slotRows] = await connection.query(
        `SELECT id FROM booking_antrean
         WHERE id_dokter = ? AND tanggal_kunjungan = ? AND jam_slot = ?
           AND status_booking IN ('Pending', 'Done')
         FOR UPDATE`,
        [id_dokter, tanggal_kunjungan, jam_slot]
      );

      if (slotRows.length) {
        throw new HttpError(409, "Slot sudah terpakai. Silakan pilih jam lain.");
      }

      const [queueRows] = await connection.query(
        `SELECT COUNT(*) AS total
         FROM booking_antrean
         WHERE id_dokter = ? AND tanggal_kunjungan = ?`,
        [id_dokter, tanggal_kunjungan]
      );
      const nomorAntrean = Number(queueRows[0].total) + 1;

      const [insertResult] = await connection.query(
        `INSERT INTO booking_antrean
         (id_pasien, id_dokter, tanggal_kunjungan, jam_slot, nomor_antrean, status_booking)
         VALUES (?, ?, ?, ?, ?, 'Pending')`,
        [req.user.id, id_dokter, tanggal_kunjungan, jam_slot, nomorAntrean]
      );

      return insertResult.insertId;
    });

    const data = await getBookingById(bookingId);
    res.status(201).json({
      success: true,
      message: "Booking berhasil dibuat",
      data
    });
  })
);

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const { tanggal, status, id_dokter } = req.query;
    const params = [];
    const conditions = [];

    if (req.user.role === "pasien") {
      conditions.push("b.id_pasien = ?");
      params.push(req.user.id);
    }

    if (req.user.role === "dokter") {
      conditions.push("b.id_dokter = ?");
      params.push(req.user.id);
    }

    if (tanggal) {
      conditions.push("b.tanggal_kunjungan = ?");
      params.push(tanggal);
    }

    if (status) {
      conditions.push("b.status_booking = ?");
      params.push(status);
    }

    if (id_dokter && req.user.role === "admin") {
      conditions.push("b.id_dokter = ?");
      params.push(id_dokter);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await pool.query(
      `${bookingSelect} ${where}
       ORDER BY b.tanggal_kunjungan DESC, b.nomor_antrean ASC`,
      params
    );

    res.json({ success: true, data: rows });
  })
);

router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const booking = await getBookingById(req.params.id);
    if (!booking) {
      throw new HttpError(404, "Booking tidak ditemukan");
    }

    ensureBookingAccess(req.user, booking);
    res.json({ success: true, data: booking });
  })
);

router.put(
  "/:id/status",
  authenticate,
  authorize("admin", "dokter"),
  asyncHandler(async (req, res) => {
    assertRequired(req.body, ["status_booking"]);
    const { status_booking } = req.body;

    if (!allowedStatuses.includes(status_booking)) {
      throw new HttpError(400, "Status booking tidak valid");
    }

    const booking = await getBookingById(req.params.id);
    if (!booking) {
      throw new HttpError(404, "Booking tidak ditemukan");
    }

    if (req.user.role === "dokter") {
      ensureBookingAccess(req.user, booking);
      if (status_booking !== "Done") {
        throw new HttpError(403, "Dokter hanya dapat menyelesaikan booking");
      }
    }

    const [result] = await pool.query(
      "UPDATE booking_antrean SET status_booking = ? WHERE id = ?",
      [status_booking, req.params.id]
    );

    if (!result.affectedRows) {
      throw new HttpError(404, "Booking tidak ditemukan");
    }

    res.json({ success: true, message: "Status booking berhasil diperbarui" });
  })
);

router.put(
  "/:id/cancel",
  authenticate,
  authorize("pasien", "admin"),
  asyncHandler(async (req, res) => {
    const booking = await getBookingById(req.params.id);
    if (!booking) {
      throw new HttpError(404, "Booking tidak ditemukan");
    }

    if (req.user.role === "pasien" && booking.id_pasien !== req.user.id) {
      throw new HttpError(403, "Pasien hanya dapat membatalkan booking miliknya");
    }

    if (booking.status_booking !== "Pending") {
      throw new HttpError(400, "Booking hanya bisa dibatalkan saat status masih Pending");
    }

    await pool.query("UPDATE booking_antrean SET status_booking = 'Cancelled' WHERE id = ?", [
      req.params.id
    ]);

    res.json({ success: true, message: "Booking berhasil dibatalkan" });
  })
);

export default router;
