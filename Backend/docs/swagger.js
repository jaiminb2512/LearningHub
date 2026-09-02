import swaggerJsdoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.3",
        info: {
            title: "Task Management API",
            version: "1.0.0",
            description: "API for User, Project, and Task Management",
        },
        servers: [
            { url: "http://localhost:3009", description: "Local" }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                // ... Existing User Schemas
                User: {
                    type: "object",
                    properties: {
                        userId: { type: "string", format: "uuid" },
                        fullName: { type: "string" },
                        emailId: { type: "string", format: "email" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                },
                RegisterInput: {
                    type: "object",
                    required: ["fullName", "emailId", "password"],
                    properties: {
                        fullName: { type: "string" },
                        emailId: { type: "string", format: "email" },
                        password: { type: "string" }
                    }
                },
                LoginInput: {
                    type: "object",
                    required: ["emailId", "password"],
                    properties: {
                        emailId: { type: "string", format: "email" },
                        password: { type: "string" }
                    }
                },
                LoginResponse: {
                    type: "object",
                    properties: {
                        userId: { type: "string", format: "uuid" },
                        fullName: { type: "string" },
                        emailId: { type: "string", format: "email" },
                        token: { type: "string" }
                    }
                },
                ErrorResponse: {
                    type: "object",
                    properties: {
                        success: { type: "number" },
                        message: { type: "string" },
                        data: { type: "object", nullable: true }
                    }
                },
                // ... New Schemas
                PaginationMeta: {
                    type: "object",
                    properties: {
                        total: { type: "integer" },
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        totalPages: { type: "integer" }
                    }
                },
                Project: {
                    type: "object",
                    properties: {
                        projectId: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        isDeleted: { type: "boolean" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                },
                Task: {
                    type: "object",
                    properties: {
                        taskId: { type: "string", format: "uuid" },
                        title: { type: "string" },
                        description: { type: "string" },
                        projectId: { type: "string", format: "uuid", nullable: true },
                        statusId: { type: "string" },
                        importanceId: { type: "string" },
                        priority: { type: "integer" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                },
                TaskType: {
                    type: "object",
                    properties: {
                        taskTypeId: { type: "string", format: "uuid" },
                        projectId: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                },
                ScopeOfWork: {
                    type: "object",
                    properties: {
                        scopeId: { type: "string", format: "uuid" },
                        projectId: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                },
                TaskStatus: {
                    type: "object",
                    properties: {
                        statusId: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        sequence: { type: "integer" },
                        isProject: { type: "boolean" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                },
                Importance: {
                    type: "object",
                    properties: {
                        importanceId: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        sequence: { type: "integer" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                },
                TaskDiscussion: {
                    type: "object",
                    properties: {
                        discussionId: { type: "string", format: "uuid" },
                        taskId: { type: "string", format: "uuid" },
                        message: { type: "string" },
                        createdAt: { type: "string", format: "date-time" }
                    }
                }
            }
        },
        paths: {
            // ... User paths (kept same)
            "/api/users/register": {
                post: {
                    summary: "Register a new user",
                    tags: ["Users"],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/RegisterInput" }
                            }
                        }
                    },
                    responses: {
                        "201": {
                            description: "User registered successfully",
                            content: { "application/json": { schema: { type: "object", properties: { success: { type: "number" }, message: { type: "string" }, data: { $ref: "#/components/schemas/User" } } } } }
                        },
                        "400": { description: "Validation error" },
                        "409": { description: "Email already exists" }
                    }
                }
            },
            "/api/users/login": {
                post: {
                    summary: "User login",
                    tags: ["Users"],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/LoginInput" }
                            }
                        }
                    },
                    responses: {
                        "200": {
                            description: "Login successful",
                            content: { "application/json": { schema: { type: "object", properties: { success: { type: "number" }, message: { type: "string" }, data: { $ref: "#/components/schemas/LoginResponse" } } } } }
                        },
                        "401": { description: "Invalid credentials" }
                    }
                }
            },
            // ... NEW PATHS ...
            // PROJECTS
            "/api/projects": {
                get: {
                    summary: "Get all projects",
                    tags: ["Projects"],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                        { in: "query", name: "limit", schema: { type: "integer", default: 10 } }
                    ],
                    responses: {
                        "200": {
                            description: "List of projects",
                            content: { "application/json": { schema: { type: "object", properties: { success: { type: "number" }, message: { type: "string" }, data: { type: "object", properties: { projects: { type: "array", items: { $ref: "#/components/schemas/Project" } }, pagination: { $ref: "#/components/schemas/PaginationMeta" } } } } } } }
                        }
                    }
                },
                post: {
                    summary: "Create a project",
                    tags: ["Projects"],
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" } } } } }
                    },
                    responses: {
                        "201": { description: "Project created" }
                    }
                }
            },
            "/api/projects/{id}": {
                put: {
                    summary: "Update a project",
                    tags: ["Projects"],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    requestBody: { content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" } } } } } },
                    responses: { "200": { description: "Project updated" } }
                },
                delete: {
                    summary: "Delete a project",
                    tags: ["Projects"],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    responses: { "200": { description: "Project deleted" } }
                }
            },
            // TASKS
            "/api/tasks": {
                get: {
                    summary: "Get all tasks with filters",
                    description: "Retrieve a paginated list of tasks with optional filtering by project, status, importance, type, tags, dates, and search query",
                    tags: ["Tasks"],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: "query", name: "page", schema: { type: "integer", default: 1 }, description: "Page number" },
                        { in: "query", name: "limit", schema: { type: "integer", default: 10 }, description: "Items per page" },
                        { in: "query", name: "projectId", schema: { type: "string", format: "uuid" }, description: "Filter by project ID" },
                        { in: "query", name: "isProject", schema: { type: "boolean" }, description: "Filter by project status (true/false)" },
                        { in: "query", name: "statusId", schema: { type: "string", format: "uuid" }, description: "Filter by status ID" },
                        { in: "query", name: "importanceId", schema: { type: "string", format: "uuid" }, description: "Filter by importance ID" },
                        { in: "query", name: "taskTypeId", schema: { type: "string", format: "uuid" }, description: "Filter by task type ID" },
                        { in: "query", name: "search", schema: { type: "string" }, description: "Search in title and description" },
                        { in: "query", name: "tags", schema: { type: "string" }, description: "Comma-separated tags (e.g., 'frontend,bug')" },
                        { in: "query", name: "startDate", schema: { type: "string", format: "date" }, description: "Filter by start date (YYYY-MM-DD)" },
                        { in: "query", name: "dueDate", schema: { type: "string", format: "date" }, description: "Filter by due date (YYYY-MM-DD)" }
                    ],
                    responses: {
                        "200": {
                            description: "List of tasks",
                            content: { "application/json": { schema: { type: "object", properties: { success: { type: "number" }, message: { type: "string" }, data: { type: "object", properties: { tasks: { type: "array", items: { $ref: "#/components/schemas/Task" } }, pagination: { $ref: "#/components/schemas/PaginationMeta" } } } } } } }
                        },
                        "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
                    }
                },
                post: {
                    summary: "Create a new task",
                    description: "Create a new task with title, description, project, status, importance, and optional metadata",
                    tags: ["Tasks"],
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    required: ["title", "importanceId", "taskTypeId"],
                                    properties: {
                                        title: { type: "string", description: "Task title" },
                                        description: { type: "string", nullable: true, description: "Task description" },
                                        link: { type: "string", nullable: true, description: "External link" },
                                        projectId: { type: "string", format: "uuid", nullable: true, description: "Project ID (optional)" },
                                        taskTypeId: { type: "string", format: "uuid", description: "Task type ID" },
                                        importanceId: { type: "string", format: "uuid", description: "Importance ID" },
                                        startDate: { type: "string", format: "date-time", nullable: true, description: "Start date" },
                                        dueDate: { type: "string", format: "date-time", nullable: true, description: "Due date" },
                                        tags: { type: "array", items: { type: "string" }, description: "Array of tag names" },
                                        parentTaskId: { type: "string", format: "uuid", nullable: true, description: "Parent task ID for subtasks" }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "201": {
                            description: "Task created successfully",
                            content: { "application/json": { schema: { type: "object", properties: { success: { type: "number" }, message: { type: "string" }, data: { $ref: "#/components/schemas/Task" } } } } }
                        },
                        "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                        "404": { description: "Project or status not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                        "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
                    }
                }
            },
            "/api/tasks/details/{id}": {
                get: {
                    summary: "Get task details with relations",
                    description: "Retrieve detailed task information including project, status, importance, type, tags, discussions, parent and child tasks",
                    tags: ["Tasks"],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" }, description: "Task ID" }
                    ],
                    responses: {
                        "200": {
                            description: "Task details retrieved successfully",
                            content: { "application/json": { schema: { type: "object", properties: { success: { type: "number" }, message: { type: "string" }, data: { $ref: "#/components/schemas/Task" } } } } }
                        },
                        "404": { description: "Task not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                        "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
                    }
                }
            },
            "/api/tasks/child-tasks/{id}": {
                get: {
                    summary: "Get child tasks of a parent task",
                    description: "Retrieve all child tasks (subtasks) of a given parent task",
                    tags: ["Tasks"],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" }, description: "Parent task ID" }
                    ],
                    responses: {
                        "200": {
                            description: "Child tasks retrieved successfully",
                            content: { "application/json": { schema: { type: "object", properties: { success: { type: "number" }, message: { type: "string" }, data: { type: "object", properties: { parentTask: { type: "object" }, childTasks: { type: "array", items: { $ref: "#/components/schemas/Task" } } } } } } } }
                        },
                        "404": { description: "Task not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                        "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
                    }
                }
            },
            "/api/tasks/{id}": {
                get: {
                    summary: "Get task by ID",
                    description: "Retrieve a single task by its ID with basic information",
                    tags: ["Tasks"],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" }, description: "Task ID" }
                    ],
                    responses: {
                        "200": {
                            description: "Task retrieved successfully",
                            content: { "application/json": { schema: { type: "object", properties: { success: { type: "number" }, message: { type: "string" }, data: { $ref: "#/components/schemas/Task" } } } } }
                        },
                        "404": { description: "Task not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                        "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
                    }
                },
                put: {
                    summary: "Update a task",
                    description: "Update task properties. Only provided fields will be updated.",
                    tags: ["Tasks"],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" }, description: "Task ID" }
                    ],
                    requestBody: {
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        title: { type: "string", description: "Task title" },
                                        description: { type: "string", nullable: true, description: "Task description" },
                                        link: { type: "string", nullable: true, description: "External link" },
                                        projectId: { type: "string", format: "uuid", nullable: true, description: "Project ID" },
                                        taskTypeId: { type: "string", format: "uuid", nullable: true, description: "Task type ID" },
                                        statusId: { type: "string", format: "uuid", nullable: true, description: "Status ID" },
                                        importanceId: { type: "string", format: "uuid", description: "Importance ID" },
                                        startDate: { type: "string", format: "date-time", nullable: true, description: "Start date" },
                                        dueDate: { type: "string", format: "date-time", nullable: true, description: "Due date" },
                                        tags: { type: "array", items: { type: "string" }, description: "Array of tag names (replaces all existing tags)" },
                                        priority: { type: "integer", description: "Task priority" }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        "200": {
                            description: "Task updated successfully",
                            content: { "application/json": { schema: { type: "object", properties: { success: { type: "number" }, message: { type: "string" }, data: { $ref: "#/components/schemas/Task" } } } } }
                        },
                        "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                        "404": { description: "Task, status, or importance not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                        "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
                    }
                },
                delete: {
                    summary: "Delete a task",
                    description: "Soft delete or hard delete a task. Soft delete is default. Use hardDelete=true query parameter for permanent deletion.",
                    tags: ["Tasks"],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" }, description: "Task ID" },
                        { in: "query", name: "hardDelete", schema: { type: "boolean", default: false }, description: "If true, permanently delete the task" }
                    ],
                    responses: {
                        "200": {
                            description: "Task deleted successfully",
                            content: { "application/json": { schema: { type: "object", properties: { success: { type: "number" }, message: { type: "string" } } } } }
                        },
                        "404": { description: "Task not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                        "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
                    }
                }
            },
            "/api/tasks/next-status/{id}": {
                put: {
                    summary: "Move task to next status",
                    description: "Automatically moves a task to the next status in sequence based on the current status. Updates task completion status if the next status is marked as complete.",
                    tags: ["Tasks"],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" }, description: "Task ID" }
                    ],
                    responses: {
                        "200": {
                            description: "Task moved to next status successfully",
                            content: { "application/json": { schema: { type: "object", properties: { success: { type: "number" }, message: { type: "string" }, data: { $ref: "#/components/schemas/Task" } } } } }
                        },
                        "400": { description: "Task is already completed", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                        "404": { description: "Task or next status not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
                        "500": { description: "Server error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
                    }
                }
            },
            // SCOPE OF WORK
            "/api/scope-of-work": {
                get: {
                    summary: "Get scopes of work",
                    tags: ["Configuration"],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: "query", name: "projectId", schema: { type: "string" } },
                        { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                        { in: "query", name: "limit", schema: { type: "integer", default: 10 } }
                    ],
                    responses: { "200": { description: "List of scopes" } }
                },
                post: {
                    summary: "Create scope of work",
                    tags: ["Scope Of Work"],
                    security: [{ bearerAuth: [] }],
                    requestBody: { content: { "application/json": { schema: { type: "object", required: ["projectId", "name"], properties: { projectId: { type: "string" }, name: { type: "string" } } } } } },
                    responses: { "201": { description: "Scope created" } }
                }
            },
            "/api/scope-of-work/{id}": {
                put: {
                    summary: "Update scope of work",
                    tags: ["Scope Of Work"],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    requestBody: { content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" } } } } } },
                    responses: { "200": { description: "Scope updated" } }
                },
                delete: {
                    summary: "Delete scope of work",
                    tags: ["Scope Of Work"],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    responses: { "200": { description: "Scope deleted" } }
                }
            },
            // TASK STATUS
            "/api/task-statuses": {
                get: {
                    summary: "Get task statuses",
                    tags: ["Configuration"],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: "query", name: "isProject", schema: { type: "boolean" } },
                        { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                        { in: "query", name: "limit", schema: { type: "integer", default: 10 } }
                    ],
                    responses: { "200": { description: "List of statuses" } }
                },
                post: {
                    summary: "Create task status",
                    tags: ["Task Status"],
                    security: [{ bearerAuth: [] }],
                    requestBody: { content: { "application/json": { schema: { type: "object", required: ["name", "sequence", "isProject"], properties: { name: { type: "string" }, sequence: { type: "integer" }, isProject: { type: "boolean" } } } } } },
                    responses: { "201": { description: "Status created" } }
                }
            },
            "/api/task-statuses/{id}": {
                put: {
                    summary: "Update task status",
                    tags: ["Task Status"],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    requestBody: { content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, sequence: { type: "integer" } } } } } },
                    responses: { "200": { description: "Status updated" } }
                },
                delete: {
                    summary: "Delete task status",
                    tags: ["Task Status"],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    responses: { "200": { description: "Status deleted" } }
                }
            },
            // TASK TYPES
            "/api/task-types": {
                get: {
                    summary: "Get task types",
                    tags: ["Configuration"],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: "query", name: "projectId", schema: { type: "string" } },
                        { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                        { in: "query", name: "limit", schema: { type: "integer", default: 10 } }
                    ],
                    responses: { "200": { description: "List of task types" } }
                },
                post: {
                    summary: "Create task type",
                    tags: ["Task Type"],
                    security: [{ bearerAuth: [] }],
                    requestBody: { content: { "application/json": { schema: { type: "object", required: ["projectId", "name"], properties: { projectId: { type: "string" }, name: { type: "string" } } } } } },
                    responses: { "201": { description: "Task type created" } }
                }
            },
            "/api/task-types/{id}": {
                put: {
                    summary: "Update task type",
                    tags: ["Task Type"],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    requestBody: { content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" } } } } } },
                    responses: { "200": { description: "Task type updated" } }
                },
                delete: {
                    summary: "Delete task type",
                    tags: ["Task Type"],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    responses: { "200": { description: "Task type deleted" } }
                }
            },
            // IMPORTANCES
            "/api/importances": {
                get: {
                    summary: "Get importance levels",
                    tags: ["Configuration"],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                        { in: "query", name: "limit", schema: { type: "integer", default: 10 } }
                    ],
                    responses: { "200": { description: "List of importances" } }
                },
                post: {
                    summary: "Create importance level",
                    tags: ["Importance"],
                    security: [{ bearerAuth: [] }],
                    requestBody: { content: { "application/json": { schema: { type: "object", required: ["name", "sequence"], properties: { name: { type: "string" }, sequence: { type: "integer" } } } } } },
                    responses: { "201": { description: "Importance created" } }
                }
            },
            "/api/importances/{id}": {
                put: {
                    summary: "Update importance level",
                    tags: ["Importance"],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    requestBody: { content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" }, sequence: { type: "integer" } } } } } },
                    responses: { "200": { description: "Importance updated" } }
                },
                delete: {
                    summary: "Delete importance level",
                    tags: ["Importance"],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    responses: { "200": { description: "Importance deleted" } }
                }
            },
            // DISCUSSIONS
            "/api/task-discussions": {
                get: {
                    summary: "Get task discussions",
                    tags: ["Tasks"],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { in: "query", name: "taskId", required: true, schema: { type: "string" } },
                        { in: "query", name: "page", schema: { type: "integer", default: 1 } },
                        { in: "query", name: "limit", schema: { type: "integer", default: 10 } }
                    ],
                    responses: { "200": { description: "List of discussions" } }
                },
                post: {
                    summary: "Add discussion message",
                    tags: ["Task Discussion"],
                    security: [{ bearerAuth: [] }],
                    requestBody: { content: { "application/json": { schema: { type: "object", required: ["taskId", "message"], properties: { taskId: { type: "string" }, message: { type: "string" } } } } } },
                    responses: { "201": { description: "Message added" } }
                }
            },
            "/api/task-discussions/{id}": {
                put: {
                    summary: "Update discussion message",
                    tags: ["Tasks"],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    requestBody: { content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } } },
                    responses: { "200": { description: "Message updated" } }
                },
                delete: {
                    summary: "Delete discussion message",
                    tags: ["Task Discussion"],
                    security: [{ bearerAuth: [] }],
                    parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
                    responses: { "200": { description: "Message deleted" } }
                }
            }
        }
    },
    apis: [
        "./routes/**/*.js"
    ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
