import { AI_PROVIDERS, DEFAULT_AI_SETTINGS } from "../utils/aiConfig.js";
import sendResponse from "../utils/response.js";
import { generateMessage, streamMessage, generateEmbedding } from "../utils/agent.js";
import prisma from "../dbConnect/prismaClient.js";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { encode } from "gpt-tokenizer";
import { prompt } from "../utils/systemPrompts.js";
import { randomUUID } from "node:crypto";
import { resolveThreadAiSettings } from "../services/aiSettingService.js";

const saveDocumentEmbedding = async ({ userId, threadId, messageId, embedding }) => {
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Generated embedding is empty or invalid");
  }

  const vectorValue = `[${embedding.join(",")}]`;

  await prisma.$executeRaw`
    INSERT INTO "Document" (
      "id", "userId", "threadId", "messageId", "embedding",
      "embeddingModel", "embeddingDimensions", "embeddedAt"
    )
    VALUES (
      ${randomUUID()}, ${userId}, ${threadId}, ${messageId}, ${vectorValue}::vector,
      ${"gemini-embedding-001"}, ${embedding.length}, ${new Date()}
    )
  `;
};

const loadThreadWithSettings = async (threadId, userId) => {
  return prisma.thread.findFirst({
    where: { threadId, ...(userId ? { userId } : {}) },
    include: {
      systemPrompt: true,
      aiSetting: true,
    },
  });
};

export const getProviders = async (req, res) => {
  try {
    return sendResponse(res, 200, "AI providers fetched successfully", AI_PROVIDERS);
  } catch (error) {
    console.error("getProviders error:", error);
    return sendResponse(res, 500, "Failed to fetch AI providers", { error: error.message });
  }
};

export const generate = async (req, res) => {
  try {
    const { threadId, message } = req.body;

    if (!message) {
      return sendResponse(res, 400, "Message is required");
    }

    if (!threadId) {
      return sendResponse(res, 400, "Thread is required");
    }

    const threadData = await loadThreadWithSettings(threadId, req.user.userId);

    if (!threadData) {
      return sendResponse(res, 400, "Thread not found");
    }

    const aiSettings = await resolveThreadAiSettings(threadData);
    const model = aiSettings.model;
    const provider = aiSettings.provider;

    let promptText = await prompt(req.user.userId, threadId, message, {
      ragEnabled: aiSettings.ragEnabled,
    });

    if (!promptText) {
      promptText = threadData.systemPrompt?.prompt;
    }

    if (!promptText) {
      return sendResponse(res, 400, "No system prompt linked to this thread");
    }

    const existingMessages = await prisma.message.findMany({
      where: { threadId },
      orderBy: { sequence: "asc" },
    });

    const nextSequence = existingMessages.length + 1;

    const userMessage = await prisma.message.create({
      data: {
        threadId,
        role: "user",
        content: message,
        model,
        provider,
        sequence: nextSequence,
      },
    });

    const historyMessages = existingMessages.slice(-10);
    const formattedMessages = [
      ...historyMessages.map((m) =>
        m.role === "assistant"
          ? new AIMessage(m.content)
          : m.role === "tool"
            ? new ToolMessage(m.content)
            : new HumanMessage(m.content)
      ),
      new HumanMessage(message),
    ];

    const response = await generateMessage(promptText, formattedMessages, provider, model, {
      temperature: aiSettings.temperature,
      maxOutputTokens: aiSettings.maxOutputTokens,
    });

    const aiContent =
      typeof response.content === "string"
        ? response.content
        : Array.isArray(response.content) && response.content.length === 0
          ? ""
          : JSON.stringify(response.content);

    await prisma.message.create({
      data: {
        threadId,
        role: "assistant",
        content: aiContent,
        model,
        provider,
        inputTokens: response.response_metadata?.tokenUsage?.promptTokens || 0,
        outputTokens: response.response_metadata?.tokenUsage?.completionTokens || 0,
        totalTokens: response.response_metadata?.tokenUsage?.totalTokens || 0,
        sequence: nextSequence + 1,
        questionId: userMessage.messageId,
        promptText,
        aiSettingId: threadData.aiSettingId || null,
      },
    });

    if (aiSettings.ragEnabled) {
      const embedding = await generateEmbedding(aiContent);
      await saveDocumentEmbedding({
        userId: req.user.userId,
        threadId,
        messageId: userMessage.messageId,
        embedding,
      });
    }

    return sendResponse(res, 200, "AI response generated successfully", {
      content: aiContent,
      prompt: promptText,
      settings: aiSettings,
    });
  } catch (error) {
    console.error(error.message);
    return sendResponse(res, 500, "Failed to generate AI response", { error: error.message });
  }
};

