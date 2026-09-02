import sendResponse from "../utils/response.js";
import prisma from "../dbConnect/prismaClient.js";

export const createSystemPrompt = async (req, res) => {
    try {

        const { name, prompt } = req.body;
        const user = req.user;

        if (!name) {
            return sendResponse(res, 400, 'Name is required')
        }

        if (!prompt) {
            return sendResponse(res, 400, 'Prompt is required')
        }

        const response = await prisma.systemPrompt.create({
            data: {
                name,
                prompt,
                createdBy: user.userId
            }
        })

        return sendResponse(res, 200, 'System prompt created successfully', response)

    } catch (error) {
        return sendResponse(res, 500, "Failed to create system prompt", { error: error.message });
    }
}


export const getSystemPrompt = async (req, res) => {
    try {
        let { page = 1, pageSize = 10 } = req.query;

        page = parseInt(page);
        pageSize = parseInt(pageSize);

        if (isNaN(page) || page < 1) {
            page = 1
        }
        if (isNaN(pageSize) || pageSize < 1) {
            pageSize = 10
        }

        const prompts = await prisma.systemPrompt.findMany({
            where: { isDeleted: false },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: {
                createdAt: 'desc'
            }
        })

        const total = await prisma.systemPrompt.count({ where: { isDeleted: false } })
        const totalPages = Math.ceil(total / pageSize)

        const response = {
            prompts,
            totalPages,
            total,
            page,
            pageSize
        }
        return sendResponse(res, 200, 'System prompts fetched successfully', response)
    } catch (error) {
        return sendResponse(res, 500, "Failed to fetch system prompts", { error: error.message });
    }
}

export const updateSystemPrompt = async (req, res) => {
    try {

        const { name, prompt } = req.body;
        const user = req.user;

        if (!name) {
            return sendResponse(res, 400, 'Name is required')
        }

        if (!prompt) {
            return sendResponse(res, 400, 'Prompt is required')
        }

        const response = await prisma.systemPrompt.update({
            where: {
                systemPromptId: req.params.id
            },
            data: {
                name,
                prompt,
                updatedBy: user.userId
            }
        })

        return sendResponse(res, 200, 'System prompt updated successfully', response)

    } catch (error) {
        return sendResponse(res, 500, "Failed to update system prompt", { error: error.message });
    }
}

export const deleteSystemPrompt = async (req, res) => {
    try {

        const { softDelete } = req.query;

        let response;
        if (softDelete) {
            response = await prisma.systemPrompt.update({
                where: {
                    systemPromptId: req.params.id
                },
                data: {
                    isDeleted: true
                }
            })
        } else {
            response = await prisma.systemPrompt.delete({
                where: {
                    systemPromptId: req.params.id
                }
            })
        }

        return sendResponse(res, 200, 'System prompt deleted successfully', response)

    } catch (error) {
        return sendResponse(res, 500, "Failed to delete system prompt", { error: error.message });
    }
}