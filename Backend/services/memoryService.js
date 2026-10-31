import prisma from "../dbConnect/prismaClient.js";

export class MemoryServiceError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = "MemoryServiceError";
        this.statusCode = statusCode;
    }
}

const buildWhereClause = (filters = {}, userId = null) => {
    const where = {};

    const effectiveUserId = userId || filters.userId;
    if (effectiveUserId) {
        where.userId = effectiveUserId;
    }

    if (filters.memoryType) {
        where.memoryType = Array.isArray(filters.memoryType)
            ? { in: filters.memoryType }
            : filters.memoryType;
    }

    if (filters.category) {
        where.category = Array.isArray(filters.category)
            ? { in: filters.category }
            : filters.category;
    }

    if (filters.status) {
        where.status = Array.isArray(filters.status)
            ? { in: filters.status }
            : filters.status;
    }

    if (filters.fingerprint) {
        where.fingerprint = filters.fingerprint;
    }

    if (filters.sourceThreadId) {
        where.sourceThreadId = filters.sourceThreadId;
    }

    if (filters.sourceMessageId) {
        where.sourceMessageId = filters.sourceMessageId;
    }

    if (filters.minImportance !== undefined) {
        where.importance = {
            ...(where.importance || {}),
            gte: Number(filters.minImportance),
        };
    }

    if (filters.maxImportance !== undefined) {
        where.importance = {
            ...(where.importance || {}),
            lte: Number(filters.maxImportance),
        };
    }

    if (filters.importance !== undefined && filters.minImportance === undefined && filters.maxImportance === undefined) {
        where.importance = Number(filters.importance);
    }

    if (filters.minConfidence !== undefined) {
        where.confidence = {
            ...(where.confidence || {}),
            gte: Number(filters.minConfidence),
        };
    }

    if (filters.search) {
        where.OR = [
            { content: { contains: filters.search, mode: "insensitive" } },
            { normalizedContent: { contains: filters.search, mode: "insensitive" } },
            { category: { contains: filters.search, mode: "insensitive" } },
        ];
    }

    if (filters.validAt) {
        const at = new Date(filters.validAt);
        where.AND = [
            ...(where.AND || []),
            {
                OR: [{ validFrom: null }, { validFrom: { lte: at } }],
            },
            {
                OR: [{ validUntil: null }, { validUntil: { gte: at } }],
            },
        ];
    }

    return where;
};

export const createLongTermMemory = async (data) => {
    if (!data?.userId) {
        throw new MemoryServiceError("userId is required to create a memory");
    }
    if (!data?.memoryType) {
        throw new MemoryServiceError("memoryType is required to create a memory");
    }
    if (!data?.category) {
        throw new MemoryServiceError("category is required to create a memory");
    }
    if (!data?.content) {
        throw new MemoryServiceError("content is required to create a memory");
    }
    if (!data?.normalizedContent) {
        throw new MemoryServiceError("normalizedContent is required to create a memory");
    }
    if (!data?.fingerprint) {
        throw new MemoryServiceError("fingerprint is required to create a memory");
    }

    return await prisma.longTermMemory.create({
        data: {
            userId: data.userId,
            memoryType: data.memoryType,
            category: data.category,
            content: data.content,
            normalizedContent: data.normalizedContent,
            fingerprint: data.fingerprint,
            metadata: data.metadata ?? null,
            confidence: data.confidence !== undefined ? Number(data.confidence) : null,
            importance: data.importance !== undefined ? Number(data.importance) : 3,
            status: data.status || "ACTIVE",
            sourceThreadId: data.sourceThreadId || null,
            sourceMessageId: data.sourceMessageId || null,
            embeddingModel: data.embeddingModel || null,
            embeddingDimensions: data.embeddingDimensions || 3072,
            embeddedAt: data.embeddedAt ? new Date(data.embeddedAt) : null,
            validFrom: data.validFrom ? new Date(data.validFrom) : null,
            validUntil: data.validUntil ? new Date(data.validUntil) : null,
            lastAccessedAt: data.lastAccessedAt ? new Date(data.lastAccessedAt) : null,
        },
    });
}

export const getLongTermMemoryById = async (longTermMemoryId, userId = null) => {
    if (!longTermMemoryId) {
        throw new MemoryServiceError("longTermMemoryId is required");
    }

    const where = { longTermMemoryId };
    if (userId) {
        where.userId = userId;
    }

    return await prisma.longTermMemory.findFirst({
        where,
        include: {
            sourceThread: {
                select: {
                    threadId: true,
                    title: true,
                },
            },
            sourceMessage: {
                select: {
                    messageId: true,
                    role: true,
                },
            },
        },
    });
}

