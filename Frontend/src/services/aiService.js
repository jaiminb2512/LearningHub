import apiClient from './apiClient';
import { ENDPOINTS } from './apiEndpoints';

const readSseStream = async (response, onChunk, onEvent) => {
  if (!response.ok) {
    throw new Error('Streaming failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let isDone = false;
  let buffer = '';

  while (!isDone) {
    const { value, done } = await reader.read();
    isDone = done;
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine.startsWith('data: ')) continue;

      const dataStr = trimmedLine.replace('data: ', '').trim();
      if (dataStr === '[DONE]') {
        isDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.type === 'prompt' || parsed.type === 'interrupt') {
          if (typeof onEvent === 'function') onEvent(parsed);
          continue;
        }
        if (parsed.error) {
          if (typeof onEvent === 'function') onEvent({ type: 'error', error: parsed.error });
          continue;
        }
        if (parsed.content) {
          onChunk(parsed.content);
        }
      } catch (e) {
        console.warn('Error parsing SSE line:', trimmedLine);
      }
    }
  }
};

const aiService = {
  getProviders: async () => {
    const response = await apiClient.get(ENDPOINTS.AI.GET_PROVIDERS.path);
    return response.data;
  },

  generate: async (threadId, message) => {
    const response = await apiClient.post(ENDPOINTS.AI.GENERATE.path, { threadId, message });
    return response.data;
  },

  stream: async (threadId, message, onChunk, signal, onEvent) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${ENDPOINTS.AI.STREAM.baseUrl}${ENDPOINTS.AI.STREAM.path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ threadId, message }),
      signal,
    });

    await readSseStream(response, onChunk, onEvent);
  },

  resume: async (threadId, decision, onChunk, signal, onEvent) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${ENDPOINTS.AI.RESUME.baseUrl}${ENDPOINTS.AI.RESUME.path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ threadId, decision }),
      signal,
    });

    await readSseStream(response, onChunk, onEvent);
  },

  getThreadUsage: async (threadId) => {
    const response = await apiClient.get(ENDPOINTS.AI.GET_USAGE(threadId).path);
    return response.data;
  },
};

export default aiService;
