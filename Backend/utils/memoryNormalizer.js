import crypto from "node:crypto";

export const normalizeContent = (text) => {
  if (!text || typeof text !== "string") return "";

  return text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'") // Normalize smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // Normalize smart double quotes
    .replace(/[^\w\s\.\,\-\'\"]/g, "") // Remove unusual special symbols
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
};

export const generateFingerprint = (content, category = "", memoryType = "") => {
  const normalized = normalizeContent(content);
  const payload = [memoryType.trim().toUpperCase(), category.trim().toUpperCase(), normalized]
    .filter(Boolean)
    .join("::");

  return crypto.createHash("sha256").update(payload).digest("hex");
};
