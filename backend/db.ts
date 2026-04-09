import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const parseBoolean = (value?: string) =>
    value?.toLowerCase() === "true";

const useSsl = parseBoolean(process.env.DB_SSL);
const rejectUnauthorized = parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED);

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    ssl: useSsl ? { rejectUnauthorized } : false,
});

pool.query("SELECT NOW()")
    .then((res: any) => console.log("Database connected:", res.rows[0]))
    .catch((err: any) => console.error("Database connection error:", err));

export default pool;
