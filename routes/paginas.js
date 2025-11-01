import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/", (req, res) => {
  res.render(path.join(__dirname, "../views/index.ejs"))
});

router.get("/forms", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/forms.html"));
});

router.get("/soundboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/soundboard.html"));
});

router.get("/info", (req, res) => {
  res.render(path.join(__dirname, "../views/info.ejs"));
});

export default router;
