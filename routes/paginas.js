import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import basicAuth from "basic-auth";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();


const readUsers = () => {
  const usersPath = path.join(__dirname, "../resources/json/users.json");
  const usersData = fs.readFileSync(usersPath);
  return JSON.parse(usersData);
}
const authenticate = (req, res, next) => {
  const user = basicAuth(req);
  const users = readUsers();

  if (!user || !users.some(u => u.username === user.name && u.password === user.pass)) {
    res.set("WWW-Authenticate", 'Basic realm="401"');
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
};

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

router.get("/soundboard-interact", authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/soundboard-interact.html"));
});

router.get("/google430ed71687e8d816.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/google430ed71687e8d816.html"));
});

router.get("/sound-receiver", authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/sound_receiver.html"));
});

export default router;
