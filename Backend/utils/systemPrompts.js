import prisma from "../dbConnect/prismaClient.js";
import { generateEmbedding } from "../utils/agent.js";
import { semanticSearch } from "./RAGService.js";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

export const fetchSystemPrompt = async (name) => {
    const systemPrompt = await prisma.systemPrompt.findFirst({
        where: { name },
    });
    if (!systemPrompt) {
        return null;
    }
    return {
        name: systemPrompt.name,
        prompt: systemPrompt.prompt,
    };
}

export const prompt = async (userId, threadId, userMessage) => {

    const threadData = await prisma.thread.findUnique({
        where: { threadId, userId },
        include: {
            systemPrompt: true,
            messages: {
                orderBy: { sequence: "asc" }
            },
            documents: {
                orderBy: { embeddedAt: "desc" }
            }
        },
    });

    if (!threadData) return null;

    let promptText = threadData.systemPrompt.prompt;
    if (!promptText) {
        return null;
    }

    const nextSequence = threadData.messages.length + 1;
    const userMessageQueryEmbedding = await generateEmbedding(userMessage);

    const documents = await semanticSearch(userId, userMessageQueryEmbedding, 5);
    const historyMessages = threadData.messages.slice(-10);

    const formattedMessages = [
        ...historyMessages.map(m =>
            m.role === "assistant" ? new AIMessage(m.content) : new HumanMessage(m.content)
        ),
        new HumanMessage(userMessage)
    ];

    const relatedDocs = documents
        .map((document) => document.content)
        .filter(Boolean)
        .join("\n\n");

    const prompt =
        promptText +
        "\n\nHere are the related documents:\n" +
        (relatedDocs || "No related documents found.") +
        "\n\nUser message: " +

        userMessage;

    return prompt;
}