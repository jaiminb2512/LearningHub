import apiClient from './apiClient';
import { ENDPOINTS } from './apiEndpoints';

export const DEFAULT_AI_SETTINGS_FORM = {
  temperature: 0.7,
  maxOutputTokens: 2048,
  ragEnabled: true,
  model: 'gemini-3.1-flash-lite-preview',
  provider: 'google',
};

const aiSettingService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get(ENDPOINTS.AI_SETTINGS.GET_ALL.path, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(ENDPOINTS.AI_SETTINGS.GET_ONE(id).path);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post(ENDPOINTS.AI_SETTINGS.CREATE.path, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(ENDPOINTS.AI_SETTINGS.UPDATE(id).path, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(ENDPOINTS.AI_SETTINGS.DELETE(id).path);
    return response.data;
  },
};

export default aiSettingService;
