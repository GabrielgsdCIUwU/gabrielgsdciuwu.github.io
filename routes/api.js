import express from "express";
import path from "node:path";
import fs from "node:fs";
import basicAuth from "basic-auth";
import { fileURLToPath } from "node:url";
import { WebhookClient, EmbedBuilder } from "discord.js";

import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFilePath = path.join(__dirname, ".env");
dotenv.config({ path: envFilePath });

const router = express.Router();
const filePath = path.join(__dirname, "../resources/json/comentarios.json");
const QueuefilePath = path.join(__dirname, "../resources/json/queue-comments.json");
const avatarPath = path.join(__dirname, "../resources/img/avatar_lq.jpg");

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
  const lang = req.acceptsLanguages(["es", "en"]) || "en";

  if (!nombre || !comentario) {
    return res.status(400).json({ error: "El nombre y el comentario son requeridos." });
  }

  fs.readFile(QueuefilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error al leer el archivo JSON:", err);
      return res.status(500).json({ error: "Error al leer el archivo JSON" });
    }

    let comentarios = JSON.parse(data);

    let newId;
    do {
      newId = generateUniqueId();
    } while (idExists(newId, comentarios));

    comentarios.push({ id: newId, nombre, comentario, lang });

    fs.writeFile(QueuefilePath, JSON.stringify(comentarios, null, 2), (err) => {
      if (err) {
        console.error("Error al escribir en el archivo JSON:", err);
        return res.status(500).json({ error: "Error al guardar el comentario" });
      }

      try {
        const webhook = new WebhookClient({ url: process.env.commentswebhook });

        let ts = new Date(Date.now());
        let unixTimestamp = Math.floor(ts.getTime() / 1000);

        const embed = new EmbedBuilder()
          .setTitle("Nuevo comentario:")
          .addFields({
            name: `ID:`,
            value: `${newId}`,
          })
          .addFields({
            name: `Nombre:`,
            value: `${nombre}`,
          })
          .addFields({
            name: `Mensaje:`,
            value: `${comentario}`,
          })
          .addFields({
            name: `Idioma`,
            value: `${lang}`
          })
          .addFields({
            name: `⌚ Timestamp:`,
            value: `<t:${unixTimestamp}:f>`,
          })
          .setColor(process.env.warningcolor);

        webhook.send({ embeds: [embed] });
        res.status(201).json({ message: "Comentario añadido exitosamente" });
      } catch (error) {
        console.log(error);
        res.status(500).json({message: "Error al guardar el comentario"});
      }
    });
  });
});

// Ruta para eliminar un comentario (privada) => DELETE || id, contraseña
router.delete("/comments", authenticate, (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "El ID del comentario es requerido." });
  }

  fs.readFile(QueuefilePath, "utf8", (err, data) => {
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

    fs.writeFile(QueuefilePath, JSON.stringify(comentarios, null, 2), (err) => {
      if (err) {
        console.error("Error al escribir en el archivo JSON:", err);
        return res.status(500).send("Error al eliminar el comentario");
      }
      res.status(200).json({ message: "Comentario eliminado exitosamente" });

      const webhook = new WebhookClient({ url: process.env.commentswebhook });

      let ts = new Date(Date.now());
      let unixTimestamp = Math.floor(ts.getTime() / 1000);

      const embed = new EmbedBuilder()
        .setTitle("Comentario Queue eliminado:")
        .addFields({
          name: `ID:`,
          value: `${id}`,
        })
        .addFields({
          name: `⌚ Timestamp:`,
          value: `<t:${unixTimestamp}:f>`,
        })
        .setColor(process.env.alertcolor);

      webhook.send({ embeds: [embed] });
    });
  });
});

// Ruta para listar comentarios => GET || rango 10-30
router.get("/comments", (req, res) => {
  const { start = 0, end = 12 } = req.query;
  const lang = req.acceptsLanguages(["es", "en"]) || "en";

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send(err.message);
    }

    let comentarios = JSON.parse(data);
    comentarios = comentarios.filter(c => c.lang === lang);
    
    const startIndex = parseInt(start, 10) || 0;
    const endIndex = parseInt(end, 10) || 10;

    const paginatedComments = comentarios.slice(startIndex, endIndex);

    res.json(paginatedComments);
  });
});

