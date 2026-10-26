import { generateMemory } from "../utils/agent.js";

const VALID_MEMORY_TYPES = new Set(["PROFILE", "PROJECT", "EPISODIC", "SEMANTIC", "PERIODIC"]);

const parseAgentJson = (raw) => {
    if (!raw || typeof raw !== "string") {
        return { shouldExtract: false, memories: [] };
    }

    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    try {
        return JSON.parse(cleaned);
    } catch (err) {
        console.error("Failed to parse memory agent output JSON:", raw, err);
        return { shouldExtract: false, memories: [] };
    }
};

export const extractMemoryCandidates = async (text) => {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
        return { shouldExtract: false, memories: [] };
    }

    const rawResponse = await generateMemory(text);
    const parsed = parseAgentJson(rawResponse);

    if (!parsed || !parsed.shouldExtract || !Array.isArray(parsed.memories)) {
        return { shouldExtract: false, memories: [] };
    }

    // Clean and validate candidates
    const validMemories = parsed.memories
        .filter((m) => m && typeof m.content === "string" && m.content.trim().length > 0)
        .map((m) => {
            const memoryType = VALID_MEMORY_TYPES.has(m.memoryType?.toUpperCase())
                ? m.memoryType.toUpperCase()
                : "SEMANTIC";

            return {
                memoryType,
                category: (m.category || "GENERAL").toUpperCase().replace(/\s+/g, "_"),
                content: m.content.trim(),
                confidence: typeof m.confidence === "number" ? Math.min(Math.max(m.confidence, 0), 1) : 0.9,
                importance: typeof m.importance === "number" ? Math.min(Math.max(Math.round(m.importance), 1), 5) : 3,
                metadata: m.metadata && typeof m.metadata === "object" ? m.metadata : {},
            };
        });

    return {
        shouldExtract: validMemories.length > 0,
        memories: validMemories,
    };
};