export const stream = async (req, res) => {
  try {
    const { threadId, message } = req.body;

    if (!message) return sendResponse(res, 400, "Message is required");
    if (!threadId) return sendResponse(res, 400, "Thread is required");
    if (!req.user?.userId) return sendResponse(res, 401, "Authentication required");

    const threadData = await loadThreadWithSettings(threadId, req.user.userId);
    if (!threadData) return sendResponse(res, 400, "Thread not found");

    const aiSettings = await resolveThreadAiSettings(threadData);
    const model = aiSettings.model || DEFAULT_AI_SETTINGS.model;
    const provider = aiSettings.provider || DEFAULT_AI_SETTINGS.provider;

    const promptText = await prompt(req.user.userId, threadId, message, {
      ragEnabled: aiSettings.ragEnabled,
    });
    if (!promptText) return sendResponse(res, 400, "Thread not found or system prompt missing");

    const existingMessages = await prisma.message.findMany({
      where: { threadId },
      orderBy: { sequence: "asc" },
    });
    const nextSequence = existingMessages.length + 1;

    const historyMessages = existingMessages.slice(-10);
    const formattedMessages = [
      ...historyMessages.map((m) =>
        m.role === "assistant"
          ? new AIMessage(m.content)
          : m.role === "tool"
            ? new ToolMessage(m.content)
            : new HumanMessage(m.content)
      ),
      new HumanMessage(message),
    ];

    const userMessage = await prisma.message.create({
      data: {
        threadId,
        role: "user",
        content: message,
        model,
        provider,
        sequence: nextSequence,
      },
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const responseStream = await streamMessage(promptText, formattedMessages, model, {
      temperature: aiSettings.temperature,
      maxOutputTokens: aiSettings.maxOutputTokens,
    }, req.user.userId, threadId);

    let fullContent = "";

    for await (const chunk of responseStream) {
      const content = chunk?.content || "";
      fullContent += content;
      res.write(`data: ${JSON.stringify({ type: "content", content })}\n\n`);
    }

    const tokenPromptText =
      promptText + " " + formattedMessages.map((m) => m.content).join(" ");
    const inputTokens = encode(tokenPromptText).length;
    const outputTokens = encode(fullContent).length;

    await prisma.message.create({
      data: {
        threadId,
        role: "assistant",
        content: fullContent,
        model,
        provider,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        sequence: nextSequence + 1,
        questionId: userMessage.messageId,
        promptText,
        aiSettingId: threadData.aiSettingId || null,
      },
    });

    if (aiSettings.ragEnabled) {
      const embedding = await generateEmbedding(fullContent);
      await saveDocumentEmbedding({
        userId: req.user.userId,
        threadId,
        messageId: userMessage.messageId,
        embedding,
      });
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Stream error:", error);
    if (!res.headersSent) {
      return sendResponse(res, 500, "Failed to stream AI response", { error: error.message });
    }
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};

export const getThreadUsage = async (req, res) => {
  try {
    const { threadId } = req.params;

    if (!threadId) {
      return sendResponse(res, 400, "Thread ID is required");
    }

    const messages = await prisma.message.findMany({
      where: { threadId },
      select: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        sequence: true,
        createdAt: true,
      },
      orderBy: { sequence: "asc" },
    });

    const history = messages
      .filter((m) => (m.inputTokens && m.inputTokens > 0) || (m.outputTokens && m.outputTokens > 0))
      .map((m) => ({
        sequence: m.sequence,
        inputTokens: m.inputTokens || 0,
        outputTokens: m.outputTokens || 0,
        totalTokens: m.totalTokens || 0,
        createdAt: m.createdAt,
      }));

    const totalUsage = messages.reduce(
      (acc, msg) => {
        acc.inputTokens += msg.inputTokens || 0;
        acc.outputTokens += msg.outputTokens || 0;
        acc.totalTokens += msg.totalTokens || 0;
        return acc;
      },
      { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
    );

    totalUsage.history = history;

    return sendResponse(res, 200, "Thread usage fetched successfully", totalUsage);
  } catch (error) {
    console.error("getThreadUsage error:", error);
    return sendResponse(res, 500, "Failed to fetch thread usage", { error: error.message });
  }
};
