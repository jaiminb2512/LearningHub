import { generateEmbedding } from "../utils/agent.js";

export const generateMemoryEmbedding = async (text) => {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
        throw new Error("Text must be a non-empty string to generate an embedding");
    }

    const vector = await generateEmbedding(text.trim());

    if (!Array.isArray(vector) || vector.length === 0) {
        throw new Error("Generated embedding is empty or invalid");
    }

    return vector;
};

export const generateQueryEmbedding = async (query) => {
    return await generateMemoryEmbedding(query);
};
