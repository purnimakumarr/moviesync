import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // Neon requires SSL in production.
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool
  .query('SELECT NOW()')
  .then((res) => console.log('Database connected:', res.rows[0]))
  .catch((err) => console.error('Database connection error:', err));

export default pool;
