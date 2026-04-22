import { Pool } from 'pg';
const USER = process.env.DB_USER || "postgres";
const HOST = process.env.DB_HOST || "localhost";
const DB = process.env.DB_NAME || "workflow_db";
const PASS = process.env.DB_PASS || "root";
export const pool = new Pool({
    user: USER,
    host: HOST,
    database: DB,
    password: PASS,
    port: 5432,
});
//# sourceMappingURL=pool.js.map