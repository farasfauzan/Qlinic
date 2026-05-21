import { Router } from "express";
import { pool, withTransaction } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertRequired, HttpError } from "../utils/httpError.js";
import { buildRekamMedisMessage, createNotifikasi } from "../utils/notifikasi.js";

const router = Router();

const recordSelect = `
  SELECT rm.*, ps.nama AS pasien_nama, ps.nik,
         d.nama AS dokter_nama, d.spesialisasi,
         b.tanggal_kunjungan, b.jam_slot, b.nomor_antrean
  FROM rekam_medis rm
  JOIN pasien ps ON ps.id = rm.id_pasien
  JOIN dokter d ON d.id = rm.id_dokter
  LEFT JOIN booking_antrean b ON b.id = rm.id_booking
`;

async function attachPrescriptions(records) {
  const ids = records.map((record) => record.id);
  if (!ids.length) return records.map((record) => ({ ...record, resep_obat: [] }));

  const [prescriptions] = await pool.query(
    `SELECT * FROM resep_obat WHERE id_rekam_medis IN (${ids.map(() => "?").join(",")})`,
    ids
  );

  return records.map((record) => ({
    ...record,
    resep_obat: prescriptions.filter((item) => item.id_rekam_medis === record.id)
  }));
}

function ensureRecordAccess(user, record) {
  if (user.role === "admin") return;
  if (user.role === "pasien" && record.id_pasien === user.id) return;
  if (user.role === "dokter" && record.id_dokter === user.id) return;
  throw new HttpError(403, "Anda tidak memiliki akses ke rekam medis ini");
}

router.post(
  "/",
  authenticate,
  authorize("dokter"),
  asyncHandler(async (req, res) => {
    assertRequired(req.body, ["id_booking", "keluhan", "diagnosa", "catatan_dokter"]);
    const { id_booking, keluhan, diagnosa, catatan_dokter, resep_obat = [] } = req.body;

    const recordId = await withTransaction(async (connection) => {
      const [bookingRows] = await connection.query(
        "SELECT * FROM booking_antrean WHERE id = ? LIMIT 1",
        [id_booking]
      );
      const booking = bookingRows[0];

      if (!booking) {
        throw new HttpError(404, "Booking tidak ditemukan");
      }

      if (booking.id_dokter !== req.user.id) {
        throw new HttpError(403, "Dokter hanya dapat mengisi rekam medis pasiennya");
      }

      if (booking.status_booking === "Cancelled") {
        throw new HttpError(400, "Booking yang dibatalkan tidak dapat dibuatkan rekam medis");
      }

      const [existingRecords] = await connection.query(
        "SELECT id FROM rekam_medis WHERE id_booking = ? LIMIT 1",
        [id_booking]
      );
      if (existingRecords[0]) {
        throw new HttpError(409, "Rekam medis untuk booking ini sudah dibuat");
      }

      const [result] = await connection.query(
        `INSERT INTO rekam_medis
         (id_booking, id_pasien, id_dokter, keluhan, diagnosa, catatan_dokter, tanggal_periksa)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id_booking,
          booking.id_pasien,
          booking.id_dokter,
          keluhan,
          diagnosa,
          catatan_dokter,
          booking.tanggal_kunjungan
        ]
      );

      const normalizedPrescriptions = Array.isArray(resep_obat)
        ? resep_obat
        : [{ detail_obat: resep_obat, dosis: req.body.dosis || "" }];

      for (const item of normalizedPrescriptions) {
        if (!item.detail_obat) continue;
        await connection.query(
          "INSERT INTO resep_obat (id_rekam_medis, detail_obat, dosis) VALUES (?, ?, ?)",
          [result.insertId, item.detail_obat, item.dosis || "-"]
        );
      }

      await connection.query("UPDATE booking_antrean SET status_booking = 'Done' WHERE id = ?", [
        id_booking
      ]);

      return result.insertId;
    });

    const [records] = await pool.query(`${recordSelect} WHERE rm.id = ?`, [recordId]);
    const [record] = await attachPrescriptions(records);

    if (record) {
      const { judul, pesan } = buildRekamMedisMessage({
        tanggal_kunjungan: record.tanggal_kunjungan || record.tanggal_periksa
      });
      await createNotifikasi(pool, {
        id_pasien: record.id_pasien,
        id_booking: record.id_booking,
        jenis: "rekam_medis",
        judul,
        pesan
      });
    }

    res.status(201).json({
      success: true,
      message: "Rekam medis berhasil disimpan",
      data: record
    });
  })
);

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const params = [];
    const conditions = [];

    if (req.user.role === "pasien") {
      conditions.push("rm.id_pasien = ?");
      params.push(req.user.id);
    }

    if (req.user.role === "dokter") {
      conditions.push("rm.id_dokter = ?");
      params.push(req.user.id);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [records] = await pool.query(
      `${recordSelect} ${where}
       ORDER BY rm.tanggal_periksa DESC, rm.created_at DESC`,
      params
    );

    res.json({ success: true, data: await attachPrescriptions(records) });
  })
);

router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const [records] = await pool.query(`${recordSelect} WHERE rm.id = ? LIMIT 1`, [
      req.params.id
    ]);
    const record = records[0];

    if (!record) {
      throw new HttpError(404, "Rekam medis tidak ditemukan");
    }

    ensureRecordAccess(req.user, record);
    const [data] = await attachPrescriptions([record]);
    res.json({ success: true, data });
  })
);

export default router;
