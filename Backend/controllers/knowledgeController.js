import sendResponse from "../utils/response.js";
import {
  KnowledgeServiceError,
  attachKnowledgeToThread,
  createKnowledgeFromUpload,
  deleteKnowledgeSource,
  detachKnowledgeFromThread,
  generateKnowledgeEmbeddings,
  listThreadKnowledge,
  listUserKnowledge,
} from "../services/knowledgeService.js";

const handleError = (res, error, fallbackMessage) => {
  if (error instanceof KnowledgeServiceError) {
    return sendResponse(res, error.statusCode, error.message);
  }
  console.error(fallbackMessage, error);
  return sendResponse(res, 500, fallbackMessage, { error: error.message });
};

export const uploadKnowledgeHandler = async (req, res) => {
  try {
    const threadId = req.body?.threadId || null;
    const source = await createKnowledgeFromUpload({
      userId: req.user.userId,
      threadId,
      file: req.file,
    });
    return sendResponse(res, 201, "File uploaded successfully", source);
  } catch (error) {
    return handleError(res, error, "Failed to upload file");
  }
};

export const listUserKnowledgeHandler = async (req, res) => {
  try {
    const data = await listUserKnowledge({ userId: req.user.userId });
    return sendResponse(res, 200, "Knowledge library fetched successfully", data);
  } catch (error) {
    return handleError(res, error, "Failed to fetch knowledge library");
  }
};

export const listThreadKnowledgeHandler = async (req, res) => {
  try {
    const data = await listThreadKnowledge({
      userId: req.user.userId,
      threadId: req.params.threadId,
    });
    return sendResponse(res, 200, "Thread knowledge fetched successfully", data);
  } catch (error) {
    return handleError(res, error, "Failed to fetch thread knowledge");
  }
};

export const attachKnowledgeHandler = async (req, res) => {
  try {
    const data = await attachKnowledgeToThread({
      userId: req.user.userId,
      threadId: req.params.threadId,
      knowledgeSourceId: req.params.knowledgeSourceId,
    });
    return sendResponse(res, 200, "Knowledge attached to thread", data);
  } catch (error) {
    return handleError(res, error, "Failed to attach knowledge");
  }
};

export const detachKnowledgeHandler = async (req, res) => {
  try {
    const data = await detachKnowledgeFromThread({
      userId: req.user.userId,
      threadId: req.params.threadId,
      knowledgeSourceId: req.params.knowledgeSourceId,
    });
    return sendResponse(res, 200, "Knowledge detached from thread", data);
  } catch (error) {
    return handleError(res, error, "Failed to detach knowledge");
  }
};

export const deleteKnowledgeHandler = async (req, res) => {
  try {
    const data = await deleteKnowledgeSource({
      userId: req.user.userId,
      knowledgeSourceId: req.params.knowledgeSourceId,
    });
    return sendResponse(res, 200, "Knowledge source deleted", data);
  } catch (error) {
    return handleError(res, error, "Failed to delete knowledge source");
  }
};

export const generateKnowledgeEmbeddingsHandler = async (req, res) => {
  try {
    const data = await generateKnowledgeEmbeddings({
      userId: req.user.userId,
      knowledgeSourceId: req.params.knowledgeSourceId,
    });
    return sendResponse(res, 200, "Knowledge embeddings generation triggered", data);
  } catch (error) {
    return handleError(res, error, "Failed to generate knowledge embeddings");
  }
};
