import express from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import axios from "axios";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import os from "node:os";

dotenv.config();

const router = express.Router();
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 60 * 1024 * 1024 } // 60 MB limite por archivo
});

// Limit requests
const uploadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // Limit each IP to 3 PRs
  message: { error: "Too many uploads from this IP, please try again after 24 hours" },
  standardHeaders: true,
  legacyHeaders: false,
});

async function getGitHubAppToken() {
  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_INSTALLATION_ID;
  let privateKey = process.env.GITHUB_PRIVATE_KEY;

  if (!appId || !installationId || !privateKey) {
    throw new Error("GitHub App credentials are not configured");
  }

  // Handle newlines in env variable
  privateKey = privateKey.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + (5 * 60),
    iss: appId
  };

  const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

  const response = await axios.post(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    }
  );

  return response.data.token;
}

router.post("/soundboard/upload", uploadLimiter, upload.array("files"), async (req, res) => {
  try {
    const { folderName } = req.body;
    const files = req.files;

    if (!folderName) return res.status(400).json({ error: "Folder name is required" });
    if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded" });

    const token = await getGitHubAppToken();
    const owner = "GabrielgsdCIUwU";
    const repo = "soundboard";
    const axiosInstance = axios.create({
      baseURL: `https://api.github.com/repos/${owner}/${repo}`,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const refRes = await axiosInstance.get("/git/ref/heads/main");
    const baseCommitSha = refRes.data.object.sha;

    const branchName = `feat/upload-${Date.now()}`;
    await axiosInstance.post("/git/refs", {
      ref: `refs/heads/${branchName}`,
      sha: baseCommitSha
    });

    const treeItems = [];
    for (const file of files) {
      const fileBuffer = await fs.readFile(file.path);
      const blobRes = await axiosInstance.post("/git/blobs", {
        content: fileBuffer.toString("base64"),
        encoding: "base64"
      });

      const fileName = file.originalname.replace(/[^a-zA-Z0-9.\-_ ()]/g, "");
      treeItems.push({
        path: `${folderName}/${fileName}`,
        mode: "100644",
        type: "blob",
        sha: blobRes.data.sha
      });
    }

    const commitRes = await axiosInstance.get(`/git/commits/${baseCommitSha}`);
    const baseTreeSha = commitRes.data.tree.sha;

    const newTreeRes = await axiosInstance.post("/git/trees", {
      base_tree: baseTreeSha,
      tree: treeItems
    });

    const newCommitRes = await axiosInstance.post("/git/commits", {
      message: `Add ${files.length} new sound(s) to ${folderName}`,
      tree: newTreeRes.data.sha,
      parents: [baseCommitSha]
    });

    await axiosInstance.patch(`/git/refs/heads/${branchName}`, {
      sha: newCommitRes.data.sha
    });

    const fileNamesList = files.map(f => `- ${f.originalname}`).join('\n');
    const prRes = await axiosInstance.post("/pulls", {
      title: `Add new sounds to ${folderName}`,
      head: branchName,
      base: "main",
      body: `This PR adds ${files.length} new sound(s) to the \`${folderName}\` folder.\n\n### Included files:\n${fileNamesList}\n\n> *Uploaded via the Soundboard website*`
    });

    res.status(200).json({ message: "Pull Request created successfully", prUrl: prRes.data.html_url });
  } catch (error) {
    console.error("Upload error:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (e) { } // Ignorar si ya se borró
      }
    }
  }
});

export default router;
