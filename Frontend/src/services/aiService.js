import apiClient from './apiClient';
import { ENDPOINTS } from './apiEndpoints';

const aiService = {
  /**
   * Get AI providers and their models
   */
  getProviders: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.AI.GET_PROVIDERS.path);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Generate AI response
   */
  generate: async (threadId, message) => {
    try {
      const response = await apiClient.post(ENDPOINTS.AI.GENERATE.path, { threadId, message });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Stream AI response
   */
  stream: async (threadId, message, onChunk, signal) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${ENDPOINTS.AI.STREAM.baseUrl}${ENDPOINTS.AI.STREAM.path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ threadId, message }),
        signal: signal
      });


      if (!response.ok) {
        throw new Error('Streaming failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let isDone = false;
      let buffer = "";

      while (!isDone) {
        const { value, done } = await reader.read();
        isDone = done;
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last partial line in the buffer
        buffer = lines.pop();

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data: ')) {
            const dataStr = trimmedLine.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              isDone = true;
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch (e) {
              // Ignore parse errors for incomplete JSON or [DONE]
              console.warn("Error parsing SSE line:", trimmedLine);
            }
          }
        }
      }
    } catch (error) {

      throw error;
    }
  },

  /**
   * Get total token usage for a thread
   */
  getThreadUsage: async (threadId) => {
    try {
      const response = await apiClient.get(ENDPOINTS.AI.GET_USAGE(threadId).path);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};


export default aiService;
