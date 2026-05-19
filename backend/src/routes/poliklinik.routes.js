import { Router } from "express";
import { pool } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertRequired, HttpError } from "../utils/httpError.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.query("SELECT * FROM poliklinik ORDER BY nama_poli ASC");
    res.json({ success: true, data: rows });
  })
);

router.post(
  "/",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    assertRequired(req.body, ["nama_poli", "deskripsi", "kapasitas"]);
    const { nama_poli, deskripsi, kapasitas } = req.body;
    const [result] = await pool.query(
      "INSERT INTO poliklinik (nama_poli, deskripsi, kapasitas) VALUES (?, ?, ?)",
      [nama_poli, deskripsi, kapasitas]
    );

    res.status(201).json({
      success: true,
      message: "Poliklinik berhasil ditambahkan",
      data: { id: result.insertId }
    });
  })
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    assertRequired(req.body, ["nama_poli", "deskripsi", "kapasitas"]);
    const { nama_poli, deskripsi, kapasitas } = req.body;
    const [result] = await pool.query(
      `UPDATE poliklinik
       SET nama_poli = ?, deskripsi = ?, kapasitas = ?
       WHERE id = ?`,
      [nama_poli, deskripsi, kapasitas, req.params.id]
    );

    if (!result.affectedRows) {
      throw new HttpError(404, "Poliklinik tidak ditemukan");
    }

    res.json({ success: true, message: "Poliklinik berhasil diperbarui" });
  })
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const [result] = await pool.query("DELETE FROM poliklinik WHERE id = ?", [req.params.id]);

    if (!result.affectedRows) {
      throw new HttpError(404, "Poliklinik tidak ditemukan");
    }

    res.json({ success: true, message: "Poliklinik berhasil dihapus" });
  })
);

export default router;
