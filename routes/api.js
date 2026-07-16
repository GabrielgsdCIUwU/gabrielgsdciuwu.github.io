import express from "express";
import path from "node:path";
import fs from "node:fs";
import basicAuth from "basic-auth";
import { fileURLToPath } from "node:url";
import { WebhookClient, EmbedBuilder } from "discord.js";

import dotenv from "dotenv";
import multer from "multer";
import sharp from "sharp";
import os from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFilePath = path.join(__dirname, ".env");
dotenv.config({ path: envFilePath });

const router = express.Router();
const filePath = path.join(__dirname, "../resources/json/comentarios.json");
const QueuefilePath = path.join(__dirname, "../resources/json/queue-comments.json");
const chillFishFilePath = path.join(__dirname, "../resources/json/chillfish-comments.json");
const chillFishQueuePath = path.join(__dirname, "../resources/json/queue-chillfish-comments.json");
const avatarPath = path.join(__dirname, "../resources/img/avatar_lq.jpg");
const meetupPicturesPath = path.join(__dirname, "../resources/json/meetup-pictures.json");

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB limite por archivo
});

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

// Middleware para la autenticación básica (Solo Administrador)
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

// Middleware para la autenticación del Bot (o Admin)
const authenticateBotOrAdmin = (req, res, next) => {
  const user = basicAuth(req);

  const username = process.env.user;
  const password = process.env.passwd;
  const botUser = process.env.bot_user;
  const botPassword = process.env.bot_passwd;

  const isAdmin = user && user.name === username && user.pass === password;
  const isBot = user && botUser && botPassword && user.name === botUser && user.pass === botPassword;

  if (!isAdmin && !isBot) {
    res.set("WWW-Authenticate", 'Basic realm="401"');
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
};

router.post("/request-cv", (req, res) => {
  const { company, email, lang } = req.body;

  if (!email) return res.status(400).json({error: "Email is required"});

  try {
    //! PORQUE C- DISCORD AHORA QUIERE FUNCIONAR DE ESTA MANERA PERO EL RESTO LE DA IGUAL. W T F
    const webhook = new WebhookClient({id: process.env.cvid, token: process.env.cvsecret });
    //const webhook = new WebhookClient({ url: process.env.commentswebhook });

    let ts = new Date(Date.now());
    let unixTimestamp = Math.floor(ts.getTime() / 1000);

    const embed = new EmbedBuilder()
      .setTitle("Nueva solicitud:")
      .addFields({
        name: `Company:`,
        value: `${company}`,
      })
      .addFields({
        name: `Email:`,
        value: `${email}`,
      })
      .addFields({
        name: `Idioma`,
        value: `${lang}`
      })
      .addFields({
        name: `⌚ Timestamp:`,
        value: `<t:${unixTimestamp}:f>`,
      })
      .setColor(process.env.successcolor);

    webhook.send({ embeds: [embed] });

    res.status(200).json({message: "Request sent"});

  } catch (error) {
    console.log("CV Webhook error:", error);
    res.status(500).json({error: "Internal error"});
  }
});

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
router.get("/:lang/comments", (req, res) => {
  const { start = 0, end = 12 } = req.query;
  const { lang } = req.params;

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


//region chillfish

router.get("/:lang/chillfish/comments", (req, res) => {
  const { start = 0, end = 12 } = req.query;
  const { lang } = req.params;

  fs.readFile(chillFishFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error reading comments");
    }

    try {
      let comments = JSON.parse(data);
      comments = comments.filter(c => c.lang === lang);

      const startIndex = parseInt(start, 10) || 0;
      const endIndex = parseInt(end, 10) || 12;

      const paginatedComments = comments.slice(startIndex, endIndex);

      res.json(paginatedComments);
    } catch (e) {
      console.log(`Error reading comments: ${e}`);
      res.json([]);
    }
  });
});

// Enviar comentario de Chill Fish (Cola)
router.post("/chillfish/comments", (req, res) => {
  const { nombre, comentario, rol } = req.body;
  const lang = req.acceptsLanguages(["es", "en"]) || "en";

  if (!nombre || !comentario || !rol) {
    return res.status(400).json({ error: "All fields are required" });
  }

  fs.readFile(chillFishQueuePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Error reading queue" });

    let comentarios = JSON.parse(data);
    let newId;
    
    do { newId = generateUniqueId(); } while (idExists(newId, comentarios));

    const newComment = { 
        id: newId, 
        nombre, 
        comentario, 
        rol, 
        lang, 
        date: new Date().toISOString() 
    };
    
    comentarios.push(newComment);

    fs.writeFile(chillFishQueuePath, JSON.stringify(comentarios, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Error saving comment" });

      try {
        if(process.env.commentswebhook) {
            const webhook = new WebhookClient({ url: process.env.commentswebhook });
            const embed = new EmbedBuilder()
            .setTitle("🐟 Nuevo comentario Chill Fish:")
            .addFields(
                { name: 'Nombre', value: nombre, inline: true },
                { name: 'Rol', value: rol, inline: true },
                { name: 'Mensaje', value: comentario }
            )
            .setColor('#3b82f6');
            webhook.send({ embeds: [embed] });
        }
      } catch (e) { console.error("Discord error", e); }

      res.status(201).json({ message: "Comment added to queue" });
    });
  });
});

