import swaggerJsdoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.3",
        info: {
            title: "LearningHub API",
            version: "1.0.0",
            description: "API for LearningHub — users, AI chat threads, books, notes, system prompts, and AI settings",
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
                }
            }
        },
        paths: {
            "/api/users/register": {
                post: {
                    tags: ["Users"],
                    summary: "Register a new user",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/RegisterInput" }
                            }
                        }
                    },
                    responses: {
                        201: { description: "User registered" },
                        400: { description: "Validation error" }
                    }
                }
            },
            "/api/users/login": {
                post: {
                    tags: ["Users"],
                    summary: "Login",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/LoginInput" }
                            }
                        }
                    },
                    responses: {
                        200: { description: "Login successful" },
                        401: { description: "Invalid credentials" }
                    }
                }
            },
            "/api/users/me": {
                get: {
                    tags: ["Users"],
                    summary: "Get current user",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: "Current user profile" },
                        401: { description: "Unauthorized" }
                    }
                }
            },
            "/api/threads": {
                get: {
                    tags: ["Threads"],
                    summary: "List chat threads",
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: "Thread list" } }
                },
                post: {
                    tags: ["Threads"],
                    summary: "Create a chat thread",
                    security: [{ bearerAuth: [] }],
                    responses: { 201: { description: "Thread created" } }
                }
            },
            "/api/ai/generate": {
                post: {
                    tags: ["AI"],
                    summary: "Generate an AI response",
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: "AI response" } }
                }
            },
            "/api/ai/stream": {
                post: {
                    tags: ["AI"],
                    summary: "Stream an AI response",
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: "SSE stream" } }
                }
            },
            "/api/books": {
                get: {
                    tags: ["Books"],
                    summary: "List books",
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: "Book list" } }
                },
                post: {
                    tags: ["Books"],
                    summary: "Create a book",
                    security: [{ bearerAuth: [] }],
                    responses: { 201: { description: "Book created" } }
                }
            },
            "/api/system-prompts": {
                get: {
                    tags: ["System Prompts"],
                    summary: "List system prompts",
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: "Prompt list" } }
                }
            },
            "/api/ai-settings": {
                get: {
                    tags: ["AI Settings"],
                    summary: "List AI settings",
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: "Settings list" } }
                }
            }
        }
    },
    apis: [],
};

const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
