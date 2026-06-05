import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import webrouter from "./routes/paginas.js";
import apirouter from "./routes/api.js";
import uploadrouter from "./routes/upload.js";
import dotenv from "dotenv";
import http from "node:http";
import { Server } from "socket.io";
import "./utils/avatar.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(express.json());
app.disable("x-powered-by");

const port = process.env.PORT || 3000;

const server = http.createServer(app);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/resources", express.static(path.join(__dirname, "resources")));
app.use(webrouter);
app.use("/api", apirouter);
app.use("/api", uploadrouter);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  // Cuando un emisor envía la señal de reproducir
  socket.on("playSound", (data) => {
    // Reenvía el evento a todos los demás (los receptores)
    socket.broadcast.emit("playSound", data);
  });

  // Cuando un emisor detiene todo
  socket.on("stopAll", () => {
    socket.broadcast.emit("stopAll");
  });

  // Cuando un emisor ajusta el volumen remoto
  socket.on("changeVolume", (data) => {
    socket.broadcast.emit("changeVolume", data);
  });
});

server.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