// Obtener estadísticas de Chill Fish
router.get("/chillfish/stats/group", (req, res) => {
  const statsPath = path.join(__dirname, "../resources/json/members.json");
  
  fs.readFile(statsPath, "utf8", (err, data) => {
    if (err) {
      console.log(`Error reading group stats: ${err}`);
      return res.status(500).json({ error: "Error reading group stats" });
    }
    try {
      const parsedData = JSON.parse(data);
      res.json(parsedData["ChillFish"] || []);
    }
    catch (e) { res.json([]); }
  });
});

router.get("/chillfish/stats/instance", (req, res) => {
  const statsPath = path.join(__dirname, "../resources/json/instances.json");
  
  fs.readFile(statsPath, "utf8", (err, data) => {
    if (err) {
      console.log(`Error reading instance stats: ${err}`);
      return res.status(500).json({ error: "Error reading instance stats" });
    }
    try {
      const parsedData = JSON.parse(data);

      const flatData = [];
      for (const [meetup, entries] of Object.entries(parsedData)) {
        if (entries.length > 0 && Array.isArray(entries[0])) {
          entries.forEach((sessionArray, sessionIndex) => {
            for (const entry of sessionArray) {
              flatData.push({ ...entry, meetup: parseInt(meetup, 10), session: sessionIndex });
            }
          });
        } else {
          for (const entry of entries) {
            flatData.push({ ...entry, meetup: parseInt(meetup, 10), session: 0 });
          }
        }
      }
      res.json(flatData);
    }
    catch (e) { res.json([]); }
  });
});

// GET endpoints for meetup pictures
router.get("/chillfish/pictures", (req, res) => {
  fs.readFile(meetupPicturesPath, "utf8", (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return res.json([]);
      console.log(`Error reading meetup pictures: ${err}`);
      return res.status(500).json({ error: "Error reading meetup pictures" });
    }
    try {
      const parsedData = JSON.parse(data);
      res.json(parsedData);
    } catch (e) { 
      res.json([]); 
    }
  });
});

// API Paths
const meetupPicturesQueuePath = path.join(__dirname, "../resources/json/meetup-pictures-queue.json");
const notificationsPath = path.join(__dirname, "../resources/json/notifications.json");

