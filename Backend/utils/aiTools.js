import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { createBook, listBooks, getBook, updateBook, softDeleteBook } from "../services/bookService.js";
import { createNote, listNotes, getNote, updateNote, softDeleteNote, reorderNotes } from "../services/noteService.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import {
  requestConfirmation,
  requestSelective,
  requestSuggestive,
  resolveSelectedIds,
  resolveSuggestion,
  rejectedToolResult,
  gateHitlDecision,
} from "./hitl.js";

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
      "Create a new book in LearningHub. Requires human review of the suggested title/description/summary.",
    schema: z.object({
      title: z.string().describe("Book title"),
      description: z.string().optional().describe("Book description"),
      summary: z.string().optional().describe("Book summary"),
    }),
    func: async ({ title, description, summary }) => {
      const proposed = {
        title: title || "",
        description: description || "",
        summary: summary || "",
      };

      const decision = requestSuggestive({
        action: "create_book",
        toolName: "create_book",
        message: "Review the book details. You can edit them or add your own values before creating.",
        suggestion: proposed,
        fields: [
          { key: "title", label: "Title", type: "text", required: true },
          { key: "description", label: "Description", type: "textarea" },
          { key: "summary", label: "Summary", type: "textarea" },
        ],
        entityType: "book",
      });

      const gated = gateHitlDecision(
        decision,
        "create_book",
        "Book creation cancelled by user."
      );
      if (gated) return gated;

      const finalValues = resolveSuggestion(decision, proposed);
      if (!finalValues?.title?.trim()) {
        return rejectedToolResult("create_book", "Title is required.");
      }

      const result = await createBook({
        userId,
        title: finalValues.title,
        description: finalValues.description,
        summary: finalValues.summary,
        status: "ACTIVE",
        threadId,
        sourceType: "AI_CHAT",
      });

      return { success: true, result };
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
    description:
      "Update a book by its ID. Requires human review of suggested field values.",
    schema: z.object({
      bookId: z.string(),
      title: z.string(),
      description: z.string(),
      summary: z.string(),
    }),
    func: async ({ bookId, title, description, summary }) => {
      const proposed = {
        title: title || "",
        description: description || "",
        summary: summary || "",
      };

      const decision = requestSuggestive({
        action: "update_book",
        toolName: "update_book",
        message: "Review the suggested book updates. Edit fields or provide your own values.",
        suggestion: proposed,
        fields: [
          { key: "title", label: "Title", type: "text", required: true },
          { key: "description", label: "Description", type: "textarea" },
          { key: "summary", label: "Summary", type: "textarea" },
        ],
        data: { bookId },
        entityType: "book",
        entityId: bookId,
      });

      const gated = gateHitlDecision(
        decision,
        "update_book",
        "Book update cancelled by user."
      );
      if (gated) return gated;

      const finalValues = resolveSuggestion(decision, proposed);
      const result = await updateBook({
        userId,
        bookId,
        title: finalValues.title,
        description: finalValues.description,
        summary: finalValues.summary,
      });

      return { success: true, result };
    },
  });
};

export const deleteBookTool = (userId) => {
  return new DynamicStructuredTool({
    name: "delete_book",
    description: "Delete a book by its ID. This action requires user confirmation.",
    schema: z.object({ bookId: z.string() }),
    func: async ({ bookId }) => {
      let bookLabel = bookId;
      try {
        const book = await getBook({ userId, bookId });
        bookLabel = book?.title || bookId;
      } catch {
        // keep id label
      }

      const decision = requestConfirmation({
        action: "delete_book",
        toolName: "delete_book",
        message: `Are you sure you want to delete "${bookLabel}"?`,
        data: { bookId, title: bookLabel },
        entityType: "book",
        entityId: bookId,
      });

      const gated = gateHitlDecision(
        decision,
        "delete_book",
        "Book deletion cancelled by user."
      );
      if (gated) return gated;

      const result = await softDeleteBook({ userId, bookId });
      return { success: true, result };
    },
  });
};

