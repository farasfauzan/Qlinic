import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import dokterRoutes from "./routes/dokter.routes.js";
import notifikasiRoutes from "./routes/notifikasi.routes.js";
import pasienRoutes from "./routes/pasien.routes.js";
import poliklinikRoutes from "./routes/poliklinik.routes.js";
import rekamMedisRoutes from "./routes/rekamMedis.routes.js";
import reportRoutes from "./routes/report.routes.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Qlinic API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/pasien", pasienRoutes);
app.use("/api/dokter", dokterRoutes);
app.use("/api/poliklinik", poliklinikRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/rekam-medis", rekamMedisRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/notifikasi", notifikasiRoutes);

app.use(notFound);
app.use(errorHandler);
