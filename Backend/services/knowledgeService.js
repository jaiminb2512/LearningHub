import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { randomUUID } from "node:crypto";
import prisma from "../dbConnect/prismaClient.js";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { countTokens, generateEmbedding } from "../utils/agent.js";

export class KnowledgeServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "KnowledgeServiceError";
    this.statusCode = statusCode;
  }
}

const assertThreadOwned = async (userId, threadId) => {
  const thread = await prisma.thread.findFirst({
    where: { threadId, userId },
    select: { threadId: true },
  });
  if (!thread) {
    throw new KnowledgeServiceError("Thread not found", 404);
  }
  return thread;
};

export const createKnowledgeFromUpload = async ({
  userId,
  threadId,
  file,
}) => {
  if (!file) {
    throw new KnowledgeServiceError("File is required");
  }

  if (threadId) {
    await assertThreadOwned(userId, threadId);
  }

  const relativePath = path
    .join("uploads", "knowledge", userId, file.filename)
    .replace(/\\/g, "/");

  const source = await prisma.knowledgeSource.create({
    data: {
      userId,
      originalName: file.originalname,
      mimeType: file.mimetype || "application/octet-stream",
      sizeBytes: file.size || 0,
      storagePath: relativePath,
      status: "UPLOADED",
      ...(threadId
        ? {
          threads: {
            create: {
              threadId,
              attachedBy: userId,
              isActive: true,
            },
          },
        }
        : {}),
    },
    include: threadId
      ? {
        threads: {
          where: { threadId },
        },
      }
      : undefined,
  });

  return source;
};

export const listThreadKnowledge = async ({ userId, threadId }) => {
  await assertThreadOwned(userId, threadId);

  const links = await prisma.threadKnowledgeSource.findMany({
    where: {
      threadId,
      isActive: true,
      knowledgeSource: { userId },
    },
    orderBy: { attachedAt: "desc" },
    include: {
      knowledgeSource: true,
    },
  });

  return links.map((link) => ({
    linkId: link.id,
    attachedAt: link.attachedAt,
    isActive: link.isActive,
    ...link.knowledgeSource,
  }));
};

