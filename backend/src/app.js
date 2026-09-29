const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const db = require("./db/connection");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const companyRoutes = require("./routes/companyRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// Stop early if the secret key is missing, because login cannot work without it
if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing in backend/.env");
    process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

// ----- API routes -----
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/notifications", notificationRoutes);

// A quick way to check the server is alive
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

// Lets you open the website at http://localhost:3000
app.use(express.static(path.join(__dirname, "../../frontend")));

// ----- Unknown API address -----
app.use("/api", (req, res) => {
    res.status(404).json({ message: "API route not found." });
});

// ----- Last-resort error handler -----
app.use((error, req, res, next) => {
    console.error("Unexpected error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log("Server running on http://localhost:" + PORT);
    try {
        await db.query("SELECT 1");
        console.log("MySQL connected.");
    } catch (error) {
        console.error("MySQL connection failed:", error.message);
    }
});