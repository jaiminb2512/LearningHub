import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Check if DATABASE_URL is provided
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}
console.log(process.env.DATABASE_URL);

// SSL Configuration for cloud providers (Aiven, AWS RDS, etc.)
const sslConfig = {
    rejectUnauthorized: false, // Set to false for cloud providers with self-signed CAs
};

// Create connection pool using DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // ssl: sslConfig,
    // Connection timeout
    connectionTimeoutMillis: 10000,
    // Idle timeout
    idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Function to connect to the database
export const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log('Connected to PostgreSQL database successfully');
        client.release();
        return true;
    } catch (error) {
        console.error('Failed to connect to PostgreSQL database:', error.message);
        return false;
    }
};

export default pool;

