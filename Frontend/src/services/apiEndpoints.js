const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ENDPOINTS = {
    LOGIN: {
        path: '/users/login',
        method: 'POST',
        baseUrl: API_BASE_URL,
    },
    REGISTER: {
        path: '/users/register',
        method: 'POST',
        baseUrl: API_BASE_URL,
    },
    LOGOUT: {
        path: '/users/logout',
        method: 'POST',
        baseUrl: API_BASE_URL,
    },
    ME: {
        path: '/users/me',
        method: 'GET',
        baseUrl: API_BASE_URL,
    },
    THREADS: {
        GET_ALL: {
            path: '/threads',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        GET_ONE: (id) => ({
            path: `/threads/${id}`,
            method: 'GET',
            baseUrl: API_BASE_URL,
        }),
        CREATE: {
            path: '/threads',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        UPDATE: (id) => ({
            path: `/threads/${id}`,
            method: 'PATCH',
            baseUrl: API_BASE_URL,
        }),
        DELETE: (id) => ({
            path: `/threads/${id}`,
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        })
    },
    AI: {
        GET_PROVIDERS: {
            path: '/ai/providers',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        GENERATE: {
            path: '/ai/generate',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        STREAM: {
            path: '/ai/stream',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        GET_USAGE: (id) => ({
            path: `/ai/thread/${id}/usage`,
            method: 'GET',
            baseUrl: API_BASE_URL,
        })
    },
    SYSTEM_PROMPTS: {
        GET_ALL: {
            path: '/system-prompts',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        CREATE: {
            path: '/system-prompts',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        UPDATE: (id) => ({
            path: `/system-prompts/${id}`,
            method: 'PUT',
            baseUrl: API_BASE_URL,
        }),
        DELETE: (id) => ({
            path: `/system-prompts/${id}`,
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        })
    },
    AI_SETTINGS: {
        GET_ALL: {
            path: '/ai-settings',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        CREATE: {
            path: '/ai-settings',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        GET_ONE: (id) => ({
            path: `/ai-settings/${id}`,
            method: 'GET',
            baseUrl: API_BASE_URL,
        }),
        UPDATE: (id) => ({
            path: `/ai-settings/${id}`,
            method: 'PUT',
            baseUrl: API_BASE_URL,
        }),
        DELETE: (id) => ({
            path: `/ai-settings/${id}`,
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        }),
    },
    BOOKS: {
        GET_ALL: {
            path: '/books',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        CREATE: {
            path: '/books',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        GET_ONE: (bookId) => ({
            path: `/books/${bookId}`,
            method: 'GET',
            baseUrl: API_BASE_URL,
        }),
        UPDATE: (bookId) => ({
            path: `/books/${bookId}`,
            method: 'PUT',
            baseUrl: API_BASE_URL,
        }),
        DELETE: (bookId) => ({
            path: `/books/${bookId}`,
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        }),
        NOTES: {
            GET_ALL: (bookId) => ({
                path: `/books/${bookId}/notes`,
                method: 'GET',
                baseUrl: API_BASE_URL,
            }),
            CREATE: (bookId) => ({
                path: `/books/${bookId}/notes`,
                method: 'POST',
                baseUrl: API_BASE_URL,
            }),
            GET_ONE: (bookId, noteId) => ({
                path: `/books/${bookId}/notes/${noteId}`,
                method: 'GET',
                baseUrl: API_BASE_URL,
            }),
            UPDATE: (bookId, noteId) => ({
                path: `/books/${bookId}/notes/${noteId}`,
                method: 'PUT',
                baseUrl: API_BASE_URL,
            }),
            DELETE: (bookId, noteId) => ({
                path: `/books/${bookId}/notes/${noteId}`,
                method: 'DELETE',
                baseUrl: API_BASE_URL,
            }),
            REORDER: (bookId) => ({
                path: `/books/${bookId}/notes/reorder`,
                method: 'PUT',
                baseUrl: API_BASE_URL,
            }),
        },
    },

    NOTES: {
        GET_ONE: (noteId) => ({
            path: `/notes/${noteId}`,
            method: 'GET',
            baseUrl: API_BASE_URL,
        }),
    },
};

export { API_BASE_URL };
export default API_BASE_URL;