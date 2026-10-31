import { generateQueryEmbedding } from "./memoryEmbeddingService.js";
import { searchSimilarMemories, updateMemoryLastAccessedAt } from "./memoryService.js";

export const retrieveRelevantMemories = async (userId, query, options = {}) => {
    if (!userId || !query || typeof query !== "string" || query.trim().length === 0) {
        return [];
    }

    const limit = options.limit || 5;
    const minSimilarity = options.minSimilarity !== undefined ? options.minSimilarity : 0.65;
    const touchLastAccessed = options.touchLastAccessed !== false;

    // 1. Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(query);

    // 2. Query similar memories from PostgreSQL via memoryService
    const candidates = await searchSimilarMemories(userId, queryEmbedding, {
        limit: limit * 2, // Fetch slightly more to re-rank
        minSimilarity,
    });

    if (!candidates || candidates.length === 0) {
        return [];
    }

    // 3. Rank candidates based on combination of similarity and importance
    const now = Date.now();
    const ranked = candidates
        .map((candidate) => {
            const similarity = Number(candidate.similarity) || 0;
            const importanceWeight = (candidate.importance || 3) / 5; // Scale 1-5 to 0.2 - 1.0

            // Slight recency decay factor (over 30 days)
            const ageDays = (now - new Date(candidate.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
            const recencyFactor = Math.max(0.8, 1 - ageDays * 0.005);

            const score = similarity * 0.7 + importanceWeight * 0.2 + recencyFactor * 0.1;

            return {
                ...candidate,
                score,
            };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    // 4. Update lastAccessedAt timestamp for retrieved items
    if (touchLastAccessed && ranked.length > 0) {
        const ids = ranked.map((m) => m.longTermMemoryId);
        updateMemoryLastAccessedAt(ids).catch((err) => {
            console.error("Failed to update lastAccessedAt on retrieved memories:", err);
        });
    }

    return ranked;
};
