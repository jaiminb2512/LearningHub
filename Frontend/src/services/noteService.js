import apiClient from './apiClient';
import { ENDPOINTS } from './apiEndpoints';

const noteService = {
  getNotesByBook: async (bookId, params = {}) => {
    const response = await apiClient.get(ENDPOINTS.BOOKS.NOTES.GET_ALL(bookId).path, {
      params,
    });
    return response.data;
  },

  getNoteById: async (bookId, noteId) => {
    const response = await apiClient.get(
      ENDPOINTS.BOOKS.NOTES.GET_ONE(bookId, noteId).path
    );
    return response.data;
  },

  getNoteByIdGlobal: async (noteId) => {
    const response = await apiClient.get(ENDPOINTS.NOTES.GET_ONE(noteId).path);
    return response.data;
  },

  createNote: async (bookId, data) => {
    const response = await apiClient.post(
      ENDPOINTS.BOOKS.NOTES.CREATE(bookId).path,
      data
    );
    return response.data;
  },

  updateNote: async (bookId, noteId, data) => {
    const response = await apiClient.put(
      ENDPOINTS.BOOKS.NOTES.UPDATE(bookId, noteId).path,
      data
    );
    return response.data;
  },

  deleteNote: async (bookId, noteId) => {
    const response = await apiClient.delete(
      ENDPOINTS.BOOKS.NOTES.DELETE(bookId, noteId).path
    );
    return response.data;
  },

  reorderNotes: async (bookId, items) => {
    const response = await apiClient.put(
      ENDPOINTS.BOOKS.NOTES.REORDER(bookId).path,
      { items }
    );
    return response.data;
  },
};

export default noteService;
