import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import webrouter from "./routes/paginas.js";
import apirouter from "./routes/api.js";
import soundrouter from "./routes/soundrouter.js";
import dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";
import http from "http";
import session from "express-session";
import fileStore from "session-file-store";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const FileStore = fileStore(session);

const app = express();
app.use(express.json());
app.disable("x-powered-by");

const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new SocketIOServer(server);

const sessionStore = new FileStore({
  path: path.join(__dirname, "sessions"),
  logFn: function () {},
});

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "mysecret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 86400000 }, // 1 día
  })
);

app.use("/resources", express.static(path.join(__dirname, "resources")));
app.use(webrouter);
app.use("/api", apirouter);
app.use(soundrouter);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./views/index.html"));
});

io.on("connection", (socket) => {
  socket.on("playSound", (data) => {
    io.emit("playSound", data);
  });

  socket.on("stopAll", () => {
    io.emit("stopAll");
  });

  socket.on("volumeChange", (volume) => {
    io.emit("volumeChange", volume);
  });

  socket.on("disconnect", () => {});
});

server.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
