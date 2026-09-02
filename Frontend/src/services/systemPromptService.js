import apiClient from "./apiClient";
import { ENDPOINTS } from "./apiEndpoints";

export const systemPromptService = {
    getAll: async (params = {}) => {
        const response = await apiClient.get(ENDPOINTS.SYSTEM_PROMPTS.GET_ALL.path, { params });
        return response.data;
    },
    create: async (data) => {
        const response = await apiClient.post(ENDPOINTS.SYSTEM_PROMPTS.CREATE.path, data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await apiClient.put(ENDPOINTS.SYSTEM_PROMPTS.UPDATE(id).path, data);
        return response.data;
    },
    delete: async (id, options = {}) => {
        const response = await apiClient.delete(ENDPOINTS.SYSTEM_PROMPTS.DELETE(id).path, {
            params: options.softDelete ? { softDelete: true } : undefined,
        });
        return response.data;
    }
};