// POST endpoint for meetup pictures (called by Discord bot)
router.post("/chillfish/pictures", authenticateBotOrAdmin, upload.single("image"), async (req, res) => {
  try {
    const { meetupNumber, session, timestamp, author, userId, originalUrl } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No image file provided" });
    if (!meetupNumber || !session) return res.status(400).json({ error: "meetupNumber and session are required" });

    const newId = generateUniqueId();
    const fileName = `${meetupNumber}_${session}_${newId}.webp`;
    const outputPath = path.join(__dirname, "../resources/img/meetups", fileName);

    await sharp(file.path)
      .resize({ width: 1000, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    const newPic = {
      id: newId,
      url: `/resources/img/meetups/${fileName}`,
      meetupNumber: parseInt(meetupNumber, 10),
      session: parseInt(session, 10),
      timestamp: timestamp || new Date().toISOString(),
      author: author || "Unknown",
      userId: userId || null,
      originalUrl: originalUrl || null
    };

    let pictures = [];
    try {
      const data = fs.readFileSync(meetupPicturesQueuePath, "utf8");
      pictures = JSON.parse(data);
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }

    pictures.push(newPic);
    fs.writeFileSync(meetupPicturesQueuePath, JSON.stringify(pictures, null, 2), "utf8");

    res.status(201).json({ message: "Picture added to queue successfully", picture: newPic });
  } catch (error) {
    console.error("Error processing picture:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (req.file) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (e) {}
    }
  }
});

// GET picture queue (Admin)
router.get("/manage/pictures-queue", authenticate, (req, res) => {
  try {
    const data = fs.readFileSync(meetupPicturesQueuePath, "utf8");
    res.json(JSON.parse(data));
  } catch (e) {
    if (e.code === 'ENOENT') return res.json([]);
    res.status(500).json({ error: "Error reading picture queue" });
  }
});

// POST approve picture from queue
router.post("/manage/pictures-queue/approve", authenticate, (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "ID is required" });

  try {
    let queue = JSON.parse(fs.readFileSync(meetupPicturesQueuePath, "utf8"));
    const index = queue.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: "Picture not found in queue" });
    
    const [approvedPic] = queue.splice(index, 1);
    
    // Read and append to main pictures
    let pictures = [];
    try {
      pictures = JSON.parse(fs.readFileSync(meetupPicturesPath, "utf8"));
    } catch (e) {}
    
    // We don't need userId and originalUrl in public json, but it doesn't hurt. 
    // We will clean them up for the public array to save bytes
    const publicPic = { ...approvedPic };
    delete publicPic.userId;
    delete publicPic.originalUrl;
    
    pictures.push(publicPic);
    fs.writeFileSync(meetupPicturesPath, JSON.stringify(pictures, null, 2), "utf8");
    fs.writeFileSync(meetupPicturesQueuePath, JSON.stringify(queue, null, 2), "utf8");

    res.status(200).json({ message: "Picture approved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST reject picture from queue
router.post("/manage/pictures-queue/reject", authenticate, (req, res) => {
  const { id, reason } = req.body;
  if (!id) return res.status(400).json({ error: "ID is required" });

  try {
    let queue = JSON.parse(fs.readFileSync(meetupPicturesQueuePath, "utf8"));
    const index = queue.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: "Picture not found in queue" });
    
    const [rejectedPic] = queue.splice(index, 1);
    
    // Delete file
    const absoluteFilePath = path.join(__dirname, "..", rejectedPic.url);
    try {
      if (fs.existsSync(absoluteFilePath)) {
        fs.unlinkSync(absoluteFilePath);
      }
    } catch (e) {
      console.error("Could not delete rejected image file", e);
    }

    // Add to notifications queue if it has a userId
    if (rejectedPic.userId && reason) {
      let notifications = [];
      try {
        notifications = JSON.parse(fs.readFileSync(notificationsPath, "utf8"));
      } catch (e) {}
      
      notifications.push({
        userId: rejectedPic.userId,
        reason: reason,
        originalUrl: rejectedPic.originalUrl,
        timestamp: new Date().toISOString()
      });
      fs.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 2), "utf8");
    }

    fs.writeFileSync(meetupPicturesQueuePath, JSON.stringify(queue, null, 2), "utf8");

    res.status(200).json({ message: "Picture rejected successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
