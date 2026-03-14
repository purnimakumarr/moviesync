import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    ssl: true,
});

console.log(pool);

pool.query("SELECT NOW()")
    .then((res: any) => console.log("Database connected:", res.rows[0]))
    .catch((err: any) => console.error("Database connection error:", err));

export default pool;
