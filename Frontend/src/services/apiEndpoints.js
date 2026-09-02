const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ENDPOINTS = {
    // Auth
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

    // Get current user
    ME: {
        path: '/users/me',
        method: 'GET',
        baseUrl: API_BASE_URL,
    },

    // Projects
    PROJECTS: {
        GET_ALL: {
            path: '/projects',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        CREATE: {
            path: '/projects',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        UPDATE: (id) => ({
            path: `/projects/${id}`,
            method: 'PUT',
            baseUrl: API_BASE_URL,
        }),
        DELETE: {
            path: '/projects',
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        }
    },

    // Tasks
    TASKS: {
        GET_ALL: {
            path: '/tasks',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        GET_ONE: (id) => ({
            path: `/tasks/${id}`,
            method: 'GET',
            baseUrl: API_BASE_URL,
        }),
        GET_DETAILS: (id) => ({
            path: `/tasks/details/${id}`,
            method: 'GET',
            baseUrl: API_BASE_URL,
        }),
        GET_CHILD_TASKS: (id) => ({
            path: `/tasks/child-tasks/${id}`,
            method: 'GET',
            baseUrl: API_BASE_URL,
        }),
        CREATE: {
            path: '/tasks',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        UPDATE: (id) => ({
            path: `/tasks/${id}`,
            method: 'PUT',
            baseUrl: API_BASE_URL,
        }),
        DELETE: (id) => ({
            path: `/tasks/${id}`,
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        }),
        NEXT_STATUS: (id) => ({
            path: `/tasks/next-status/${id}`,
            method: 'PUT',
            baseUrl: API_BASE_URL,
        }),
        PREV_STATUS: (id) => ({
            path: `/tasks/prev-status/${id}`,
            method: 'PUT',
            baseUrl: API_BASE_URL,
        })
    },

    // Scope of Work
    SCOPE_OF_WORK: {
        GET_ALL: {
            path: '/scope-of-work',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        CREATE: {
            path: '/scope-of-work',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        UPDATE: (id) => ({
            path: `/scope-of-work/${id}`,
            method: 'PUT',
            baseUrl: API_BASE_URL,
        }),
        DELETE: {
            path: '/scope-of-work',
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        }
    },

    // Task Statuses
    TASK_STATUSES: {
        GET_ALL: {
            path: '/task-statuses',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        GET_SEQUENCE: {
            path: '/task-statuses/sequence',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        CREATE: {
            path: '/task-statuses',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        UPDATE: (id) => ({
            path: `/task-statuses/${id}`,
            method: 'PUT',
            baseUrl: API_BASE_URL,
        }),
        DELETE: {
            path: '/task-statuses',
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        }
    },

    // Task Types
    TASK_TYPES: {
        GET_ALL: {
            path: '/task-types',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        CREATE: {
            path: '/task-types',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        UPDATE: (id) => ({
            path: `/task-types/${id}`,
            method: 'PUT',
            baseUrl: API_BASE_URL,
        }),
        DELETE: {
            path: '/task-types',
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        }
    },

    // Importances
    IMPORTANCES: {
        GET_ALL: {
            path: '/importances',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        CREATE: {
            path: '/importances',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        UPDATE: (id) => ({
            path: `/importances/${id}`,
            method: 'PUT',
            baseUrl: API_BASE_URL,
        }),
        DELETE: {
            path: '/importances',
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        }
    },

    // Task Discussions
    TASK_DISCUSSIONS: {
        GET_ALL: {
            path: '/task-discussions',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        CREATE: {
            path: '/task-discussions',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        UPDATE: (id) => ({
            path: `/task-discussions/${id}`,
            method: 'PUT',
            baseUrl: API_BASE_URL,
        }),
        DELETE: {
            path: '/task-discussions',
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        }
    },

    // Tags
    TAGS: {
        GET_ALL: {
            path: '/tags',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        CREATE: {
            path: '/tags',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        DELETE: {
            path: '/tags',
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        }
    },

    // Articles
    ARTICLES: {
        GET_ALL: {
            path: '/articles',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        CREATE: {
            path: '/articles',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        UPDATE: (id) => ({
            path: `/articles/${id}`,
            method: 'PUT',
            baseUrl: API_BASE_URL,
        }),
        DELETE: {
            path: '/articles',
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        }
    },

    // DB Schemas (SQL Visualizer)
    DB_SCHEMAS: {
        GET_ALL: {
            path: '/db-schemas',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        GET_ONE: (id) => ({
            path: `/db-schemas/${id}`,
            method: 'GET',
            baseUrl: API_BASE_URL,
        }),
        CREATE: {
            path: '/db-schemas',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        UPDATE: (id) => ({
            path: `/db-schemas/${id}`,
            method: 'PUT',
            baseUrl: API_BASE_URL,
        }),
        DELETE: (id) => ({
            path: `/db-schemas/${id}`,
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        })
    },
    // AI Chat Threads
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
        DELETE: (id) => ({
            path: `/threads/${id}`,
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        })
    },
    // AI General Info
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
    // System Prompts
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

    // Local Git Manager
    GIT: {
        GET_CONFIG: {
            path: '/git/config',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        SAVE_CONFIG: {
            path: '/git/config',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        RUN: {
            path: '/git/run',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        SELECT_FOLDER: {
            path: '/git/select-folder',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        AI_GENERATE_PR: {
            path: '/git/ai-generate-pr',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        GET_PRS: {
            path: '/git/prs',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        CREATE_PR: {
            path: '/git/prs/create',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        CLOSE_PR: {
            path: '/git/prs/close',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        MERGE_PR: {
            path: '/git/prs/merge',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
    },
    DB_MANAGEMENT: {
        DIFF: {
            path: '/db-management/diff',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        SYNC: {
            path: '/db-management/sync',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        TABLES: {
            path: '/db-management/tables',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        BACKUP: {
            path: '/db-management/backup',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        MIGRATIONS_CHECK: {
            path: '/db-management/migrations/check',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        MIGRATIONS_CHECK_BULK: {
            path: '/db-management/migrations/check-bulk',
            method: 'POST',
            baseUrl: API_BASE_URL,
        }
    },
    IPO: {
        GET_ALL: {
            path: '/ipo',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        CREATE: {
            path: '/ipo',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        UPDATE: (id) => ({
            path: `/ipo/${id}`,
            method: 'PUT',
            baseUrl: API_BASE_URL,
        }),
        DELETE: (id) => ({
            path: `/ipo/${id}`,
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        }),
        DELETE_BULK: {
            path: '/ipo/bulk-delete',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        GET_APPLICATIONS: {
            path: '/ipo/applications',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        APPLY: {
            path: '/ipo/applications',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        GET_SETTINGS: {
            path: '/ipo/settings',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        UPDATE_SETTINGS: {
            path: '/ipo/settings',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        GET_ACCESS: {
            path: '/ipo/access',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        SHARE_ACCESS: {
            path: '/ipo/access/share',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        REVOKE_ACCESS: {
            path: '/ipo/access/revoke',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        GET_DASHBOARD: {
            path: '/ipo/dashboard',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        GET_ANALYTICS: {
            path: '/ipo/analytics',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        CREATE_ADJUSTMENT: {
            path: '/ipo/adjustments',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        DELETE_ADJUSTMENT: (id) => ({
            path: `/ipo/adjustments/${id}`,
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        }),
        EXPORT_EXCEL: {
            path: '/ipo/export-excel',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        IMPORT_EXCEL: {
            path: '/ipo/import-excel',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        FETCH_ALL_AI: {
            path: '/ipo/ai/fetch-all',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        GET_AI_INFO: {
            path: '/ipo/ai/info',
            method: 'GET',
            baseUrl: API_BASE_URL,
        }
    },

    // Mutual Funds & SIP
    MF: {
        GET_PORTFOLIO: {
            path: '/mf/portfolio',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        GET_PORTFOLIO_HISTORY: {
            path: '/mf/portfolio/history',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        GET_DIVERSIFICATION: {
            path: '/mf/portfolio/diversification',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        SYNC_NAVS: {
            path: '/mf/sync-nav',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        SEARCH: {
            path: '/mf/search',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        GET_NAV_ON_DATE: {
            path: '/mf/nav-on-date',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        GET_SCHEME: (code) => ({
            path: `/mf/scheme/${code}`,
            method: 'GET',
            baseUrl: API_BASE_URL,
        }),
        GET_SCHEME_HISTORY: (code) => ({
            path: `/mf/scheme/${code}/history`,
            method: 'GET',
            baseUrl: API_BASE_URL,
        }),
        ADD_INVESTMENT: {
            path: '/mf/investments',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        UPDATE_INVESTMENT: (id) => ({
            path: `/mf/investments/${id}`,
            method: 'PUT',
            baseUrl: API_BASE_URL,
        }),
        DELETE_INVESTMENT: (id) => ({
            path: `/mf/investments/${id}`,
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        }),
        EXPORT_EXCEL: {
            path: '/mf/export-excel',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        IMPORT_EXCEL: {
            path: '/mf/import-excel',
            method: 'POST',
            baseUrl: API_BASE_URL,
        }
    },

    // Stock / Share Holdings & Daily Price
    STOCKS: {
        GET_HOLDINGS: {
            path: '/stocks/holdings',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        GET_PORTFOLIO_HISTORY: {
            path: '/stocks/history',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        GET_STOCK_DETAILS: (stockId) => ({
            path: `/stocks/details/${stockId}`,
            method: 'GET',
            baseUrl: API_BASE_URL,
        }),
        ADD_TRADE: {
            path: '/stocks/trades',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        UPDATE_TRADE: (id) => ({
            path: `/stocks/trades/${id}`,
            method: 'PUT',
            baseUrl: API_BASE_URL,
        }),
        DELETE_TRADE: (id) => ({
            path: `/stocks/trades/${id}`,
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        }),
        ADD_DAILY_PRICE: {
            path: '/stocks/prices/daily',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        GET_PRICE_HISTORY: (stockId) => ({
            path: `/stocks/prices/history/${stockId}`,
            method: 'GET',
            baseUrl: API_BASE_URL,
        }),
        GET_MASTER_STOCKS: {
            path: '/stocks/master',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        SAVE_MASTER_STOCK: {
            path: '/stocks/master',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        DELETE_MASTER_STOCK: (id) => ({
            path: `/stocks/master/${id}`,
            method: 'DELETE',
            baseUrl: API_BASE_URL,
        }),
        EXPORT_EXCEL: {
            path: '/stocks/export-excel',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        IMPORT_EXCEL: {
            path: '/stocks/import-excel',
            method: 'POST',
            baseUrl: API_BASE_URL,
        },
        FETCH_ALL_PRICES_AI: {
            path: '/stocks/prices/all',
            method: 'GET',
            baseUrl: API_BASE_URL,
        }
    },

    // AI Stock Market Opportunity Scanner
    SCANNER: {
        GET_EVENTS: {
            path: '/scanner/events',
            method: 'GET',
            baseUrl: API_BASE_URL,
        },
        GET_EVENT_DETAILS: (id) => ({
            path: `/scanner/events/${id}`,
            method: 'GET',
            baseUrl: API_BASE_URL,
        }),
        RUN_LIVE_SSE_URL: `${API_BASE_URL}/scanner/run-live`
    },

    // Unified Account Balance & Cash Flows
    ACCOUNT: {
        GET_BALANCE: {
            path: '/account/balance',
            method: 'GET',
            baseUrl: API_BASE_URL,
        }
    }
};

export { API_BASE_URL };
export default API_BASE_URL;
