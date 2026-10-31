import { normalizeContent, generateFingerprint } from "../utils/memoryNormalizer.js";
import {
    createLongTermMemory as dbCreateMemory,
    findMemoryByFingerprint,
    searchSimilarMemories,
    supersedeMemory,
    updateMemoryLastAccessedAt,
    updateLongTermMemory as dbUpdateMemory,
} from "./memoryService.js";
import { extractMemoryCandidates } from "./memoryExtractionService.js";
import { generateMemoryEmbedding } from "./memoryEmbeddingService.js";
import { retrieveRelevantMemories } from "./memoryRetrievalService.js";

export const persistMemoryWithDeduplication = async (memoryData) => {
    const {
        userId,
        content,
        memoryType = "SEMANTIC",
        category = "GENERAL",
        metadata = {},
        confidence = 0.9,
        importance = 3,
        sourceThreadId = null,
        sourceMessageId = null,
    } = memoryData;

    if (!userId || !content) {
        throw new Error("userId and content are required to persist a memory");
    }

    // 1. Normalization & Fingerprint
    const normalizedContent = normalizeContent(content);
    const fingerprint = generateFingerprint(normalizedContent, category, memoryType);

    // 2. Exact Duplicate Detection via Fingerprint
    const exactMatch = await findMemoryByFingerprint(userId, fingerprint);
    if (exactMatch) {
        await updateMemoryLastAccessedAt(exactMatch.longTermMemoryId);

        // If newly extracted confidence or importance is higher, touch it
        const shouldUpdate =
            (confidence && confidence > (exactMatch.confidence || 0)) ||
            (importance && importance > (exactMatch.importance || 0));

        if (shouldUpdate) {
            await dbUpdateMemory(exactMatch.longTermMemoryId, {
                confidence: Math.max(confidence, exactMatch.confidence || 0),
                importance: Math.max(importance, exactMatch.importance || 0),
                metadata: { ...(exactMatch.metadata || {}), ...metadata },
            });
        }

        return {
            action: "EXACT_DUPLICATE_TOUCHED",
            memoryId: exactMatch.longTermMemoryId,
            memory: exactMatch,
        };
    }

    // 3. Generate Vector Embedding
    const embedding = await generateMemoryEmbedding(content);

    // 4. Semantic Similarity Search (active memories for this user)
    const similarMemories = await searchSimilarMemories(userId, embedding, {
        limit: 3,
        minSimilarity: 0.85,
    });

    const topMatch = similarMemories.length > 0 ? similarMemories[0] : null;

    // 5. Deduplication Decisions
    // Case A: Near-identical semantic duplicate (>= 0.94 similarity)
    if (topMatch && topMatch.similarity >= 0.94) {
        await updateMemoryLastAccessedAt(topMatch.longTermMemoryId);

        await dbUpdateMemory(topMatch.longTermMemoryId, {
            confidence: Math.max(confidence, topMatch.confidence || 0),
            importance: Math.max(importance, topMatch.importance || 0),
            metadata: { ...(topMatch.metadata || {}), ...metadata },
        });

        return {
            action: "SEMANTIC_DUPLICATE_TOUCHED",
            similarity: topMatch.similarity,
            memoryId: topMatch.longTermMemoryId,
            memory: topMatch,
        };
    }

    // Case B: Semantic update / contradiction in same category (0.85 <= similarity < 0.94)
    if (topMatch && topMatch.category === category && topMatch.similarity >= 0.85) {
        // Supersede the existing older memory
        await supersedeMemory(topMatch.longTermMemoryId, userId);

        // Create the new active memory
        const created = await dbCreateMemory({
            userId,
            memoryType,
            category,
            content,
            normalizedContent,
            fingerprint,
            metadata: {
                ...metadata,
                supersededMemoryId: topMatch.longTermMemoryId,
            },
            confidence,
            importance,
            status: "ACTIVE",
            sourceThreadId,
            sourceMessageId,
            embeddingModel: "gemini-embedding-001",
            embeddingDimensions: embedding.length,
            embeddedAt: new Date(),
        });

        const { saveMemoryEmbedding } = await import("./memoryService.js");
        await saveMemoryEmbedding(created.longTermMemoryId, embedding);

        return {
            action: "SUPERSEDED_AND_CREATED",
            supersededId: topMatch.longTermMemoryId,
            memoryId: created.longTermMemoryId,
            memory: created,
        };
    }

    // Case C: Brand new distinct fact
    const created = await dbCreateMemory({
        userId,
        memoryType,
        category,
        content,
        normalizedContent,
        fingerprint,
        metadata,
        confidence,
        importance,
        status: "ACTIVE",
        sourceThreadId,
        sourceMessageId,
        embeddingModel: "gemini-embedding-001",
        embeddingDimensions: embedding.length,
        embeddedAt: new Date(),
    });

    const { saveMemoryEmbedding } = await import("./memoryService.js");
    await saveMemoryEmbedding(created.longTermMemoryId, embedding);

    return {
        action: "CREATED",
        memoryId: created.longTermMemoryId,
        memory: created,
    };
};

export const extractLongTermMemory = async (data) => {
    const { userId, message, sourceThreadId = null, sourceMessageId = null } = data;

    if (!message) {
        return { shouldExtract: false, count: 0, results: [] };
    }

    // Extract candidates using agent via memoryExtractionService
    const extractionResult = await extractMemoryCandidates(message);

    if (!extractionResult.shouldExtract || extractionResult.memories.length === 0) {
        return {
            shouldExtract: false,
            count: 0,
            results: [],
        };
    }

    // Process and persist each extracted memory candidate through deduplication pipeline
    const results = [];
    if (userId) {
        for (const candidate of extractionResult.memories) {
            try {
                const persisted = await persistMemoryWithDeduplication({
                    userId,
                    ...candidate,
                    sourceThreadId,
                    sourceMessageId,
                });
                results.push(persisted);
            } catch (err) {
                console.error("Failed to persist memory candidate:", candidate, err);
                results.push({ action: "ERROR", error: err.message, candidate });
            }
        }
    }

    return {
        shouldExtract: true,
        count: extractionResult.memories.length,
        candidates: extractionResult.memories,
        results,
    };
};

export const createLongTermMemory = async (data) => {
    // If raw message provided, run through extraction & persistence pipeline
    if (data.message && !data.content) {
        return await extractLongTermMemory(data);
    }

    // Single pre-formed memory item provided
    return await persistMemoryWithDeduplication(data);
};

export const getRelevantMemories = async (userId, query, options = {}) => {
    return await retrieveRelevantMemories(userId, query, options);
};