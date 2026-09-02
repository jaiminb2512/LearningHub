import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { internetSearchTool } from "./aiTools.js"
import { createAgent } from "langchain";
import dotenv from "dotenv";

dotenv.config();

export const generateMessage = async (systemPrompt, messages, provider, model) => {
    const chat = new ChatGoogleGenerativeAI({
        model: model,
        apiKey: process.env.GEMINI_API_KEY
    });

    const response = await chat.invoke([
        { role: "system", content: systemPrompt },
        ...messages,
    ]);

    return response;
}

export const streamMessage = async (systemPrompt, messages, provider, model) => {
    const chat = new ChatGoogleGenerativeAI({
        model: model,
        apiKey: process.env.GEMINI_API_KEY,
        streamUsage: true
    });

    return await chat.stream([
        { role: "system", content: systemPrompt },
        ...messages,
    ]);
}

export const fetchNewsAgent = async (systemPrompt, provider, model) => {
    const llm = new ChatGoogleGenerativeAI({
        model: model,
        apiKey: process.env.GEMINI_API_KEY
    });

    const agent = createAgent({
        model: llm,
        tools: [internetSearchTool],
        prompt: `You are an expert technology news assistant.
System Instructions: ${systemPrompt}

Rules:
1. ALWAYS use internet_search for latest or recent news.
2. Never guess recent information.
3. Summarize the search results clearly.
4. Mention dates when available.
5. If multiple news items exist, rank them by importance.
6. Keep the response factual and concise.
7. If search returns nothing, say that you couldn't find reliable recent information.`
    });

    const result = await agent.invoke({
        messages: [{ role: "user", content: "Give me today's latest AI news" }]
    });

    return result.messages[result.messages.length - 1].content;
};