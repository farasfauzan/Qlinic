import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { env } from "../config/env.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { assertRequired, HttpError } from "../utils/httpError.js";

const router = Router();

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
}

async function getUserByRole(role, identifier) {
  if (role === "pasien") {
    const [rows] = await pool.query(
      "SELECT id, nama, email, password, 'pasien' AS role FROM pasien WHERE email = ? LIMIT 1",
      [identifier]
    );
    return rows[0];
  }

  if (role === "dokter") {
    const [rows] = await pool.query(
      "SELECT id, nama, email, password, 'dokter' AS role FROM dokter WHERE email = ? LIMIT 1",
      [identifier]
    );
    return rows[0];
  }

  if (role === "admin") {
    const [rows] = await pool.query(
      "SELECT id, username AS nama, username AS email, password, role FROM admin WHERE username = ? LIMIT 1",
      [identifier]
    );
    return rows[0];
  }

  throw new HttpError(400, "Role login tidak dikenali");
}

router.post(
  "/register-pasien",
  asyncHandler(async (req, res) => {
    assertRequired(req.body, ["nama", "nik", "email", "no_telp", "password"]);

    const { nama, nik, email, no_telp, password } = req.body;
    const [existing] = await pool.query(
      "SELECT id FROM pasien WHERE nik = ? OR email = ? LIMIT 1",
      [nik, email]
    );

    if (existing.length) {
      throw new HttpError(409, "NIK atau email sudah terdaftar");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO pasien (nik, nama, email, no_telp, password)
       VALUES (?, ?, ?, ?, ?)`,
      [nik, nama, email, no_telp, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "Registrasi pasien berhasil",
      data: { id: result.insertId, nama, nik, email, no_telp }
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    assertRequired(req.body, ["email", "password", "role"]);

    const { email, password, role } = req.body;
    const normalizedRole = String(role).toLowerCase();
    const user = await getUserByRole(normalizedRole, email);

    if (!user) {
      throw new HttpError(401, "Email/username atau password salah");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new HttpError(401, "Email/username atau password salah");
    }

    const token = signToken({ id: user.id, role: normalizedRole });
    res.json({
      success: true,
      message: "Login berhasil",
      data: {
        token,
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: normalizedRole
        }
      }
    });
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const { id, role } = req.user;
    let rows;

    if (role === "pasien") {
      [rows] = await pool.query(
        "SELECT id, nik, nama, email, no_telp, 'pasien' AS role FROM pasien WHERE id = ?",
        [id]
      );
    } else if (role === "dokter") {
      [rows] = await pool.query(
        `SELECT d.id, d.id_poli, p.nama_poli, d.nama, d.spesialisasi, d.email,
                d.no_telp, d.jadwal_praktik, 'dokter' AS role
         FROM dokter d
         LEFT JOIN poliklinik p ON p.id = d.id_poli
         WHERE d.id = ?`,
        [id]
      );
    } else {
      [rows] = await pool.query(
        "SELECT id, username AS nama, username AS email, role FROM admin WHERE id = ?",
        [id]
      );
    }

    if (!rows[0]) {
      throw new HttpError(404, "User tidak ditemukan");
    }

    res.json({ success: true, data: rows[0] });
  })
);

export default router;
