import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

router.get("/forms", (req, res) => {
  res.sendFile(path.join(__dirname, "../forms.html"));
});

router.get("/comentario", (req, res) => {
  res.sendFile(path.join(__dirname, "../comentario.html"));
});

export default router;