// Ruta para mover un comentario de la cola a los comentarios principales => POST
router.post("/manage", authenticate, (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "El ID del comentario es requerido." });
  }

  // Leer queue-comments.json
  fs.readFile(QueuefilePath, "utf8", (err, queueData) => {
    if (err) {
      console.error("Error al leer queue-comments.json:", err);
      return res.status(500).json({ error: "Error al leer el archivo de cola de comentarios" });
    }

    let queueComentarios = JSON.parse(queueData);

    // Buscar el comentario en la cola
    const index = queueComentarios.findIndex((comentario) => comentario.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Comentario no encontrado en la cola." });
    }

    // Extraer el comentario
    const [comentarioMovido] = queueComentarios.splice(index, 1);

    // Leer comentarios.json
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error("Error al leer comentarios.json:", err);
        return res.status(500).json({ error: "Error al leer el archivo de comentarios" });
      }

      let comentarios = JSON.parse(data);

      // Añadir el comentario movido a comentarios.json
      comentarios.push(comentarioMovido);

      // Guardar los comentarios actualizados en comentarios.json
      fs.writeFile(filePath, JSON.stringify(comentarios, null, 2), (err) => {
        if (err) {
          console.error("Error al escribir en comentarios.json:", err);
          return res.status(500).json({ error: "Error al guardar los comentarios" });
        }

        // Guardar la cola actualizada en queue-comments.json
        fs.writeFile(QueuefilePath, JSON.stringify(queueComentarios, null, 2), (err) => {
          if (err) {
            console.error("Error al actualizar queue-comments.json:", err);
            return res.status(500).json({ error: "Error al actualizar la cola de comentarios" });
          }

          res.status(200).json({ message: "Comentario movido exitosamente a comentarios.json" });

          const webhook = new WebhookClient({ url: process.env.commentsadminwebhook });

          let ts = new Date(Date.now());
          let unixTimestamp = Math.floor(ts.getTime() / 1000);

          const embed = new EmbedBuilder()
            .setTitle("Comentario aprobado:")
            .addFields({
              name: `ID:`,
              value: `${comentarioMovido.id}`,
            })
            .addFields({
              name: `Nombre:`,
              value: `${comentarioMovido.nombre}`,
            })
            .addFields({
              name: `Mensaje:`,
              value: `${comentarioMovido.comentario}`,
            })
            .addFields({
              name: `⌚ Timestamp:`,
              value: `<t:${unixTimestamp}:f>`,
            })
            .setColor(process.env.successcolor);

          webhook.send({ embeds: [embed] });
        });
      });
    });
  });
});

//Ruta para listar comentarios de Queue || require autentification
router.get("/manage", authenticate, (req, res) => {
  const { start = 0, end = 12 } = req.query;
  fs.readFile(QueuefilePath, "utf8", (err, data) => {
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

// Ruta para eliminar un comentario de Queue (privada) => DELETE || id, contraseña
router.delete("/manage", authenticate, (req, res) => {
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

    const comentarioEliminado = comentarios[index];

    comentarios.splice(index, 1);

    fs.writeFile(filePath, JSON.stringify(comentarios, null, 2), (err) => {
      if (err) {
        console.error("Error al escribir en el archivo JSON:", err);
        return res.status(500).send("Error al eliminar el comentario");
      }
      res.status(200).json({ message: "Comentario eliminado exitosamente" });

      const webhook = new WebhookClient({ url: process.env.commentsadminwebhook });

      let ts = new Date(Date.now());
      let unixTimestamp = Math.floor(ts.getTime() / 1000);

      const embed = new EmbedBuilder()
        .setTitle("Comentario borrado:")
        .addFields({
          name: `ID:`,
          value: `${comentarioEliminado.id}`,
        })
        .addFields({
          name: `Nombre:`,
          value: `${comentarioEliminado.nombre}`,
        })
        .addFields({
          name: `Mensaje:`,
          value: `${comentarioEliminado.comentario}`,
        })
        .addFields({
          name: `⌚ Timestamp:`,
          value: `<t:${unixTimestamp}:f>`,
        })
        .setColor(process.env.alertcolor);

      webhook.send({ embeds: [embed] });
    });
  });
});

//Ruta para obtener el avatar en baja calidad
router.get("/avatar", (req, res) => {
  if (!fs.existsSync(avatarPath)) res.status(404).json({ error: "Avatar not found" });

  res.sendFile(avatarPath);
});

export default router;
