import prisma from "../dbConnect/prismaClient.js";

export const semanticSearch = async (userId, queryEmbedding, limit = 5) => {
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
        throw new Error("queryEmbedding must be a non-empty array");
    }

    const vector = `[${queryEmbedding.join(",")}]`;

    const results = await prisma.$queryRaw`
        SELECT
            d."id",
            d."userId",
            d."threadId",
            d."messageId",
            d."embeddingModel",
            m."content",
            m."role",
            1 - (d."embedding" <=> ${vector}::vector) AS similarity
        FROM "Document" d
        INNER JOIN "Message" m ON m."messageId" = d."messageId"
        WHERE d."userId" = ${userId}
        ORDER BY d."embedding" <=> ${vector}::vector
        LIMIT ${limit}
    `;

    return results;
};

export const semanticSearchKnowledgeChunks = async (
    userId,
    threadId,
    queryEmbedding,
    limit = 5
) => {
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
        throw new Error("queryEmbedding must be a non-empty array");
    }
    if (!threadId) {
        throw new Error("threadId is required for knowledge chunk search");
    }

    const vector = `[${queryEmbedding.join(",")}]`;

    const results = await prisma.$queryRaw`
        SELECT
            kc."knowledgeChunkId",
            kc."sourceId",
            kc."userId",
            kc."chunkIndex",
            kc."content",
            kc."embeddingModel",
            kc."tokenCount",
            ks."originalName" AS "sourceName",
            ks."mimeType" AS "sourceMimeType",
            1 - (kc."embedding" <=> ${vector}::vector) AS similarity
        FROM "KnowledgeChunk" kc
        INNER JOIN "KnowledgeSource" ks
            ON ks."knowledgeSourceId" = kc."sourceId"
        INNER JOIN "ThreadKnowledgeSource" tks
            ON tks."knowledgeSourceId" = ks."knowledgeSourceId"
        WHERE kc."userId" = ${userId}
          AND tks."threadId" = ${threadId}
          AND tks."isActive" = true
          AND ks."status" = 'READY'
          AND kc."embedding" IS NOT NULL
        ORDER BY kc."embedding" <=> ${vector}::vector
        LIMIT ${limit}
    `;

    return results;
};

export const semanticSearchForChat = async (
    userId,
    threadId,
    queryEmbedding,
    {
        knowledgeLimit = 5,
        chatMemoryLimit = 3,
        knowledgeRagEnabled = true,
        ragEnabled = true,
    } = {}
) => {
    const [knowledgeChunks, chatDocuments] = await Promise.all([
        knowledgeRagEnabled
            ? semanticSearchKnowledgeChunks(userId, threadId, queryEmbedding, knowledgeLimit)
            : Promise.resolve([]),
        ragEnabled
            ? semanticSearch(userId, queryEmbedding, chatMemoryLimit)
            : Promise.resolve([]),
    ]);

    return {
        knowledgeChunks,
        chatDocuments,
    };
};
