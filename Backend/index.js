import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import sendResponse from './utils/response.js';
import { connectDB } from './dbConnect/database.js';
import apiRoutes from './routes/index.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Parse allowed origins from environment variable
const allowedOrigins = process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(',').map(url => url.trim())
    : ['http://localhost:5173'] // Default fallback for development

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, or curl)
        if (!origin) return callback(null, true);

        // Allow same-origin requests (when origin matches the server URL)
        if (origin && origin.includes('localhost:3000')) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`⚠️  Blocked by CORS: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies and credentials
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', apiRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Initialize database connection
let dbInitialized = false;
const initializeDB = async () => {
    if (!dbInitialized) {
        const isConnected = await connectDB();
        if (isConnected) {
            console.log('Database connected successfully');
            dbInitialized = true;
        } else {
            console.log('Database connection failed');
        }
    }
};

// Test route
app.get('/', async (req, res) => {
    await initializeDB();
    sendResponse(res, 200, 'Server is running......');
});

// Database test route
app.get('/db-test', async (req, res) => {
    try {
        await initializeDB();
        sendResponse(res, 200, 'Database connected successfully', dbInitialized);
    } catch (error) {
        console.error('Database error:', error);
        sendResponse(res, 500, 'Database connection failed', { error: error.message });
    }
});

// Connect to database and start server (for local development)
const startServer = async () => {
    await initializeDB();

    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
        console.log(`API documentation available at http://localhost:${port}/api-docs`);
    });
};

// Start server only in local development (not on Vercel)
if (!process.env.VERCEL) {
    startServer();
}

// Export the Express app for Vercel serverless
export default app;