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

router.get("/forms", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/forms.html"));
});

const localizedPages = ["info", "chillfish", "soundboard"];

router.get("/", (req, res) => {
  const lang = detectLanguage(req);
  res.redirect(`/${lang}`);
});

localizedPages.forEach(page => {
  router.get(`/${page}`, (req, res) => {
    const lang = detectLanguage(req);
    res.redirect(`/${lang}/${page}`);
  });
});

const validateLang = (req, res, next) => {
  const supported = ["es", "en"];
  if (supported.includes(req.params.lang)) {
    next();
  } else {
    next('route');
  }
};

localizedPages.forEach(page => {
  router.get(`/:lang/${page}`, validateLang, (req, res) => renderPage(req, res, page));
});

router.get("/:lang", validateLang, (req, res) => renderPage(req, res, "index"));

export default router;
