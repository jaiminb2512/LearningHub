import prisma from "../dbConnect/prismaClient.js";

/**
 * Semantic search over document embeddings for a thread.
 * Content lives on Message; documents only stores the vector.
 */
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
