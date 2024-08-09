import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import basicAuth from "basic-auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const filePath = path.join(__dirname, "../resources/json/comentarios.json");

// Función para generar un ID único alfanumérico
function generateUniqueId(length = 8) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

// Función para verificar si un ID ya existe
function idExists(id, comentarios) {
  return comentarios.some((comentario) => comentario.id === id);
}

// Middleware para la autenticación básica
const authenticate = (req, res, next) => {
  const user = basicAuth(req);

  const username = process.env.user;
  const password = process.env.passwd;

  if (!user || user.name !== username || user.pass !== password) {
    res.set("WWW-Authenticate", 'Basic realm="401"');
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
};

// Ruta para añadir un comentario => POST || nombre, comentario || id
router.post("/comments", (req, res) => {
  const { nombre, comentario } = req.body;

  if (!nombre || !comentario) {
    return res.status(400).json({ error: "El nombre y el comentario son requeridos." });
  }

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error al leer el archivo JSON:", err);
      return res.status(500).send("Error al leer el archivo JSON");
    }

    let comentarios = JSON.parse(data);

    let newId;
    do {
      newId = generateUniqueId();
    } while (idExists(newId, comentarios));

    comentarios.push({ id: newId, nombre, comentario });

    fs.writeFile(filePath, JSON.stringify(comentarios, null, 2), (err) => {
      if (err) {
        console.error("Error al escribir en el archivo JSON:", err);
        return res.status(500).send("Error al guardar el comentario");
      }
      res.status(201).json({ message: "Comentario añadido exitosamente" });
    });
  });
});

// Ruta para eliminar un comentario (privada) => DELETE || id, contraseña
router.delete("/comments", authenticate, (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "El ID del comentario es requerido." });
  }

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error al leer el archivo JSON:", err);
      return res.status(500).send("Error al leer el archivo JSON");
    }

    let comentarios = JSON.parse(data);
    const index = comentarios.findIndex((comentario) => comentario.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Comentario no encontrado." });
    }

    comentarios.splice(index, 1);

    fs.writeFile(filePath, JSON.stringify(comentarios, null, 2), (err) => {
      if (err) {
        console.error("Error al escribir en el archivo JSON:", err);
        return res.status(500).send("Error al eliminar el comentario");
      }
      res.status(200).json({ message: "Comentario eliminado exitosamente" });
    });
  });
});

// Ruta para listar comentarios => GET || rango 10-30
router.get("/comments", (req, res) => {
  const { start = 0, end = 12 } = req.query;

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    let comentarios = JSON.parse(data);
    const startIndex = parseInt(start, 10) || 0;
    const endIndex = parseInt(end, 10) || 10;

    const paginatedComments = comentarios.slice(startIndex, endIndex);

    res.json(paginatedComments);
  });
});

export default router;