export const createNoteTool = (userId) => {
  return new DynamicStructuredTool({
    name: "create_note",
    description:
      "Create a new note in a book. User must select which book to place the note in.",
    schema: z.object({
      bookId: z.string().describe("Suggested book ID"),
      title: z.string(),
      content: z.string(),
    }),
    func: async ({ bookId, title, content }) => {
      const booksResult = await listBooks({ userId, limit: 100 });
      const books = Array.isArray(booksResult)
        ? booksResult
        : booksResult?.books || [];

      const options = books.map((book) => ({
        id: book.bookId,
        label: book.title,
        description: book.description || (book.isDefault ? "Default inbox" : ""),
      }));

      if (!options.length) {
        return rejectedToolResult("create_note", "No books available to attach this note.");
      }

      const decision = requestSelective({
        action: "create_note",
        toolName: "create_note",
        message: "Select which book should receive this note.",
        options,
        allowMultiple: false,
        defaultSelected: bookId ? [bookId] : options[0] ? [options[0].id] : [],
        data: { title, content, suggestedBookId: bookId },
        entityType: "note",
      });

      const gated = gateHitlDecision(
        decision,
        "create_note",
        "Note creation cancelled by user."
      );
      if (gated) return gated;

      const selected = resolveSelectedIds(decision, {
        defaultSelected: bookId ? [bookId] : [],
        allowMultiple: false,
      });
      const selectedBookId = selected[0];
      if (!selectedBookId) {
        return rejectedToolResult("create_note", "No book selected.");
      }

      const result = await createNote({
        userId,
        bookId: selectedBookId,
        title,
        content,
      });

      return { success: true, result };
    },
  });
};

export const listNotesTool = (userId) => {
  return new DynamicStructuredTool({
    name: "list_notes",
    description: "List all notes in a book.",
    schema: z.object({ bookId: z.string().describe("The ID of the book") }),
    func: async ({ bookId }) => {
      return await listNotes({ userId, bookId });
    },
  });
};

export const getNoteTool = (userId) => {
  return new DynamicStructuredTool({
    name: "get_note",
    description: "Get a note by its ID",
    schema: z.object({ noteId: z.string() }),
    func: async ({ noteId }) => {
      return await getNote({ userId, noteId });
    },
  });
};

export const updateNoteTool = (userId) => {
  return new DynamicStructuredTool({
    name: "update_note",
    description:
      "Update a note by its ID. Requires human review of suggested title/content.",
    schema: z.object({
      noteId: z.string(),
      title: z.string(),
      content: z.string().optional(),
    }),
    func: async ({ noteId, title, content }) => {
      const proposed = {
        title: title || "",
        content: content || "",
      };

      const decision = requestSuggestive({
        action: "update_note",
        toolName: "update_note",
        message: "Review the suggested note updates. Edit or write your own values.",
        suggestion: proposed,
        fields: [
          { key: "title", label: "Title", type: "text", required: true },
          { key: "content", label: "Content", type: "textarea" },
        ],
        data: { noteId },
        entityType: "note",
        entityId: noteId,
      });

      const gated = gateHitlDecision(
        decision,
        "update_note",
        "Note update cancelled by user."
      );
      if (gated) return gated;

      const finalValues = resolveSuggestion(decision, proposed);
      const result = await updateNote({
        userId,
        noteId,
        title: finalValues.title,
        content: finalValues.content,
      });

      return { success: true, result };
    },
  });
};

export const deleteNoteTool = (userId) => {
  return new DynamicStructuredTool({
    name: "delete_note",
    description: "Delete a note by its ID. Requires user confirmation.",
    schema: z.object({ noteId: z.string() }),
    func: async ({ noteId }) => {
      let noteLabel = noteId;
      try {
        const note = await getNote({ userId, noteId });
        noteLabel = note?.title || noteId;
      } catch {
        // keep id label
      }

      const decision = requestConfirmation({
        action: "delete_note",
        toolName: "delete_note",
        message: `Are you sure you want to delete note "${noteLabel}"?`,
        data: { noteId, title: noteLabel },
        entityType: "note",
        entityId: noteId,
      });

      const gated = gateHitlDecision(
        decision,
        "delete_note",
        "Note deletion cancelled by user."
      );
      if (gated) return gated;

      const result = await softDeleteNote({ userId, noteId });
      return { success: true, result };
    },
  });
};

export const reorderNotesTool = (userId) => {
  return new DynamicStructuredTool({
    name: "reorder_notes",
    description: "Reorder the notes in a book",
    schema: z.object({
      bookId: z.string().describe("The ID of the book"),
      items: z.array(
        z.object({ noteId: z.string(), orderIndex: z.number() })
      ),
    }),
    func: async ({ bookId, items }) => {
      return await reorderNotes({ userId, bookId, items });
    },
  });
};
