import { Router } from "express";
import { pool } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertRequired, HttpError } from "../utils/httpError.js";

const router = Router();

const patientFields = "id, nik, nama, email, no_telp, created_at, updated_at";

router.get(
  "/me",
  authenticate,
  authorize("pasien"),
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`SELECT ${patientFields} FROM pasien WHERE id = ?`, [
      req.user.id
    ]);

    if (!rows[0]) {
      throw new HttpError(404, "Pasien tidak ditemukan");
    }

    res.json({ success: true, data: rows[0] });
  })
);

router.get(
  "/bookings",
  authenticate,
  authorize("pasien"),
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT b.*, d.nama AS dokter_nama, d.spesialisasi, d.jadwal_praktik,
              p.nama_poli
       FROM booking_antrean b
       JOIN dokter d ON d.id = b.id_dokter
       LEFT JOIN poliklinik p ON p.id = d.id_poli
       WHERE b.id_pasien = ?
       ORDER BY b.tanggal_kunjungan DESC, b.jam_slot ASC`,
      [req.user.id]
    );

    res.json({ success: true, data: rows });
  })
);

router.get(
  "/medical-records",
  authenticate,
  authorize("pasien"),
  asyncHandler(async (req, res) => {
    const [records] = await pool.query(
      `SELECT rm.*, d.nama AS dokter_nama, d.spesialisasi, b.jam_slot,
              b.nomor_antrean
       FROM rekam_medis rm
       JOIN dokter d ON d.id = rm.id_dokter
       LEFT JOIN booking_antrean b ON b.id = rm.id_booking
       WHERE rm.id_pasien = ?
       ORDER BY rm.tanggal_periksa DESC, rm.created_at DESC`,
      [req.user.id]
    );

    const recordIds = records.map((record) => record.id);
    let prescriptions = [];
    if (recordIds.length) {
      const [rows] = await pool.query(
        `SELECT * FROM resep_obat WHERE id_rekam_medis IN (${recordIds
          .map(() => "?")
          .join(",")})`,
        recordIds
      );
      prescriptions = rows;
    }

    const data = records.map((record) => ({
      ...record,
      resep_obat: prescriptions.filter((item) => item.id_rekam_medis === record.id)
    }));

    res.json({ success: true, data });
  })
);

router.get(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.query(`SELECT ${patientFields} FROM pasien ORDER BY nama ASC`);
    res.json({ success: true, data: rows });
  })
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    assertRequired(req.body, ["nama", "nik", "email", "no_telp"]);
    const { nama, nik, email, no_telp } = req.body;
    const [result] = await pool.query(
      `UPDATE pasien
       SET nama = ?, nik = ?, email = ?, no_telp = ?
       WHERE id = ?`,
      [nama, nik, email, no_telp, req.params.id]
    );

    if (!result.affectedRows) {
      throw new HttpError(404, "Pasien tidak ditemukan");
    }

    res.json({ success: true, message: "Data pasien berhasil diperbarui" });
  })
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const [result] = await pool.query("DELETE FROM pasien WHERE id = ?", [req.params.id]);

    if (!result.affectedRows) {
      throw new HttpError(404, "Pasien tidak ditemukan");
    }

    res.json({ success: true, message: "Pasien berhasil dihapus" });
  })
);

export default router;
