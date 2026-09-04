import { AI_PROVIDERS } from "../utils/aiConfig.js";
import sendResponse from "../utils/response.js";
import { generateMessage, streamMessage } from "../utils/agent.js";
import prisma from "../dbConnect/prismaClient.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { encode } from "gpt-tokenizer";
import { prompt } from "../utils/systemPrompts.js";
import { generateEmbedding } from "../utils/agent.js";
import { randomUUID } from "node:crypto";

const saveDocumentEmbedding = async ({ userId, threadId, messageId, embedding }) => {
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("Generated embedding is empty or invalid");
  }

  const vectorValue = `[${embedding.join(",")}]`;

  // Prisma cannot write Unsupported vector fields through document.create().
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

/**
 * @desc    Get list of AI providers and models
 * @route   GET /api/ai/providers
 * @access  Private
 */
export const getProviders = async (req, res) => {
  try {
    return sendResponse(res, 200, "AI providers fetched successfully", AI_PROVIDERS);
  } catch (error) {
    console.error("getProviders error:", error);
    return sendResponse(res, 500, "Failed to fetch AI providers", { error: error.message });
  }
};

/**
 * @desc    Generate AI response
 * @route   POST /api/ai/generate
 * @access  Private
 */

export const generate = async (req, res) => {
  try {

    const { threadId, message } = req.body;

    if (!message) {
      return sendResponse(res, 400, "Message is required");
    }

    if (!threadId) {
      return sendResponse(res, 400, "Thread is required");
    }

    const threadData = await prisma.thread.findUnique({
      where: { threadId },
      include: { systemPrompt: true },
    });

    if (!threadData) {
      return sendResponse(res, 400, "Thread not found");
    }

    let promptText = threadData.systemPrompt?.prompt;
    if (!promptText) {
      const fallback = await prisma.systemPrompt.findFirst({
        where: { name: "AI chat" },
      });
      promptText = fallback?.prompt;
    }

    if (!promptText) {
      return sendResponse(res, 400, "No system prompt linked to this thread");
    }

    // 1. Get current message history and order
    const existingMessages = await prisma.message.findMany({
      where: { threadId },
      orderBy: { sequence: "asc" }
    });

    const nextSequence = existingMessages.length + 1;

    // 2. Save the User's current message to DB first
    const userMessage = await prisma.message.create({
      data: {
        threadId,
        role: "user",
        content: message,
        model: "gemini-3.1-flash-lite-preview", // Use a valid model name
        provider: "google",
        sequence: nextSequence
      }
    });

    // 3. Prepare message history for LangChain
    // Limit to last 10 messages for context
    const historyMessages = existingMessages.slice(-10);

    const formattedMessages = [
      ...historyMessages.map(m =>
        m.role === "assistant" ? new AIMessage(m.content) : new HumanMessage(m.content)
      ),
      new HumanMessage(message)
    ];

    // 4. Generate AI response
    const response = await generateMessage(
      promptText,
      formattedMessages,
      "google",
      "gemini-3.1-flash-lite-preview"
    );

    // 5. Save the Assistant's response to DB
    const aiContent = typeof response.content === 'string'
      ? response.content
      : (Array.isArray(response.content) && response.content.length === 0
        ? ""
        : JSON.stringify(response.content));

    const embedding = await generateEmbedding(aiContent);

    await prisma.message.create({
      data: {
        threadId,
        role: "assistant",
        content: aiContent,
        model: "gemini-3.1-flash-lite-preview",
        provider: "google",
        inputTokens: response.response_metadata?.tokenUsage?.promptTokens || 0,
        outputTokens: response.response_metadata?.tokenUsage?.completionTokens || 0,
        totalTokens: response.response_metadata?.tokenUsage?.totalTokens || 0,
        sequence: nextSequence + 1,
        questionId: userMessage.messageId // Link answer to the question
      },
    });

    await saveDocumentEmbedding({
      userId: req.user.userId,
      threadId,
      messageId: userMessage.messageId,
      embedding
    });

    return sendResponse(res, 200, "AI response generated successfully", aiContent);

  } catch (error) {
    console.error(error.message)
    return sendResponse(res, 500, "Failed to generate AI response", { error: error.message });
  }
}

