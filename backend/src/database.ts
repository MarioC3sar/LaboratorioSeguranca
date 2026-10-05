import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: "admin",
  password: "senha123",
  database: "aula_db",
  port: 5432,
});

export default pool;
