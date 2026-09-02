import apiClient from './apiClient';
import { ENDPOINTS } from './apiEndpoints';

const threadService = {
  /**
   * Get all chat threads with pagination
   * @param {number} page 
   * @param {number} limit 
   */
  getAllThreads: async (page = 1, limit = 10) => {
    try {
      const response = await apiClient.get(
        `${ENDPOINTS.THREADS.GET_ALL.path}?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get a single thread by ID
   * @param {string} id 
   */
  getThreadById: async (id) => {
    try {
      const endpoint = ENDPOINTS.THREADS.GET_ONE(id);
      const response = await apiClient.get(endpoint.path);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new chat thread
   * @param {Object} threadData { title, model, provider }
   */
  createThread: async (threadData) => {
    try {
      const response = await apiClient.post(
        ENDPOINTS.THREADS.CREATE.path,
        threadData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a chat thread
   * @param {string} id 
   */
  deleteThread: async (id) => {
    try {
      const endpoint = ENDPOINTS.THREADS.DELETE(id);
      const response = await apiClient.delete(endpoint.path);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default threadService;
