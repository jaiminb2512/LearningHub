import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { createBook, listBooks, getBook, updateBook } from "../services/bookService.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const internetSearchTool = new DuckDuckGoSearch({
    maxResults: 5,
});

internetSearchTool.name = "internet_search";
internetSearchTool.description = `
Search the internet for the latest information.
Use this tool whenever the user asks about:
- latest news
- current events
- recent announcements
- today's updates
- trending topics
- information after your knowledge cutoff

Never answer recent-news questions without using this tool first.
`;

export const createBookTool = (userId, threadId) => {
    return new DynamicStructuredTool({
        name: "create_book",

        description:
            "Create a new book in LearningHub.",

        schema: z.object({
            title: z.string().describe("Book title"),
            description: z
                .string()
                .optional()
                .describe("Book description"),
            summary: z
                .string()
                .optional()
                .describe("Book summary"),
        }),

        func: async ({ title, description, summary }) => {
            return await createBook({
                userId,
                title,
                description,
                summary,
                status: "ACTIVE",
                threadId,
                sourceType: "AI_CHAT",
            });
        },
    });
};

export const listBooksTool = (userId) => {
    return new DynamicStructuredTool({
        name: "list_books",
        description: "List all books for the user",
        schema: z.object({}),
        func: async () => {
            return await listBooks({ userId });
        },
    });
};

export const getBookTool = (userId) => {
    return new DynamicStructuredTool({
        name: "get_book",
        description: "Get a book by its ID",
        schema: z.object({ bookId: z.string() }),
        func: async ({ bookId }) => {
            return await getBook({ userId, bookId });
        },
    });
};

export const updateBookTool = (userId) => {
    return new DynamicStructuredTool({
        name: "update_book",
        description: "Update a book by its ID",
        schema: z.object({ bookId: z.string(), title: z.string(), description: z.string(), summary: z.string() }),
        func: async ({ bookId, title, description, summary }) => {
            return await updateBook({ userId, bookId, title, description, summary });
        },
    });
};
