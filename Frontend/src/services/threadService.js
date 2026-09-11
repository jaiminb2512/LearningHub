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
   * Get message turn details (user input, AI prompt, output, settings)
   * @param {string} threadId
   * @param {string} messageId
   */
  getMessageDetails: async (threadId, messageId) => {
    try {
      const endpoint = ENDPOINTS.THREADS.GET_MESSAGE_DETAILS(threadId, messageId);
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
   * Update a chat thread (e.g. switch AI settings at runtime)
   * @param {string} id
   * @param {Object} data
   */
  updateThread: async (id, data) => {
    try {
      const endpoint = ENDPOINTS.THREADS.UPDATE(id);
      const response = await apiClient.patch(endpoint.path, data);
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
