import dotenv from "dotenv";
dotenv.config();

import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

import {
  createBook,
  listBooks,
  getBook,
  updateBook,
  softDeleteBook,
} from "../services/bookService.js";

import {
  createNote,
  listNotes,
  getNote,
  updateNote,
  softDeleteNote,
  reorderNotes,
} from "../services/noteService.js";

// Hardcoded user for MCP access
const USER_ID = "f5ede6f4-03ae-4f71-bc0d-f721df2c8e1e";

serveStdio(() => {
  const server = new McpServer({ name: "learninghub", version: "1.0.0" });

  server.registerTool(
    "list_books",
    {
      description: "List all books for the user.",
      schema: z.object({}),
    },
    async () => {
      return await listBooks({ userId: USER_ID });
    }
  );

  server.registerTool(
    "get_book",
    {
      description: "Get a book by its ID.",
      schema: z.object({
        bookId: z.string().describe("The ID of the book"),
      }),
    },
    async ({ bookId }) => {
      return await getBook({ userId: USER_ID, bookId });
    }
  );

  server.registerTool(
    "create_book",
    {
      description: "Create a new book in LearningHub.",
      schema: z.object({
        title: z.string().describe("Book title"),
        description: z.string().optional().describe("Book description"),
        summary: z.string().optional().describe("Book summary"),
      }),
    },
    async ({ title, description, summary }) => {
      return await createBook({
        userId: USER_ID,
        title,
        description,
        summary,
        status: "ACTIVE",
        sourceType: "AI_CHAT",
      });
    }
  );

  server.registerTool(
    "update_book",
    {
      description: "Update a book by its ID.",
      schema: z.object({
        bookId: z.string().describe("The ID of the book to update"),
        title: z.string().optional().describe("New book title"),
        description: z.string().optional().describe("New book description"),
        summary: z.string().optional().describe("New book summary"),
      }),
    },
    async ({ bookId, title, description, summary }) => {
      return await updateBook({ userId: USER_ID, bookId, title, description, summary });
    }
  );

  server.registerTool(
    "delete_book",
    {
      description: "Soft-delete a book by its ID.",
      schema: z.object({
        bookId: z.string().describe("The ID of the book to delete"),
      }),
    },
    async ({ bookId }) => {
      return await softDeleteBook({ userId: USER_ID, bookId });
    }
  );

  server.registerTool(
    "list_notes",
    {
      description: "List all notes in a book.",
      schema: z.object({
        bookId: z.string().describe("The ID of the book"),
      }),
    },
    async ({ bookId }) => {
      return await listNotes({ userId: USER_ID, bookId });
    }
  );

  server.registerTool(
    "get_note",
    {
      description: "Get a note by its ID.",
      schema: z.object({
        noteId: z.string().describe("The ID of the note"),
      }),
    },
    async ({ noteId }) => {
      return await getNote({ userId: USER_ID, noteId });
    }
  );

  server.registerTool(
    "create_note",
    {
      description: "Create a new note in a book.",
      schema: z.object({
        bookId: z.string().describe("The ID of the book to add the note to"),
        title: z.string().describe("Note title"),
        content: z.string().optional().describe("Note content"),
      }),
    },
    async ({ bookId, title, content }) => {
      return await createNote({ userId: USER_ID, bookId, title, content });
    }
  );

  server.registerTool(
    "update_note",
    {
      description: "Update a note by its ID.",
      schema: z.object({
        noteId: z.string().describe("The ID of the note to update"),
        title: z.string().optional().describe("New note title"),
        content: z.string().optional().describe("New note content"),
      }),
    },
    async ({ noteId, title, content }) => {
      return await updateNote({ userId: USER_ID, noteId, title, content });
    }
  );

  server.registerTool(
    "delete_note",
    {
      description: "Soft-delete a note by its ID.",
      schema: z.object({
        noteId: z.string().describe("The ID of the note to delete"),
      }),
    },
    async ({ noteId }) => {
      return await softDeleteNote({ userId: USER_ID, noteId });
    }
  );

  server.registerTool(
    "reorder_notes",
    {
      description: "Reorder the notes in a book.",
      schema: z.object({
        bookId: z.string().describe("The ID of the book"),
        items: z
          .array(
            z.object({
              noteId: z.string(),
              orderIndex: z.number(),
            })
          )
          .describe("Array of noteId + new orderIndex pairs"),
      }),
    },
    async ({ bookId, items }) => {
      return await reorderNotes({ userId: USER_ID, bookId, items });
    }
  );

  return server;
});