export const getLongTermMemories = async (filters = {}, options = {}) => {
    const where = buildWhereClause(filters);

    const take = options.limit !== undefined ? Number(options.limit) : options.take !== undefined ? Number(options.take) : undefined;
    const skip = options.skip !== undefined
        ? Number(options.skip)
        : options.page && take
            ? (Number(options.page) - 1) * take
            : undefined;

    const orderBy = options.orderBy || { createdAt: "desc" };

    const include = options.includeRelations
        ? {
            sourceThread: {
                select: {
                    threadId: true,
                    title: true,
                },
            },
            sourceMessage: {
                select: {
                    messageId: true,
                    role: true,
                },
            },
        }
        : undefined;

    // Return paginated meta object if requested
    if (options.paginate) {
        const [memories, total] = await Promise.all([
            prisma.longTermMemory.findMany({
                where,
                take,
                skip,
                orderBy,
                include,
            }),
            prisma.longTermMemory.count({ where }),
        ]);

        return {
            memories,
            total,
            limit: take,
            skip: skip || 0,
            page: options.page ? Number(options.page) : Math.floor((skip || 0) / (take || 1)) + 1,
        };
    }

    return await prisma.longTermMemory.findMany({
        where,
        take,
        skip,
        orderBy,
        include,
    });
}

export const updateLongTermMemory = async (longTermMemoryId, updateData = {}, userId = null) => {
    if (!longTermMemoryId) {
        throw new MemoryServiceError("longTermMemoryId is required for update");
    }

    // Ensure record exists and matches userId if supplied
    const existing = await prisma.longTermMemory.findFirst({
        where: {
            longTermMemoryId,
            ...(userId ? { userId } : {}),
        },
    });

    if (!existing) {
        throw new MemoryServiceError("Long-term memory not found", 404);
    }

    const data = {};

    if (updateData.memoryType !== undefined) data.memoryType = updateData.memoryType;
    if (updateData.category !== undefined) data.category = updateData.category;
    if (updateData.content !== undefined) data.content = updateData.content;
    if (updateData.normalizedContent !== undefined) data.normalizedContent = updateData.normalizedContent;
    if (updateData.fingerprint !== undefined) data.fingerprint = updateData.fingerprint;
    if (updateData.metadata !== undefined) data.metadata = updateData.metadata;
    if (updateData.confidence !== undefined) data.confidence = Number(updateData.confidence);
    if (updateData.importance !== undefined) data.importance = Number(updateData.importance);
    if (updateData.status !== undefined) data.status = updateData.status;
    if (updateData.sourceThreadId !== undefined) data.sourceThreadId = updateData.sourceThreadId;
    if (updateData.sourceMessageId !== undefined) data.sourceMessageId = updateData.sourceMessageId;
    if (updateData.embeddingModel !== undefined) data.embeddingModel = updateData.embeddingModel;
    if (updateData.embeddingDimensions !== undefined) data.embeddingDimensions = Number(updateData.embeddingDimensions);
    if (updateData.embeddedAt !== undefined) {
        data.embeddedAt = updateData.embeddedAt ? new Date(updateData.embeddedAt) : null;
    }
    if (updateData.validFrom !== undefined) {
        data.validFrom = updateData.validFrom ? new Date(updateData.validFrom) : null;
    }
    if (updateData.validUntil !== undefined) {
        data.validUntil = updateData.validUntil ? new Date(updateData.validUntil) : null;
    }
    if (updateData.lastAccessedAt !== undefined) {
        data.lastAccessedAt = updateData.lastAccessedAt ? new Date(updateData.lastAccessedAt) : null;
    }

    return await prisma.longTermMemory.update({
        where: { longTermMemoryId },
        data,
    });
}

export const deleteLongTermMemory = async (longTermMemoryId, userId = null) => {
    if (!longTermMemoryId) {
        throw new MemoryServiceError("longTermMemoryId is required for deletion");
    }

    const existing = await prisma.longTermMemory.findFirst({
        where: {
            longTermMemoryId,
            ...(userId ? { userId } : {}),
        },
    });

    if (!existing) {
        throw new MemoryServiceError("Long-term memory not found", 404);
    }

    return await prisma.longTermMemory.delete({
        where: { longTermMemoryId },
    });
}

