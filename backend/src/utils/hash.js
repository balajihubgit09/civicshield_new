import crypto from "crypto";

export function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export function buildCitizenHash(citizenId, salt) {
  return sha256(`${citizenId}${salt}`);
}

export function buildLedgerHash(entry) {
  const payload = `${entry.Timestamp}${entry.CitizenHash}${entry.Scheme}${entry.Amount}${entry.PreviousHash}`;

  return sha256(payload);
}

export function buildReplaySignature(citizenHash, scheme, amount) {
  return sha256(`${citizenHash}::${scheme}::${amount}`);
}
