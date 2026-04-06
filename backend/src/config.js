import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const dataDir = path.join(backendRoot, "data");

export const config = {
  port: Number(process.env.PORT || 4000),
  salt: process.env.CITIZEN_HASH_SALT || "CIVICSHIELD_2026_HACKATHON_SALT",
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || "civicshield123",
  initialBudget: Number(process.env.INITIAL_BUDGET || 1000000),
  allowedOrigins: String(process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  claimsRateWindowMs: Number(process.env.CLAIMS_RATE_WINDOW_MS || 60000),
  claimsRateMax: Number(process.env.CLAIMS_RATE_MAX || 30),
  adminRateWindowMs: Number(process.env.ADMIN_RATE_WINDOW_MS || 60000),
  adminRateMax: Number(process.env.ADMIN_RATE_MAX || 60),
  dataDir,
  datasetPath: path.join(dataDir, "CivicShield_Dataset.xlsx"),
  ledgerPath: path.join(dataDir, "ledger.json"),
  statePath: path.join(dataDir, "state.json")
};
