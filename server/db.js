import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/salon_db',
});

pool.on('error', (err) => {
  console.error('Ошибка пула подключений PostgreSQL:', err);
});