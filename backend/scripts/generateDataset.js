import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");
const ledgerPath = path.join(dataDir, "ledger.json");
const statePath = path.join(dataDir, "state.json");
const shouldReset = process.argv.includes("--reset");

fs.mkdirSync(dataDir, { recursive: true });

if (shouldReset || !fs.existsSync(ledgerPath)) {
  fs.writeFileSync(ledgerPath, JSON.stringify([], null, 2));
}

if (shouldReset || !fs.existsSync(statePath)) {
  fs.writeFileSync(
    statePath,
  JSON.stringify(
    {
      initialBudget: 1000000,
      budgetRemaining: 1000000,
      adminPaused: false,
      freezeReason: null,
      requestLog: [],
      activeQueue: [],
      claimOverrides: {}
    },
    null,
    2
  )
  );
}

console.log("Dataset and persistence files are ready.");
