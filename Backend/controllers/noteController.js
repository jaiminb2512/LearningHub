import sendResponse from "../utils/response.js";
import { BookServiceError } from "../services/bookService.js";
import {
  NoteServiceError,
  createNote,
  getNote,
  listNotes,
  reorderNotes,
  softDeleteNote,
  updateNote,
} from "../services/noteService.js";

const handleError = (res, error, fallbackMessage) => {
  if (error instanceof NoteServiceError || error instanceof BookServiceError) {
    return sendResponse(res, error.statusCode, error.message);
  }
  console.error(fallbackMessage, error);
  return sendResponse(res, 500, fallbackMessage, { error: error.message });
};

export const createNoteHandler = async (req, res) => {
  try {
    const { title, content, format, status, summary, section, orderIndex, threadId } =
      req.body;
    const note = await createNote({
      userId: req.user.userId,
      bookId: req.params.bookId,
      title,
      content,
      format,
      status,
      summary,
      section,
      orderIndex,
      threadId,
    });
    return sendResponse(res, 201, "Note created successfully", note);
  } catch (error) {
    return handleError(res, error, "Failed to create note");
  }
};

export const getNotesByBookHandler = async (req, res) => {
  try {
    const { page, limit, q, section, status } = req.query;
    const data = await listNotes({
      userId: req.user.userId,
      bookId: req.params.bookId,
      page,
      limit,
      q,
      section,
      status: status || "ACTIVE",
    });
    return sendResponse(res, 200, "Notes fetched successfully", data);
  } catch (error) {
    return handleError(res, error, "Failed to fetch notes");
  }
};

export const getNoteByIdHandler = async (req, res) => {
  try {
    const note = await getNote({
      userId: req.user.userId,
      noteId: req.params.noteId,
      bookId: req.params.bookId,
    });
    return sendResponse(res, 200, "Note fetched successfully", note);
  } catch (error) {
    return handleError(res, error, "Failed to fetch note");
  }
};

export const getNoteByIdGlobalHandler = async (req, res) => {
  try {
    const note = await getNote({
      userId: req.user.userId,
      noteId: req.params.noteId,
    });
    return sendResponse(res, 200, "Note fetched successfully", note);
  } catch (error) {
    return handleError(res, error, "Failed to fetch note");
  }
};

export const updateNoteHandler = async (req, res) => {
  try {
    const { title, content, format, status, summary, section, orderIndex } = req.body;
    const note = await updateNote({
      userId: req.user.userId,
      noteId: req.params.noteId,
      bookId: req.params.bookId,
      title,
      content,
      format,
      status,
      summary,
      section,
      orderIndex,
    });
    return sendResponse(res, 200, "Note updated successfully", note);
  } catch (error) {
    return handleError(res, error, "Failed to update note");
  }
};

export const deleteNoteHandler = async (req, res) => {
  try {
    const result = await softDeleteNote({
      userId: req.user.userId,
      noteId: req.params.noteId,
      bookId: req.params.bookId,
    });
    return sendResponse(res, 200, "Note deleted successfully", result);
  } catch (error) {
    return handleError(res, error, "Failed to delete note");
  }
};

export const reorderNotesHandler = async (req, res) => {
  try {
    const { items } = req.body;
    const data = await reorderNotes({
      userId: req.user.userId,
      bookId: req.params.bookId,
      items,
    });
    return sendResponse(res, 200, "Notes reordered successfully", data);
  } catch (error) {
    return handleError(res, error, "Failed to reorder notes");
  }
};
