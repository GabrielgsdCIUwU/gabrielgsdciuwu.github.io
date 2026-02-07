import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadLangData(lang, file) {
    const filePath = path.join(__dirname, `../data/languages/${lang}/${file}.json`);
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function renderPage(req, res, page) {
    const { lang } = req.params;
    try {
        const content = loadLangData(lang, page)
        res.render(`../views/${page}.ejs`, {lang, content});
    } catch (error) {
        console.log(error);
        res.status(404).send("Idioma o archivo no encontrado");
    }
}