export const updateMemoryLastAccessedAt = async (memoryIds, timestamp = new Date(), userId = null) => {
    if (!memoryIds || (Array.isArray(memoryIds) && memoryIds.length === 0)) {
        throw new MemoryServiceError("memoryIds is required to update lastAccessedAt");
    }

    const accessedAt = new Date(timestamp);

    // If array of IDs, perform batch update
    if (Array.isArray(memoryIds)) {
        return await prisma.longTermMemory.updateMany({
            where: {
                longTermMemoryId: { in: memoryIds },
                ...(userId ? { userId } : {}),
            },
            data: {
                lastAccessedAt: accessedAt,
            },
        });
    }

    // Single ID update
    const where = {
        longTermMemoryId: memoryIds,
        ...(userId ? { userId } : {}),
    };

    const existing = await prisma.longTermMemory.findFirst({ where });
    if (!existing) {
        throw new MemoryServiceError("Long-term memory not found", 404);
    }

    return await prisma.longTermMemory.update({
        where: { longTermMemoryId: memoryIds },
        data: {
            lastAccessedAt: accessedAt,
        },
    });
};

/**
 * Save pgvector embedding directly to a memory record using raw SQL
 * @param {string} longTermMemoryId
 * @param {number[]} embedding - Array of embedding floats (e.g., 3072 dimensions)
 * @param {string} [model="gemini-embedding-001"]
 * @returns {Promise<number>}
 */
export const saveMemoryEmbedding = async (
    longTermMemoryId,
    embedding,
    model = "gemini-embedding-001"
) => {
    if (!longTermMemoryId) {
        throw new MemoryServiceError("longTermMemoryId is required to save embedding");
    }
    if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new MemoryServiceError("Embedding must be a non-empty array of numbers");
    }

    const vectorValue = `[${embedding.join(",")}]`;
    const dimensions = embedding.length;

    return await prisma.$executeRaw`
        UPDATE "LongTermMemory"
        SET "embedding" = ${vectorValue}::vector,
            "embeddingModel" = ${model},
            "embeddingDimensions" = ${dimensions},
            "embeddedAt" = ${new Date()}
        WHERE "longTermMemoryId" = ${longTermMemoryId}
    `;
};

/**
 * Find active memory by user and fingerprint for exact duplicate detection
 * @param {string} userId
 * @param {string} fingerprint
 * @returns {Promise<Object|null>}
 */
export const findMemoryByFingerprint = async (userId, fingerprint) => {
    if (!userId || !fingerprint) return null;

    return await prisma.longTermMemory.findFirst({
        where: {
            userId,
            fingerprint,
            status: "ACTIVE",
        },
    });
};

/**
 * Perform semantic similarity search using pgvector cosine similarity
 * @param {string} userId
 * @param {number[]} queryEmbedding
 * @param {Object} [options={}]
 * @param {number} [options.limit=5]
 * @param {number} [options.minSimilarity=0.7]
 * @param {string} [options.memoryType]
 * @param {string} [options.category]
 * @returns {Promise<Array>}
 */
export const searchSimilarMemories = async (userId, queryEmbedding, options = {}) => {
    if (!userId) {
        throw new MemoryServiceError("userId is required for similarity search");
    }
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
        throw new MemoryServiceError("queryEmbedding must be a non-empty array");
    }

    const limit = options.limit || 5;
    const minSimilarity = options.minSimilarity !== undefined ? options.minSimilarity : 0.7;
    const vector = `[${queryEmbedding.join(",")}]`;

    // Query active memories for the user having an embedding
    const results = await prisma.$queryRaw`
        SELECT
            m."longTermMemoryId",
            m."userId",
            m."memoryType",
            m."category",
            m."content",
            m."normalizedContent",
            m."fingerprint",
            m."metadata",
            m."confidence",
            m."importance",
            m."status",
            m."sourceThreadId",
            m."sourceMessageId",
            m."createdAt",
            m."updatedAt",
            m."lastAccessedAt",
            1 - (m."embedding" <=> ${vector}::vector) AS similarity
        FROM "LongTermMemory" m
        WHERE m."userId" = ${userId}
          AND m."status" = 'ACTIVE'
          AND m."embedding" IS NOT NULL
          AND (1 - (m."embedding" <=> ${vector}::vector)) >= ${minSimilarity}
        ORDER BY m."embedding" <=> ${vector}::vector ASC
        LIMIT ${limit}
    `;

    return results;
};

/**
 * Mark a memory as SUPERSEDED when updated or replaced
 * @param {string} longTermMemoryId
 * @param {string} [userId=null]
 * @returns {Promise<Object>}
 */
export const supersedeMemory = async (longTermMemoryId, userId = null) => {
    return await updateLongTermMemory(longTermMemoryId, { status: "SUPERSEDED" }, userId);
};