export const listUserKnowledge = async ({ userId }) => {
  return prisma.knowledgeSource.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const attachKnowledgeToThread = async ({
  userId,
  threadId,
  knowledgeSourceId,
}) => {
  await assertThreadOwned(userId, threadId);

  const source = await prisma.knowledgeSource.findFirst({
    where: { knowledgeSourceId, userId },
  });
  if (!source) {
    throw new KnowledgeServiceError("Knowledge source not found", 404);
  }

  const link = await prisma.threadKnowledgeSource.upsert({
    where: {
      threadId_knowledgeSourceId: {
        threadId,
        knowledgeSourceId,
      },
    },
    create: {
      threadId,
      knowledgeSourceId,
      attachedBy: userId,
      isActive: true,
    },
    update: {
      isActive: true,
      attachedBy: userId,
      attachedAt: new Date(),
    },
    include: {
      knowledgeSource: true,
    },
  });

  return {
    linkId: link.id,
    attachedAt: link.attachedAt,
    isActive: link.isActive,
    ...link.knowledgeSource,
  };
};

export const detachKnowledgeFromThread = async ({
  userId,
  threadId,
  knowledgeSourceId,
}) => {
  await assertThreadOwned(userId, threadId);

  const link = await prisma.threadKnowledgeSource.findFirst({
    where: {
      threadId,
      knowledgeSourceId,
      knowledgeSource: { userId },
    },
  });

  if (!link) {
    throw new KnowledgeServiceError("Attachment not found", 404);
  }

  await prisma.threadKnowledgeSource.update({
    where: { id: link.id },
    data: { isActive: false },
  });

  return { detached: true };
};

export const deleteKnowledgeSource = async ({ userId, knowledgeSourceId }) => {
  const source = await prisma.knowledgeSource.findFirst({
    where: { knowledgeSourceId, userId },
  });

  if (!source) {
    throw new KnowledgeServiceError("Knowledge source not found", 404);
  }

  if (source.storagePath) {
    const absolute = path.resolve(source.storagePath);
    if (fs.existsSync(absolute)) {
      fs.unlinkSync(absolute);
    }
  }

  await prisma.knowledgeSource.delete({
    where: { knowledgeSourceId },
  });

  return { deleted: true };
};

export const normalizeContent = (content) => {
  if (!content || typeof content !== "string") {
    return "";
  }

  let normalized = content;

  // Normalize line endings
  normalized = normalized
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  // Remove null characters
  normalized = normalized.replace(/\0/g, "");

  // Replace tabs with spaces
  normalized = normalized.replace(/\t/g, " ");

  // Remove trailing whitespace
  normalized = normalized.replace(/[ \t]+$/gm, "");

  // Collapse multiple spaces
  normalized = normalized.replace(/[ ]{2,}/g, " ");

  // Collapse excessive blank lines
  normalized = normalized.replace(/\n{3,}/g, "\n\n");

  // Remove leading/trailing whitespace
  normalized = normalized.trim();

  return normalized;
};

export async function chunkDocument({
  content,
  mimeType,
}) {

  // Common recursive splitter
  function createRecursiveSplitter() {
    return new RecursiveCharacterTextSplitter({
      chunkSize: 3000,
      chunkOverlap: 400,
      separators: ["\n\n", "\n", ". ", " ", ""],
    });
  }

  // 2. Default strategy
  async function defaultSplit(text) {
    const splitter = createRecursiveSplitter();

    return splitter.createDocuments([text]);
  }

  // 3. Markdown structure extraction
  function extractMarkdownSections(markdown) {
    const lines = markdown.split(/\r?\n/);

    const sections = [];

    const headingStack = [];

    let currentContent = [];

    function flushSection() {
      const text = currentContent.join("\n").trim();

      if (!text) {
        currentContent = [];
        return;
      }

      sections.push({
        text,
        headingPath: [...headingStack],
      });

      currentContent = [];
    }

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (!headingMatch) {
        currentContent.push(line);
        continue;
      }

      // Save content before changing heading
      flushSection();

      const level = headingMatch[1].length;
      const heading = headingMatch[2].trim();

      // Remove headings deeper than or equal to current level
      while (
        headingStack.length >= level
      ) {
        headingStack.pop();
      }

      headingStack.push(heading);
    }

    // Save remaining content
    flushSection();
    return sections;
  }

  // 4. Markdown → Structure-aware → Recursive
  async function splitMarkdown(text) {
    const sections = extractMarkdownSections(text);

    // If there are no headings, use default recursive splitting
    if (sections.length === 0) {
      return defaultSplit(text);
    }

    const documents = sections.map((section) => ({
      pageContent: section.text,
      metadata: {
        headingPath: section.headingPath,
      },
    }));

    const splitter = createRecursiveSplitter();

    return splitter.splitDocuments(documents);
  }

  // 5. PDF → Page-aware → Recursive
  async function splitPdf(pages) {
    if (!Array.isArray(pages)) {
      throw new Error(
        "PDF content must be an array of pages."
      );
    }

    const documents = pages
      .filter((page) => page?.text?.trim())
      .map((page) => ({
        pageContent: page.text,
        metadata: {
          pageNumber: page.pageNumber,
        },
      }));

    const splitter = createRecursiveSplitter();

    return splitter.splitDocuments(documents);
  }

  // 6. DOCX → Structure-aware → Recursive
  async function splitDocx(sections) {
    if (!Array.isArray(sections)) {
      throw new Error(
        "DOCX content must be an array of sections."
      );
    }

    const documents = sections
      .filter((section) => section?.text?.trim())
      .map((section) => ({
        pageContent: section.text,
        metadata: {
          headingPath: section.headingPath ?? [],
        },
      }));

    const splitter = createRecursiveSplitter();

    return splitter.splitDocuments(documents);
  }

  // 7. Select chunking strategy
  let chunks;

  switch (mimeType) {

    // Markdown
    case "text/markdown":
      chunks = await splitMarkdown(content);
      break;

    // Plain text
    case "text/plain":
      chunks = await defaultSplit(content);
      break;

    // PDF
    case "application/pdf":
      chunks = await splitPdf(content);
      break;

    // DOCX
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      chunks = await splitDocx(content);
      break;

    // Legacy DOC
    case "application/msword":
      throw new Error(
        "Legacy .doc files are not supported. Please upload a .docx file."
      );

    // Unknown binary
    case "application/octet-stream":
      throw new Error(
        "Unknown binary file type. Determine the actual file type before processing."
      );

    // Safety fallback
    default:
      chunks = await defaultSplit(content);
  }

  return chunks.map((chunk, index) => ({
    content: chunk.pageContent,

    metadata: {
      ...chunk.metadata,
      mimeType,
      chunkIndex: index,
      chunkLength: chunk.pageContent.length,
    },
  }));
}

