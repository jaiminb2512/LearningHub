import fs from "fs";
import path from "path";
import multer from "multer";
import { randomUUID } from "node:crypto";
import sendResponse from "../utils/response.js";

const UPLOAD_ROOT = path.resolve("uploads", "knowledge");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const userId = req.user?.userId || "anonymous";
    const dest = path.join(UPLOAD_ROOT, userId);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${randomUUID()}-${safeName}`);
  },
});

const allowedMimeTypes = new Set([
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
]);

const allowedExtensions = new Set([
  ".txt",
  ".md",
  ".markdown",
  ".pdf",
  ".doc",
  ".docx",
]);

const knowledgeUpload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (allowedExtensions.has(ext) || allowedMimeTypes.has(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("Unsupported file type. Allowed: txt, md, pdf, doc, docx"));
  },
});

export const uploadKnowledgeFile = (req, res, next) => {
  knowledgeUpload.single("file")(req, res, (err) => {
    if (err) {
      return sendResponse(res, 400, err.message || "Upload failed");
    }
    return next();
  });
};

export const UPLOAD_KNOWLEDGE_ROOT = UPLOAD_ROOT;
