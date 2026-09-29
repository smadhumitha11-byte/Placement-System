const express = require("express");
const bcrypt = require("bcrypt");
const Company = require("../models/Company");
const { verifyToken, requireRole } = require("../middleware/auth");

const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9]{10}$/;

// Checks fields shared by registration and profile update
function validateCompany(body) {
    const { company_name, phone, website } = body;

    if (typeof company_name !== "string" || company_name.trim().length < 2 || company_name.trim().length > 150) {
        return "Company name must be 2 to 150 characters.";
    }
    if (typeof phone !== "string" || !PHONE_PATTERN.test(phone)) {
        return "Phone must be exactly 10 digits.";
    }
    if (website && (typeof website !== "string" || !/^https?:\/\/.+/.test(website))) {
        return "Website must start with http:// or https://";
    }
    return null;
}

// ---------- POST /api/companies/register ----------
router.post("/register", async (req, res) => {
    try {
        const { company_name, email, phone, website, description, password } = req.body;

        let problem = validateCompany(req.body);
        if (!problem && (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim()))) {
            problem = "Enter a valid email address.";
        }
        if (!problem && (typeof password !== "string" || password.length < 8)) {
            problem = "Password must be at least 8 characters.";
        }
        if (problem) {
            return res.status(400).json({ message: problem });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const id = await Company.create({
            company_name: company_name.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            phone: phone,
            website: website || null,
            description: description || null
        });

        res.status(201).json({ message: "Company registered.", id: id });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "This email is already registered." });
        }
        console.error("Company register error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// ---------- GET /api/companies/profile ----------
router.get("/profile", verifyToken, requireRole("recruiter"), async (req, res) => {
    try {
        const company = await Company.findById(req.user.id);
        if (!company) {
            return res.status(404).json({ message: "Company not found." });
        }
        res.json(company);
    } catch (error) {
        console.error("Get company profile error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// ---------- PUT /api/companies/profile ----------
router.put("/profile", verifyToken, requireRole("recruiter"), async (req, res) => {
    try {
        const problem = validateCompany(req.body);
        if (problem) {
            return res.status(400).json({ message: problem });
        }

        await Company.updateProfile(req.user.id, {
            company_name: req.body.company_name.trim(),
            phone: req.body.phone,
            website: req.body.website || null,
            description: req.body.description || null
        });

        res.json({ message: "Company profile updated." });
    } catch (error) {
        console.error("Update company profile error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

module.exports = router;