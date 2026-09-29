const express = require("express");
const path = require("path");
const fs = require("fs");
const Resume = require("../models/Resume");
const { verifyToken, requireRole } = require("../middleware/auth");

const router = express.Router();

const resumeFolder = path.join(__dirname, "../../uploads/resumes");

// GET /api/resumes/application/:id   (recruiter)
router.get("/application/:id", verifyToken, requireRole("recruiter"), async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ message: "Invalid id." });
        }

        const fileName = await Resume.findForCompany(id, req.user.id);
        if (!fileName) {
            return res.status(404).json({ message: "No resume found for this applicant." });
        }

        // path.basename keeps only the file name, so nobody can escape the folder
        const fullPath = path.join(resumeFolder, path.basename(fileName));
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ message: "Resume file is missing on the server." });
        }

        res.type("application/pdf");
        res.sendFile(fullPath);
    } catch (error) {
        console.error("Resume error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

module.exports = router;