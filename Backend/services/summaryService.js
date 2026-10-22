import prisma from "../dbConnect/prismaClient.js";

export const createSummary = async (
    threadIdOrData,
    summary,
    lastSummarizedMessageId,
    lastSummarizedMessageCount,
    tokenCount = 0
) => {
    const data =
        typeof threadIdOrData === "object" && threadIdOrData !== null
            ? threadIdOrData
            : {
                threadId: threadIdOrData,
                summary,
                lastSummarizedMessageId,
                lastSummarizedMessageCount,
                tokenCount,
            };

    let messageId = data.lastSummarizedMessageId;
    let messageCount = data.lastSummarizedMessageCount;

    if (!messageId || messageCount == null) {
        const lastMsg = await prisma.message.findFirst({
            where: { threadId: data.threadId },
            orderBy: { sequence: "desc" },
        });
        messageId = messageId || lastMsg?.messageId;
        if (messageCount == null) {
            messageCount = await prisma.message.count({
                where: { threadId: data.threadId },
            });
        }
    }

    if (!messageId) {
        throw new Error(`Cannot create summary: no messages found for thread ${data.threadId}`);
    }

    return prisma.summary.create({
        data: {
            threadId: data.threadId,
            summary: data.summary,
            lastSummarizedMessageId: messageId,
            lastSummarizedMessageCount: messageCount || 0,
            tokenCount: data.tokenCount || 0,
        },
    });
};

export const addSummary = createSummary;

export const updateSummary = async (
    threadIdOrData,
    summary,
    lastSummarizedMessageId,
    lastSummarizedMessageCount,
    tokenCount = 0
) => {
    const data =
        typeof threadIdOrData === "object" && threadIdOrData !== null
            ? threadIdOrData
            : {
                threadId: threadIdOrData,
                summary,
                lastSummarizedMessageId,
                lastSummarizedMessageCount,
                tokenCount,
            };

    const existing = await prisma.summary.findFirst({
        where: { threadId: data.threadId },
        orderBy: { createdAt: "desc" },
    });

    if (!existing) {
        return createSummary(data);
    }

    let messageId = data.lastSummarizedMessageId;
    let messageCount = data.lastSummarizedMessageCount;

    if (!messageId || messageCount == null) {
        const lastMsg = await prisma.message.findFirst({
            where: { threadId: data.threadId },
            orderBy: { sequence: "desc" },
        });
        messageId = messageId || lastMsg?.messageId || existing.lastSummarizedMessageId;
        if (messageCount == null) {
            messageCount = await prisma.message.count({
                where: { threadId: data.threadId },
            });
        }
    }

    return prisma.summary.update({
        where: { summaryId: existing.summaryId },
        data: {
            summary: data.summary,
            lastSummarizedMessageId: messageId,
            lastSummarizedMessageCount: messageCount || 0,
            tokenCount: data.tokenCount || 0,
        },
    });
};

export const getSummaryByThreadId = async (threadId) => {
    return prisma.summary.findFirst({
        where: { threadId },
        orderBy: { createdAt: "desc" },
    });
};