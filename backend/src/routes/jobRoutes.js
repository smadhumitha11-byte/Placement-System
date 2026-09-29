const express = require("express");
const Job = require("../models/Job");
const Student = require("../models/Student");
const Application = require("../models/Application");
const { checkEligibility, criteriaReasons } = require("../utils/eligibility");
const { verifyToken, requireRole } = require("../middleware/auth");

const router = express.Router();

const DEPARTMENTS = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AIDS"];

// Returns an error message, or null when the job data is fine
function validateJob(body) {
    const { title, location, package_lpa, min_cgpa, allowed_departments, deadline } = body;

    if (typeof title !== "string" || title.trim().length < 2 || title.trim().length > 150) {
        return "Job title must be 2 to 150 characters.";
    }
    if (location && (typeof location !== "string" || location.length > 100)) {
        return "Location must be text of at most 100 characters.";
    }
    if (package_lpa !== null && package_lpa !== undefined && package_lpa !== "") {
        if (typeof package_lpa !== "number" || package_lpa < 0 || package_lpa > 999) {
            return "Package must be a number from 0 to 999 (LPA).";
        }
    }
    if (typeof min_cgpa !== "number" || isNaN(min_cgpa) || min_cgpa < 0 || min_cgpa > 10) {
        return "Minimum CGPA must be a number between 0 and 10.";
    }
    if (typeof allowed_departments !== "string" || allowed_departments.trim() === "") {
        return "Choose the allowed departments, or ALL.";
    }
    const list = allowed_departments.split(",").map(function (d) { return d.trim(); });
    for (const d of list) {
        if (d !== "ALL" && !DEPARTMENTS.includes(d)) {
            return "Invalid department: " + d;
        }
    }
    if (deadline) {
        if (typeof deadline !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(deadline) || isNaN(new Date(deadline))) {
            return "Deadline must be a valid date (YYYY-MM-DD).";
        }
    }
    return null;
}

// Cleans the request body into the values we save
function cleanJob(body) {
    return {
        title: body.title.trim(),
        description: body.description || null,
        location: body.location || null,
        package_lpa: (body.package_lpa === "" || body.package_lpa === undefined) ? null : body.package_lpa,
        min_cgpa: body.min_cgpa,
        allowed_departments: body.allowed_departments.split(",").map(function (d) { return d.trim(); }).join(","),
        deadline: body.deadline || null,
        status: body.status === "Closed" ? "Closed" : "Open"
    };
}

// GET /api/jobs?search=text   (any logged-in user)
router.get("/", verifyToken, async (req, res) => {
    try {
        const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 50) : "";
        res.json(await Job.findOpen(search));
    } catch (error) {
        console.error("List jobs error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// GET /api/jobs/mine   (recruiter: own jobs)
router.get("/mine", verifyToken, requireRole("recruiter"), async (req, res) => {
    try {
        res.json(await Job.findByCompany(req.user.id));
    } catch (error) {
        console.error("My jobs error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// POST /api/jobs   (recruiter)
router.post("/", verifyToken, requireRole("recruiter"), async (req, res) => {
    try {
        const problem = validateJob(req.body);
        if (problem) {
            return res.status(400).json({ message: problem });
        }
        const id = await Job.create(req.user.id, cleanJob(req.body));
        res.status(201).json({ message: "Job posted.", id: id });
    } catch (error) {
        console.error("Create job error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// PUT /api/jobs/:id   (recruiter, own job)
router.put("/:id", verifyToken, requireRole("recruiter"), async (req, res) => {
    try {
        const problem = validateJob(req.body);
        if (problem) {
            return res.status(400).json({ message: problem });
        }
        if (req.body.status && !["Open", "Closed"].includes(req.body.status)) {
            return res.status(400).json({ message: "Status must be Open or Closed." });
        }
        const changed = await Job.update(Number(req.params.id), req.user.id, cleanJob(req.body));
        if (changed === 0) {
            return res.status(404).json({ message: "Job not found." });
        }
        res.json({ message: "Job updated." });
    } catch (error) {
        console.error("Update job error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// DELETE /api/jobs/:id   (recruiter, own job)
router.delete("/:id", verifyToken, requireRole("recruiter"), async (req, res) => {
    try {
        const changed = await Job.remove(Number(req.params.id), req.user.id);
        if (changed === 0) {
            return res.status(404).json({ message: "Job not found." });
        }
        res.json({ message: "Job deleted." });
    } catch (error) {
        console.error("Delete job error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// GET /api/jobs/:id/eligibility   (student checks themselves)
router.get("/:id/eligibility", verifyToken, requireRole("student"), async (req, res) => {
    try {
        const job = await Job.findById(Number(req.params.id));
        if (!job) {
            return res.status(404).json({ message: "Job not found." });
        }
        const student = await Student.findById(req.user.id);
        res.json(checkEligibility(student, job));
    } catch (error) {
        console.error("Eligibility error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// GET /api/jobs/:id/applications   (recruiter: applicants with eligibility)
router.get("/:id/applications", verifyToken, requireRole("recruiter"), async (req, res) => {
    try {
        const job = await Job.findById(Number(req.params.id));
        if (!job || job.company_id !== req.user.id) {
            return res.status(404).json({ message: "Job not found." });
        }
        const applicants = await Application.findByJob(job.id);
        const result = applicants.map(function (a) {
            const reasons = criteriaReasons(a, job);
            return { ...a, meets_criteria: reasons.length === 0, reasons: reasons };
        });
        res.json(result);
    } catch (error) {
        console.error("Applicants error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

module.exports = router;