import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFilePath = path.join(__dirname, "..", ".env");
dotenv.config({ path: envFilePath });

function decrypt(encryptedData) {
  //const decipher = crypto.createDecipheriv("aes-256-gcm", process.env.secretKey, "");
  const decipher = crypto.createDecipheriv("aes-256-ecb", process.env.secretKey, "");

  let decrypted = decipher.update(encryptedData, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function encrypt(data) {
  //const cipher = crypto.createCipheriv("aes-256-gcm", process.env.secretKey, "");
  const cipher = crypto.createCipheriv("aes-256-ecb", process.env.secretKey, "");

  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
}

export { encrypt, decrypt };
