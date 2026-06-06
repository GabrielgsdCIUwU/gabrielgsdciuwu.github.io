import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logPath = path.join(__dirname, "../security.log");

const suspiciousPatterns = [
  /\.env/i,
  /\.git/i,
  /wp-admin/i,
  /wp-login/i,
  /phpmyadmin/i,
  /xmlrpc\.php/i,
  /\.\./,
  /%2e%2e/i,
  /passwd/i,
  /shadow/i,
  /\.yml/i,
  /config\.json/i,
  /composer\.json/i,
  /package-lock\.json/i,
  /package\.json/i
];

export const securityLogger = (req, res, next) => {
  const url = req.originalUrl || req.url;
  const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(url));

  if (isSuspicious) {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"] || "Unknown";
    const date = new Date().toISOString();

    const logEntry = `[${date}] Suspicious access attempt:
IP: ${ip}
User-Agent: ${userAgent}
URL: ${url}
Method: ${req.method}
--------------------------------------------------\n`;

    fs.appendFile(logPath, logEntry, (err) => {
      if (err) {
        console.error("Error writing to security.log:", err);
      }
    });

    console.warn(`[SECURITY WARNING] Bloqueado acceso malicioso desde IP: ${ip} intentando acceder a: ${url}`);

    return res.status(404).send("Cannot GET " + url);
  }

  next();
};
