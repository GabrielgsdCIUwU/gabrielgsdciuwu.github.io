import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import webrouter from "./routes/paginas.js";
import apirouter from "./routes/api.js";
import dotenv from "dotenv";
import http from "node:http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(express.json());
app.disable("x-powered-by");

const port = process.env.PORT || 3000;

const server = http.createServer(app);

app.use("/resources", express.static(path.join(__dirname, "resources")));
app.use(webrouter);
app.use("/api", apirouter);

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "./views/index.html"));
});

app.use((err, req, res, next) => {
  res.sendFile(path.join(__dirname, "./views/index.html"));
});

server.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
