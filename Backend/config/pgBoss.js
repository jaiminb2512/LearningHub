
import { PgBoss } from "pg-boss";
import dotenv from 'dotenv';

dotenv.config();

const boss = new PgBoss({
    connectionString: process.env.DATABASE_URL,
});

boss.on("error", (error) => {
    console.error("[pg-boss error]", error);
});

export default boss;
