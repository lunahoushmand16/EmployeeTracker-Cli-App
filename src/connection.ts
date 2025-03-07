import dotenv from "dotenv";
dotenv.config();

// Import and require Pool (node-postgres)
import pg from "pg";
const { Pool } = pg;

// Create a PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 5432, // Ensures PORT is treated as a number
});

// Function to test database connection
const connectToDb = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Connected to the PostgreSQL database.");
    client.release(); // Release the client back to the pool
  } catch (err) {
    console.error("❌ Error connecting to database:", err);
    process.exit(1); // Exit the app if DB connection fails
  }
};

export { pool, connectToDb };