export const generateKnowledgeEmbeddings = async ({ userId, knowledgeSourceId }) => {
  const source = await prisma.knowledgeSource.findFirst({
    where: { knowledgeSourceId, userId },
  });

  if (!source) {
    throw new KnowledgeServiceError("Knowledge source not found", 404);
  }

  let content = null;

  switch (source.mimeType) {
    // Plain text
    case "text/plain":
      content = await fsPromises.readFile(source.storagePath, "utf-8");
      break;

    // Markdown
    case "text/markdown":
      content = await fsPromises.readFile(source.storagePath, "utf-8");
      break;

    // PDF
    case "application/pdf": {
      const buffer = await fsPromises.readFile(source.storagePath);
      const data = await pdfParse(buffer);

      content = data.text;
      break;
    }

    // Old Microsoft Word (.doc)
    case "application/msword":
      throw new Error(
        "Legacy .doc files are not supported yet. Please convert the file to .docx or PDF."
      );

    // Microsoft Word (.docx)
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      const result = await mammoth.extractRawText({
        path: source.storagePath,
      });

      content = result.value;
      break;
    }

    // Unknown/binary MIME type
    case "application/octet-stream":
      throw new Error(
        "Unknown file type. Cannot extract content from application/octet-stream."
      );

    // Anything else
    default:
      throw new Error(`Unsupported MIME type: ${source.mimeType}`);
  }

  content = normalizeContent(content);
  const chunks = await chunkDocument({
    content,
    mimeType: source.mimeType,
  });

  // Re-generate: clear previous chunks for this source
  await prisma.knowledgeChunk.deleteMany({
    where: { sourceId: source.knowledgeSourceId },
  });

  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content.toString());
    const tokenResult = await countTokens(chunk.content.toString());

    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new KnowledgeServiceError("Generated embedding is empty or invalid", 500);
    }

    const vectorValue = `[${embedding.join(",")}]`;
    const knowledgeChunkId = randomUUID();

    // Prisma cannot write Unsupported("vector") via create — use raw SQL
    await prisma.$executeRaw`
      INSERT INTO "KnowledgeChunk" (
        "knowledgeChunkId",
        "sourceId",
        "userId",
        "chunkIndex",
        "content",
        "embedding",
        "embeddingModel",
        "tokenCount",
        "createdAt"
      )
      VALUES (
        ${knowledgeChunkId},
        ${source.knowledgeSourceId},
        ${source.userId},
        ${chunk.metadata.chunkIndex},
        ${chunk.content},
        ${vectorValue}::vector,
        ${"gemini-embedding-001"},
        ${tokenResult.totalTokens},
        ${new Date()}
      )
    `;
  }

  const updated = await prisma.knowledgeSource.update({
    where: { knowledgeSourceId: source.knowledgeSourceId },
    data: {
      status: "READY",
      errorMessage: null,
    },
  });

  return {
    knowledgeSourceId: updated.knowledgeSourceId,
    originalName: updated.originalName,
    storagePath: updated.storagePath,
    status: updated.status,
    chunkCount: chunks.length,
    message: "Embedding generation completed",
  };
};