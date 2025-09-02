const mysql = require('mysql2/promise');
require("dotenv").config();

// Use connection pooling for better performance
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: true, // Enable SSL for TiDB Cloud
      }
});

console.log("Database connected");

module.exports = pool;
