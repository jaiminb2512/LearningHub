import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { createBook, listBooks, getBook, updateBook, softDeleteBook } from "../services/bookService.js";
import { createNote, listNotes, getNote, updateNote, softDeleteNote, reorderNotes } from "../services/noteService.js";
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

export const deleteBookTool = (userId) => {
    return new DynamicStructuredTool({
        name: "delete_book",
        description: "Delete a book by its ID",
        schema: z.object({ bookId: z.string() }),
        func: async ({ bookId }) => {
            return await softDeleteBook({ userId, bookId });
        },
    });
};

export const createNoteTool = (userId, bookId) => {
    return new DynamicStructuredTool({
        name: "create_note",
        description: "Create a new note in a book",
        schema: z.object({ title: z.string(), content: z.string() }),
        func: async ({ title, content }) => {
            return await createNote({ userId, bookId, title, content });
        },
    });
};

export const listNotesTool = (userId, bookId) => {
    return new DynamicStructuredTool({
        name: "list_notes",
        description: "List all notes in a book",
        schema: z.object({}),
        func: async () => {
            return await listNotes({ userId, bookId });
        },
    });
};

export const getNoteTool = (userId, noteId) => {
    return new DynamicStructuredTool({
        name: "get_note",
        description: "Get a note by its ID",
        schema: z.object({ noteId: z.string() }),
        func: async ({ noteId }) => {
            return await getNote({ userId, noteId });
        },
    });
};

export const updateNoteTool = (userId, noteId) => {
    return new DynamicStructuredTool({
        name: "update_note",
        description: "Update a note by its ID",
        schema: z.object({ noteId: z.string(), title: z.string(), content: z.string() }),
        func: async ({ noteId, title, content }) => {
            return await updateNote({ userId, noteId, title, content });
        },
    });
};

export const deleteNoteTool = (userId, noteId) => {
    return new DynamicStructuredTool({
        name: "delete_note",
        description: "Delete a note by its ID",
        schema: z.object({ noteId: z.string() }),
        func: async ({ noteId }) => {
            return await deleteNote({ userId, noteId });
        },
    });
};

export const reorderNotesTool = (userId, bookId) => {
    return new DynamicStructuredTool({
        name: "reorder_notes",
        description: "Reorder the notes in a book",
        schema: z.object({ items: z.array(z.object({ noteId: z.string(), orderIndex: z.number() })) }),
        func: async ({ items }) => {
            return await reorderNotes({ userId, bookId, items });
        },
    });
};
