const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const mysql = require("mysql2");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true   // dates come back as plain text like "2026-10-05"
});

module.exports = pool.promise();