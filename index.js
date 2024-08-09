import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import webrouter from "./routes/paginas.js"; 
import apirouter from "./routes/api.js";
import dotenv from "dotenv";

// Directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFilePath = path.join(__dirname, ".env");
dotenv.config({ path: envFilePath });

const app = express();
app.use(express.json()); 

const port = process.env.PORT || 3000;

app.use("/resources", express.static(path.join(__dirname, "resources")));

app.use(webrouter);

app.use("/api", apirouter)


app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
