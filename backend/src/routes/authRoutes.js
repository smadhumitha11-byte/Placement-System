const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Company = require("../models/Company");
const Admin = require("../models/Admin");

const router = express.Router();

// Makes the login token. It holds the user's id and role, and expires in 8 hours.
function makeToken(id, role) {
    return jwt.sign({ id: id, role: role }, process.env.JWT_SECRET, { expiresIn: "8h" });
}

// Checks the two fields are present and are text
function isText(value) {
    return typeof value === "string" && value.trim() !== "";
}

// POST /api/auth/student/login
router.post("/student/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!isText(email) || !isText(password)) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const student = await Student.findByEmail(email.trim());
        // Same message for "no such user" and "wrong password" so attackers learn nothing
        const passwordOk = student && student.password &&
            await bcrypt.compare(password, student.password);
        if (!passwordOk) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        res.json({ token: makeToken(student.id, "student"), role: "student", name: student.name });
    } catch (error) {
        console.error("Student login error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// POST /api/auth/company/login  (the role is called "recruiter")
router.post("/company/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!isText(email) || !isText(password)) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const company = await Company.findByEmail(email.trim());
        const passwordOk = company && await bcrypt.compare(password, company.password);
        if (!passwordOk) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        res.json({ token: makeToken(company.id, "recruiter"), role: "recruiter", name: company.company_name });
    } catch (error) {
        console.error("Company login error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// POST /api/auth/admin/login
router.post("/admin/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!isText(username) || !isText(password)) {
            return res.status(400).json({ message: "Username and password are required." });
        }

        const admin = await Admin.findByUsername(username.trim());
        const passwordOk = admin && await bcrypt.compare(password, admin.password);
        if (!passwordOk) {
            return res.status(401).json({ message: "Invalid username or password." });
        }

        res.json({ token: makeToken(admin.id, "admin"), role: "admin", name: admin.username });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

module.exports = router;