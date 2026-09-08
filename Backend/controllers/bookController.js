import sendResponse from "../utils/response.js";
import {
  BookServiceError,
  createBook,
  getBook,
  listBooks,
  softDeleteBook,
  updateBook,
} from "../services/bookService.js";

const handleError = (res, error, fallbackMessage) => {
  if (error instanceof BookServiceError) {
    return sendResponse(res, error.statusCode, error.message);
  }
  console.error(fallbackMessage, error);
  return sendResponse(res, 500, fallbackMessage, { error: error.message });
};

export const createBookHandler = async (req, res) => {
  try {
    const { title, description, summary, status, threadId, sourceType } = req.body;
    const book = await createBook({
      userId: req.user.userId,
      title,
      description,
      summary,
      status,
      threadId,
      sourceType,
    });
    return sendResponse(res, 201, "Book created successfully", book);
  } catch (error) {
    return handleError(res, error, "Failed to create book");
  }
};

export const getAllBooksHandler = async (req, res) => {
  try {
    const { page, limit, q, status } = req.query;
    const data = await listBooks({
      userId: req.user.userId,
      page,
      limit,
      q,
      status: status || "ACTIVE",
    });
    return sendResponse(res, 200, "Books fetched successfully", data);
  } catch (error) {
    return handleError(res, error, "Failed to fetch books");
  }
};

export const getBookByIdHandler = async (req, res) => {
  try {
    const book = await getBook({
      userId: req.user.userId,
      bookId: req.params.bookId,
    });
    return sendResponse(res, 200, "Book fetched successfully", book);
  } catch (error) {
    return handleError(res, error, "Failed to fetch book");
  }
};

export const updateBookHandler = async (req, res) => {
  try {
    const { title, description, status, summary, sourceType, threadId } = req.body;
    const book = await updateBook({
      userId: req.user.userId,
      bookId: req.params.bookId,
      title,
      description,
      status,
      summary,
      sourceType,
      threadId,
    });
    return sendResponse(res, 200, "Book updated successfully", book);
  } catch (error) {
    return handleError(res, error, "Failed to update book");
  }
};

export const deleteBookHandler = async (req, res) => {
  try {
    const result = await softDeleteBook({
      userId: req.user.userId,
      bookId: req.params.bookId,
    });
    return sendResponse(res, 200, "Book deleted successfully", result);
  } catch (error) {
    return handleError(res, error, "Failed to delete book");
  }
};
