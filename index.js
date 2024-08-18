import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import webrouter from "./routes/paginas.js"; 
import apirouter from "./routes/api.js";
import soundrouter from "./routes/soundrouter.js"
import dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io"; 
import http from "http"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFilePath = path.join(__dirname, ".env");
dotenv.config({ path: envFilePath });

const app = express();
app.use(express.json()); 
app.disable("x-powered-by");

const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new SocketIOServer(server);

app.use("/resources", express.static(path.join(__dirname, "resources")));

app.use(webrouter);
app.use("/api", apirouter);
app.use(soundrouter);

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "./views/index.html"));
});

io.on("connection", (socket) => {

    socket.on("playSound", (data) => {
        io.emit("playSound", data); // Reenvía el comando a todos los clientes conectados
    });

    socket.on("stopAll", () => {
        io.emit("stopAll"); // Enviar comando para detener todos los sonidos a todos los clientes
    });

    socket.on("volumeChange", (volume) => {
        io.emit("volumeChange", volume); // Enviar comando para cambiar el volumen a todos los clientes
    });

    socket.on("disconnect", () => {
    });
});

server.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
