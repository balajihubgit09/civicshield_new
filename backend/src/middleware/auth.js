import crypto from "crypto";
import { config } from "../config.js";

function timingSafeEqualString(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function adminAuth(req, res, next) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="CivicShield Admin"');
    return res.status(401).json({ error: "Unauthorized" });
  }

  const encoded = header.replace("Basic ", "");
  const decoded = Buffer.from(encoded, "base64").toString("utf-8");
  const [username, password] = decoded.split(":");

  const validUser = timingSafeEqualString(username, config.adminUsername);
  const validPassword = timingSafeEqualString(password, config.adminPassword);

  if (!validUser || !validPassword) {
    res.setHeader("WWW-Authenticate", 'Basic realm="CivicShield Admin"');
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.adminUser = username;
  return next();
}
