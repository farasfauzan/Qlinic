import { Router } from "express";
import { pool } from "../config/db.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

const router = Router();

router.get(
    "/",
    authenticate,
    authorize("pasien"),
    asyncHandler(async (req, res) => {
        const { unread } = req.query;
        const conditions = ["id_pasien = ?"];
        const params = [req.user.id];

        if (unread === "1" || unread === "true") {
            conditions.push("is_read = 0");
        }

        const [rows] = await pool.query(
            `SELECT id, id_booking, jenis, judul, pesan, is_read, created_at
       FROM notifikasi
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC
       LIMIT 50`,
            params
        );

        const [unreadCountRows] = await pool.query(
            "SELECT COUNT(*) AS total FROM notifikasi WHERE id_pasien = ? AND is_read = 0",
            [req.user.id]
        );

        res.json({
            success: true,
            data: rows,
            meta: { unread: Number(unreadCountRows[0].total) || 0 }
        });
    })
);

router.put(
    "/:id/read",
    authenticate,
    authorize("pasien"),
    asyncHandler(async (req, res) => {
        const [result] = await pool.query(
            "UPDATE notifikasi SET is_read = 1 WHERE id = ? AND id_pasien = ?",
            [req.params.id, req.user.id]
        );

        if (!result.affectedRows) {
            throw new HttpError(404, "Notifikasi tidak ditemukan");
        }

        res.json({ success: true, message: "Notifikasi ditandai dibaca" });
    })
);

router.put(
    "/read-all",
    authenticate,
    authorize("pasien"),
    asyncHandler(async (req, res) => {
        await pool.query(
            "UPDATE notifikasi SET is_read = 1 WHERE id_pasien = ? AND is_read = 0",
            [req.user.id]
        );

        res.json({ success: true, message: "Semua notifikasi ditandai dibaca" });
    })
);

export default router;
