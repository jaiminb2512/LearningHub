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