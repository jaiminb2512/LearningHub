import apiClient from './apiClient';
import { ENDPOINTS } from './apiEndpoints';

const knowledgeService = {
  upload: async (file, threadId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (threadId) {
      formData.append('threadId', threadId);
    }

    const response = await apiClient.post(
      ENDPOINTS.KNOWLEDGE.UPLOAD.path,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: [
          (data, headers) => {
            // Let the browser set multipart boundary
            if (headers && typeof headers.delete === 'function') {
              headers.delete('Content-Type');
            } else if (headers) {
              delete headers['Content-Type'];
            }
            return data;
          },
        ],
      }
    );
    return response.data;
  },

  getLibrary: async () => {
    const response = await apiClient.get(ENDPOINTS.KNOWLEDGE.GET_LIBRARY.path);
    return response.data;
  },

  getThreadKnowledge: async (threadId) => {
    const endpoint = ENDPOINTS.KNOWLEDGE.GET_THREAD(threadId);
    const response = await apiClient.get(endpoint.path);
    return response.data;
  },

  attachToThread: async (threadId, knowledgeSourceId) => {
    const endpoint = ENDPOINTS.KNOWLEDGE.ATTACH(threadId, knowledgeSourceId);
    const response = await apiClient.post(endpoint.path);
    return response.data;
  },

  detachFromThread: async (threadId, knowledgeSourceId) => {
    const endpoint = ENDPOINTS.KNOWLEDGE.DETACH(threadId, knowledgeSourceId);
    const response = await apiClient.delete(endpoint.path);
    return response.data;
  },

  deleteSource: async (knowledgeSourceId) => {
    const endpoint = ENDPOINTS.KNOWLEDGE.DELETE(knowledgeSourceId);
    const response = await apiClient.delete(endpoint.path);
    return response.data;
  },

  generateEmbeddings: async (knowledgeSourceId) => {
    const endpoint = ENDPOINTS.KNOWLEDGE.GENERATE_EMBEDDINGS(knowledgeSourceId);
    const response = await apiClient.post(endpoint.path);
    return response.data;
  },
};

export default knowledgeService;
