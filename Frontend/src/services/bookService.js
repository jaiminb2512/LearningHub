import apiClient from './apiClient';
import { ENDPOINTS } from './apiEndpoints';

const bookService = {
  getAllBooks: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.BOOKS.GET_ALL.path, { params });
    return response.data;
  },

  getBookById: async (bookId) => {
    const response = await apiClient.get(ENDPOINTS.BOOKS.GET_ONE(bookId).path);
    return response.data;
  },

  createBook: async (data) => {
    const response = await apiClient.post(ENDPOINTS.BOOKS.CREATE.path, data);
    return response.data;
  },

  updateBook: async (bookId, data) => {
    const response = await apiClient.put(ENDPOINTS.BOOKS.UPDATE(bookId).path, data);
    return response.data;
  },

  deleteBook: async (bookId) => {
    const response = await apiClient.delete(ENDPOINTS.BOOKS.DELETE(bookId).path);
    return response.data;
  },
};

export default bookService;
