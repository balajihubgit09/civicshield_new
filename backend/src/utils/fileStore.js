import fs from "fs";

export function ensureJsonFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

export function readJson(filePath, defaultValue) {
  ensureJsonFile(filePath, defaultValue);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}