/**
 * @desc    Stream AI response
 * @route   POST /api/ai/stream
 * @access  Private
 */
export const stream = async (req, res) => {
  try {
    const { threadId, message } = req.body;

    if (!message) return sendResponse(res, 400, "Message is required");
    if (!threadId) return sendResponse(res, 400, "Thread is required");
    if (!req.user?.userId) return sendResponse(res, 401, "Authentication required");

    const promptText = await prompt(req.user.userId, threadId, message);
    if (!promptText) return sendResponse(res, 400, "Thread not found or system prompt missing");

    const existingMessages = await prisma.message.findMany({
      where: { threadId },
      orderBy: { sequence: "asc" }
    });
    const nextSequence = existingMessages.length + 1;

    const historyMessages = existingMessages.slice(-10);
    const formattedMessages = [
      ...historyMessages.map(m =>
        m.role === "assistant" ? new AIMessage(m.content) : new HumanMessage(m.content)
      ),
      new HumanMessage(message)
    ];

    // Save User message
    const userMessage = await prisma.message.create({
      data: {
        threadId,
        role: "user",
        content: message,
        model: "gemini-3.1-flash-lite-preview",
        provider: "google",
        sequence: nextSequence
      }
    });

    // SSE Setup
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const responseStream = await streamMessage(
      promptText,
      formattedMessages,
      "google",
      "gemini-3.1-flash-lite-preview"
    );

    let fullContent = "";

    for await (const chunk of responseStream) {
      const content = chunk?.content || "";
      fullContent += content;

      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    // Manual token calculation using gpt-tokenizer (fallback)
    const tokenPromptText = promptText + " " + formattedMessages.map(m => m.content).join(" ");
    const manualInputTokens = encode(tokenPromptText).length;
    const manualOutputTokens = encode(fullContent).length;

    const inputTokens = manualInputTokens;
    const outputTokens = manualOutputTokens;
    const embedding = await generateEmbedding(fullContent);

    // Save AI response to DB after stream ends
    await prisma.message.create({
      data: {
        threadId,
        role: "assistant",
        content: fullContent,
        model: "gemini-3.1-flash-lite-preview",
        provider: "google",
        inputTokens: inputTokens,
        outputTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
        sequence: nextSequence + 1,
        questionId: userMessage.messageId
      },
    });
    await saveDocumentEmbedding({
      userId: req.user.userId,
      threadId,
      messageId: userMessage.messageId,
      embedding
    });

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
}

/**
 * @desc    Get total token usage for a thread
 * @route   GET /api/ai/thread/:threadId/usage
 * @access  Private
 */
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
        createdAt: true
      },
      orderBy: { sequence: 'asc' }
    });

    const history = messages
      .filter(m => (m.inputTokens && m.inputTokens > 0) || (m.outputTokens && m.outputTokens > 0))
      .map(m => ({
        sequence: m.sequence,
        inputTokens: m.inputTokens || 0,
        outputTokens: m.outputTokens || 0,
        totalTokens: m.totalTokens || 0,
        createdAt: m.createdAt
      }));

    const totalUsage = messages.reduce((acc, msg) => {
      acc.inputTokens += msg.inputTokens || 0;
      acc.outputTokens += msg.outputTokens || 0;
      acc.totalTokens += msg.totalTokens || 0;
      return acc;
    }, { inputTokens: 0, outputTokens: 0, totalTokens: 0 });

    totalUsage.history = history;

    return sendResponse(res, 200, "Thread usage fetched successfully", totalUsage);
  } catch (error) {
    console.error("getThreadUsage error:", error);
    return sendResponse(res, 500, "Failed to fetch thread usage", { error: error.message });
  }
};

export const testBuildSystemPrompt = async (req, res) => {
  try {
    const prompt = await prompt("da91ba00-5972-4633-9571-6d9882659ded", "cde2247f-400e-40f8-943c-e7b5d5799738", "test message");
    return sendResponse(res, 200, "System prompt built successfully", prompt);
  } catch (error) {
    console.error("buildSystemPrompt error:", error);
    return sendResponse(res, 500, "Failed to build system prompt", { error: error.message });
  }
}
