import prisma from "../dbConnect/prismaClient.js";
import sendResponse from "../utils/response.js";

export const createThread = async (req, res) => {
  try {
    const { title, systemPromptId, systemPrompt } = req.body;
    const userId = req.user.userId;

    if (!title) {
      return sendResponse(res, 400, "Title is required");
    }

    let resolvedPromptId = systemPromptId || null;

    // Create a new system prompt inline when creating a chat
    if (!resolvedPromptId && systemPrompt?.name && systemPrompt?.prompt) {
      const created = await prisma.systemPrompt.create({
        data: {
          name: systemPrompt.name.trim(),
          prompt: systemPrompt.prompt.trim(),
          createdBy: userId,
        },
      });
      resolvedPromptId = created.systemPromptId;
    }

    if (!resolvedPromptId) {
      return sendResponse(res, 400, "Select an existing system prompt or create a new one");
    }

    const existingPrompt = await prisma.systemPrompt.findUnique({
      where: { systemPromptId: resolvedPromptId },
    });

    if (!existingPrompt) {
      return sendResponse(res, 400, "System prompt not found");
    }

    const thread = await prisma.thread.create({
      data: {
        title,
        userId,
        systemPromptId: resolvedPromptId,
      },
      include: {
        systemPrompt: {
          select: {
            systemPromptId: true,
            name: true,
            prompt: true,
          },
        },
      },
    });

    return sendResponse(res, 201, "Thread created successfully", thread);
  } catch (error) {
    console.error("createThread error:", error);
    return sendResponse(res, 500, "Failed to create thread", { error: error.message });
  }
};

/**
 * @desc    Get all threads for current user with pagination
 * @route   GET /api/threads
 * @access  Private
 */
export const getAllThreads = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        include: {
          systemPrompt: {
            select: {
              systemPromptId: true,
              name: true,
            },
          },
          _count: {
            select: { messages: true }
          }
        }
      }),
      prisma.thread.count({ where: { userId } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendResponse(res, 200, "Threads fetched successfully", {
      threads,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("getAllThreads error:", error);
    return sendResponse(res, 500, "Failed to fetch threads", { error: error.message });
  }
};

/**
 * @desc    Get a single thread with its messages
 * @route   GET /api/threads/:threadId
 * @access  Private
 */
export const getThreadById = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.userId;

    const thread = await prisma.thread.findFirst({
      where: {
        threadId,
        userId,
      },
      include: {
        systemPrompt: {
          select: {
            systemPromptId: true,
            name: true,
            prompt: true,
          },
        },
        messages: {
          orderBy: { sequence: "desc" },
          take: 10,
        },
      },
    });

    if (thread && thread.messages) {
      thread.messages.reverse();
    }

    if (!thread) {
      return sendResponse(res, 404, "Thread not found");
    }

    return sendResponse(res, 200, "Thread fetched successfully", thread);
  } catch (error) {
    console.error("getThreadById error:", error);
    return sendResponse(res, 500, "Failed to fetch thread", { error: error.message });
  }
};

/**
 * @desc    Delete a thread
 * @route   DELETE /api/threads/:threadId
 * @access  Private
 */
export const deleteThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.userId;

    const thread = await prisma.thread.findFirst({
      where: {
        threadId,
        userId,
      },
    });

    if (!thread) {
      return sendResponse(res, 404, "Thread not found or unauthorized");
    }

    await prisma.thread.delete({
      where: { threadId },
    });

    return sendResponse(res, 200, "Thread deleted successfully");
  } catch (error) {
    console.error("deleteThread error:", error);
    return sendResponse(res, 500, "Failed to delete thread", { error: error.message });
  }
};
