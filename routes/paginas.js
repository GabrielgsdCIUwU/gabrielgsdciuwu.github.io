import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderPage } from "../controller/language.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

function detectLanguage(req) {
  
  const supported = ["es", "en"];
  let lang = req.acceptsLanguages(supported);
  
  if (!lang) lang = "en";
  if (!supported.includes(lang)) lang = "en";

  return lang;
}

router.get("/", (req, res) => {
  const lang = detectLanguage(req);
  res.redirect(`/${lang}`);
});

router.get("/info", (req, res) => {
  const lang = detectLanguage(req);
  res.redirect(`/${lang}/info`);
});

router.get("/:lang", (req, res) => renderPage(req, res, "index"));

router.get("/forms", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/forms.html"));
});

router.get("/soundboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/soundboard.html"));
});

router.get("/:lang/info", (req, res) => renderPage(req, res, "info"));

export default router;
