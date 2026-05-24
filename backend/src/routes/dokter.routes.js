import bcrypt from "bcryptjs";
import { Router } from "express";
import { pool } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertRequired, HttpError } from "../utils/httpError.js";

const router = Router();
let scheduleColumnReady = false;

const doctorSelect = `
  SELECT d.id, d.id_poli, p.nama_poli, d.nama, d.spesialisasi, d.email,
         d.no_telp, d.jadwal_praktik, d.created_at, d.updated_at
  FROM dokter d
  LEFT JOIN poliklinik p ON p.id = d.id_poli
`;

async function ensureScheduleColumn() {
  if (scheduleColumnReady) return;
  await pool.query("ALTER TABLE dokter MODIFY jadwal_praktik TEXT NOT NULL");
  scheduleColumnReady = true;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search = "", spesialisasi = "", id_poli = "" } = req.query;
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push("(d.nama LIKE ? OR d.spesialisasi LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (spesialisasi) {
      conditions.push("d.spesialisasi = ?");
      params.push(spesialisasi);
    }

    if (id_poli) {
      conditions.push("d.id_poli = ?");
      params.push(id_poli);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await pool.query(`${doctorSelect} ${where} ORDER BY d.nama ASC`, params);

    res.json({ success: true, data: rows });
  })
);

router.put(
  "/me/jadwal",
  authenticate,
  authorize("dokter"),
  asyncHandler(async (req, res) => {
    assertRequired(req.body, ["jadwal_praktik"]);
    const { jadwal_praktik } = req.body;
    const trimmed = String(jadwal_praktik).trim();

    if (!trimmed) {
      throw new HttpError(400, "Jadwal praktik tidak boleh kosong");
    }

    await ensureScheduleColumn();
    const [result] = await pool.query("UPDATE dokter SET jadwal_praktik = ? WHERE id = ?", [
      trimmed,
      req.user.id
    ]);

    if (!result.affectedRows) {
      throw new HttpError(404, "Dokter tidak ditemukan");
    }

    res.json({
      success: true,
      message: "Jadwal praktik berhasil diperbarui",
      data: { jadwal_praktik: trimmed }
    });
  })
);

router.get(
  "/me/bookings",
  authenticate,
  authorize("dokter"),
  asyncHandler(async (req, res) => {
    const { tanggal, status } = req.query;
    const params = [req.user.id];
    const conditions = ["b.id_dokter = ?"];

    if (tanggal) {
      conditions.push("b.tanggal_kunjungan = ?");
      params.push(tanggal);
    }

    if (status) {
      conditions.push("b.status_booking = ?");
      params.push(status);
    }

    const [rows] = await pool.query(
      `SELECT b.*, ps.nama AS pasien_nama, ps.nik, ps.no_telp AS pasien_no_telp
       FROM booking_antrean b
       JOIN pasien ps ON ps.id = b.id_pasien
       WHERE ${conditions.join(" AND ")}
       ORDER BY b.tanggal_kunjungan ASC, b.nomor_antrean ASC`,
      params
    );

    res.json({ success: true, data: rows });
  })
);

router.get(
  "/:id/jadwal",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT d.id, d.nama, d.spesialisasi, d.jadwal_praktik, p.nama_poli
       FROM dokter d
       LEFT JOIN poliklinik p ON p.id = d.id_poli
       WHERE d.id = ?`,
      [req.params.id]
    );

    if (!rows[0]) {
      throw new HttpError(404, "Dokter tidak ditemukan");
    }

    res.json({ success: true, data: rows[0] });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`${doctorSelect} WHERE d.id = ?`, [req.params.id]);

    if (!rows[0]) {
      throw new HttpError(404, "Dokter tidak ditemukan");
    }

    res.json({ success: true, data: rows[0] });
  })
);

router.post(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    assertRequired(req.body, ["nama", "spesialisasi", "email", "no_telp", "id_poli", "jadwal_praktik"]);

    const {
      id_poli,
      nama,
      spesialisasi,
      email,
      no_telp,
      jadwal_praktik,
      password = "doctor123"
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO dokter (id_poli, nama, spesialisasi, email, no_telp, jadwal_praktik, password)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_poli, nama, spesialisasi, email, no_telp, jadwal_praktik, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "Dokter berhasil ditambahkan",
      data: { id: result.insertId }
    });
  })
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    assertRequired(req.body, ["nama", "spesialisasi", "email", "no_telp", "id_poli", "jadwal_praktik"]);

    const { id_poli, nama, spesialisasi, email, no_telp, jadwal_praktik, password } = req.body;
    const fields = [
      "id_poli = ?",
      "nama = ?",
      "spesialisasi = ?",
      "email = ?",
      "no_telp = ?",
      "jadwal_praktik = ?"
    ];
    const params = [id_poli, nama, spesialisasi, email, no_telp, jadwal_praktik];

    if (password) {
      fields.push("password = ?");
      params.push(await bcrypt.hash(password, 10));
    }

    params.push(req.params.id);
    const [result] = await pool.query(
      `UPDATE dokter SET ${fields.join(", ")} WHERE id = ?`,
      params
    );

    if (!result.affectedRows) {
      throw new HttpError(404, "Dokter tidak ditemukan");
    }

    res.json({ success: true, message: "Data dokter berhasil diperbarui" });
  })
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const [result] = await pool.query("DELETE FROM dokter WHERE id = ?", [req.params.id]);

    if (!result.affectedRows) {
      throw new HttpError(404, "Dokter tidak ditemukan");
    }

    res.json({ success: true, message: "Dokter berhasil dihapus" });
  })
);

export default router;
