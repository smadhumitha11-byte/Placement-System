const express = require("express");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Student = require("../models/Student");
const { verifyToken, requireRole } = require("../middleware/auth");

const router = express.Router();

const DEPARTMENTS = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AIDS"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9]{10}$/;

// Checks the fields that both registration and profile update need.
// Returns an error message, or null if everything is fine.
function validateProfile(body) {
    const { name, phone, department, year, cgpa } = body;

    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
        return "Name must be 2 to 100 characters.";
    }
    if (typeof phone !== "string" || !PHONE_PATTERN.test(phone)) {
        return "Phone must be exactly 10 digits.";
    }
    if (!DEPARTMENTS.includes(department)) {
        return "Please choose a valid department.";
    }
    if (!Number.isInteger(year) || year < 1 || year > 4) {
        return "Year must be 1, 2, 3 or 4.";
    }
    if (typeof cgpa !== "number" || isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
        return "CGPA must be a number between 0 and 10.";
    }
    return null;
}

// ---------- POST /api/students/register ----------
router.post("/register", async (req, res) => {
    try {
        const { name, roll_no, email, phone, department, year, cgpa, password } = req.body;

        let problem = validateProfile(req.body);
        if (!problem && (typeof roll_no !== "string" || roll_no.trim() === "" || roll_no.trim().length > 20)) {
            problem = "Roll number is required (maximum 20 characters).";
        }
        if (!problem && (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim()))) {
            problem = "Enter a valid email address.";
        }
        if (!problem && (typeof password !== "string" || password.length < 8)) {
            problem = "Password must be at least 8 characters.";
        }
        if (problem) {
            return res.status(400).json({ message: problem });
        }

        // Turn the password into a hash before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const id = await Student.create({
            name: name.trim(),
            roll_no: roll_no.trim(),
            email: email.trim().toLowerCase(),
            phone: phone,
            department: department,
            year: year,
            cgpa: cgpa,
            password: hashedPassword
        });

        res.status(201).json({ message: "Registration successful.", id: id });
    } catch (error) {
        // ER_DUP_ENTRY means the email or roll number is already in the database
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "This email or roll number is already registered." });
        }
        console.error("Student register error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// ---------- GET /api/students/profile ----------
router.get("/profile", verifyToken, requireRole("student"), async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);
        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }
        res.json(student);
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// ---------- PUT /api/students/profile ----------
router.put("/profile", verifyToken, requireRole("student"), async (req, res) => {
    try {
        const problem = validateProfile(req.body);
        if (problem) {
            return res.status(400).json({ message: problem });
        }

        await Student.updateProfile(req.user.id, {
            name: req.body.name.trim(),
            phone: req.body.phone,
            department: req.body.department,
            year: req.body.year,
            cgpa: req.body.cgpa
        });

        res.json({ message: "Profile updated." });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// ---------- Resume upload settings ----------
const resumeFolder = path.join(__dirname, "../../uploads/resumes");
fs.mkdirSync(resumeFolder, { recursive: true }); // creates the folder if missing

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, resumeFolder);
        },
        // File name is built by the server, never taken from the user
        filename: function (req, file, callback) {
            callback(null, "student-" + req.user.id + "-" + Date.now() + ".pdf");
        }
    }),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
    fileFilter: function (req, file, callback) {
        if (file.mimetype !== "application/pdf") {
            return callback(new Error("Only PDF files are allowed."));
        }
        callback(null, true);
    }
});

// ---------- POST /api/students/resume ----------
router.post("/resume", verifyToken, requireRole("student"), (req, res) => {
    upload.single("resume")(req, res, async function (uploadError) {
        if (uploadError) {
            const message = uploadError.code === "LIMIT_FILE_SIZE"
                ? "File is too large. Maximum size is 2 MB."
                : uploadError.message;
            return res.status(400).json({ message: message });
        }
        if (!req.file) {
            return res.status(400).json({ message: "Please choose a PDF file." });
        }

        try {
            await Student.setResume(req.user.id, req.file.filename);
            res.json({ message: "Resume uploaded.", resume_path: req.file.filename });
        } catch (error) {
            console.error("Resume save error:", error);
            res.status(500).json({ message: "Server error. Please try again." });
        }
    });
});

module.exports = router;