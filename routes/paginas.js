import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import basicAuth from "basic-auth";
import { encrypt, decrypt } from "../resources/js/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.get("/auth", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/auth.html"));
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

router.get("/soundboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/soundboard.html"));
});


router.get("/google430ed71687e8d816.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/google430ed71687e8d816.html"));
});

router.get("/info", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/info.html"));
});

export default router;
