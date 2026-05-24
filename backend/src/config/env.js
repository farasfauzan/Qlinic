import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "qlinic",
    ssl: process.env.DB_SSL === "true"
  },
  jwtSecret: process.env.JWT_SECRET || "qlinic_local_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  adminContact: process.env.ADMIN_CONTACT || "0812-3456-7000"
};
