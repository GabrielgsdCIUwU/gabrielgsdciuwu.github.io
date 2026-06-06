import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import webrouter from "./routes/paginas.js";
import apirouter from "./routes/api.js";
import uploadrouter from "./routes/upload.js";
import dotenv from "dotenv";
import http from "node:http";
import { Server } from "socket.io";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { securityLogger } from "./utils/securityLogger.js";
import "./utils/avatar.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.set("trust proxy", 1);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde" },
  standardHeaders: true,
  legacyHeaders: false,
});


app.use(securityLogger);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "code.jquery.com",
        "cdnjs.cloudflare.com",
        "cdn.jsdelivr.net"
      ],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "cdnjs.cloudflare.com",
        "fonts.googleapis.com"
      ],
      fontSrc: ["'self'", "cdnjs.cloudflare.com", "fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "https://raw.githubusercontent.com"],
      connectSrc: [
        "'self'", 
        "ws:", 
        "wss:", 
        "https://cdnjs.cloudflare.com", 
        "https://raw.githubusercontent.com",
        "https://gabrielgsd.developer.li"
      ],
    },
  },
}));
app.use(globalLimiter);

app.use(express.json());

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
