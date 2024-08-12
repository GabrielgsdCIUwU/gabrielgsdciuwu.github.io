import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.get("/forms", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/forms.html"));
});

router.get("/templeate", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/templeate.html"));
});

router.get("/rusky", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/rusky.html"));
});
export default router;
