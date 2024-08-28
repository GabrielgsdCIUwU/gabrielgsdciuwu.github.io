import express from "express";
import session from "express-session";
import passport from "../resources/js/auth.js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFilePath = path.join(__dirname, ".env");
dotenv.config({ path: envFilePath });

const router = express.Router();
router.use(express.urlencoded({ extended: true }));

router.use(
  session({
    secret: `${process.env.sessionSecret}`,
    resave: false,
    saveUninitialized: false,
  })
);

router.use(passport.initialize());
router.use(passport.session());

router.get("/auth/discord", passport.authenticate("discord"));

router.get("/auth/discord/callback", passport.authenticate("discord", { failureRedirect: "/" }), (req, res) => {
  res.redirect("/soundselector")
});

router.get("/soundselector", authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/soundselector.html"));
});

router.post("/soundselector", (req, res) => {
  const chosenOption = req.body.option;
  if (chosenOption === "soundboard-interact") {
    res.redirect("/soundboard-interact");
  } else if (chosenOption === "sound-receiver") {
    res.redirect("/sound-receiver");
  } else {
    res.redirect("/");
  }
});

router.get("/soundboard-interact", authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/soundboard-interact.html"));
});

router.get("/sound-receiver", authenticate, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/sound_receiver.html"));
});

function authenticate(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/auth");
}
export default router;
