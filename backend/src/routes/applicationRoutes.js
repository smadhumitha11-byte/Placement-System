const express = require("express");
const Job = require("../models/Job");
const Student = require("../models/Student");
const Application = require("../models/Application");
const Notification = require("../models/Notification");
const { checkEligibility } = require("../utils/eligibility");
const { verifyToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// The changes a recruiter is allowed to make: current status -> possible next statuses
const RECRUITER_MOVES = {
    Applied: ["Shortlisted", "Rejected"],
    Shortlisted: ["Selected", "Rejected"]
};

// POST /api/applications   body: { job_id }
router.post("/", verifyToken, requireRole("student"), async (req, res) => {
    try {
        const jobId = Number(req.body.job_id);
        if (!Number.isInteger(jobId) || jobId < 1) {
            return res.status(400).json({ message: "A valid job_id is required." });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found." });
        }

        const student = await Student.findById(req.user.id);
        const result = checkEligibility(student, job);
        if (!result.eligible) {
            return res.status(400).json({ message: "Not eligible: " + result.reasons.join(" ") });
        }

        const id = await Application.create(req.user.id, jobId);
        res.status(201).json({ message: "Application submitted.", id: id });
    } catch (error) {
        // The UNIQUE (student_id, job_id) rule in the database blocks duplicates
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "You have already applied for this job." });
        }
        console.error("Apply error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// GET /api/applications/my   (student)
router.get("/my", verifyToken, requireRole("student"), async (req, res) => {
    try {
        res.json(await Application.findByStudent(req.user.id));
    } catch (error) {
        console.error("My applications error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// GET /api/applications/placement   (student: placement status)
router.get("/placement", verifyToken, requireRole("student"), async (req, res) => {
    try {
        const records = await Application.placementsByStudent(req.user.id);
        res.json({ placed: records.length > 0, records: records });
    } catch (error) {
        console.error("Placement status error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// PUT /api/applications/:id/withdraw   (student)
router.put("/:id/withdraw", verifyToken, requireRole("student"), async (req, res) => {
    try {
        const application = await Application.findForStudent(Number(req.params.id), req.user.id);
        if (!application) {
            return res.status(404).json({ message: "Application not found." });
        }
        if (!["Applied", "Shortlisted"].includes(application.status)) {
            return res.status(400).json({ message: "You cannot withdraw a " + application.status + " application." });
        }
        await Application.updateStatus(application.id, "Withdrawn");
        res.json({ message: "Application withdrawn." });
    } catch (error) {
        console.error("Withdraw error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// PUT /api/applications/:id/status   body: { status }   (recruiter)
router.put("/:id/status", verifyToken, requireRole("recruiter"), async (req, res) => {
    try {
        const newStatus = req.body.status;
        const application = await Application.findForCompany(Number(req.params.id), req.user.id);
        if (!application) {
            return res.status(404).json({ message: "Application not found." });
        }

        const allowed = RECRUITER_MOVES[application.status] || [];
        if (!allowed.includes(newStatus)) {
            return res.status(400).json({
                message: "Cannot change status from " + application.status + " to " + newStatus + "."
            });
        }

        await Application.updateStatus(application.id, newStatus);

        // A selected student gets a placement record
        if (newStatus === "Selected") {
            await Application.createPlacement({
                application_id: application.id,
                student_id: application.student_id,
                company_id: req.user.id,
                package_lpa: application.package_lpa
            });
        }

        await Notification.create(
            application.student_id,
            "Your application for " + application.title + " is now " + newStatus + "."
        );

        res.json({ message: "Status updated to " + newStatus + "." });
    } catch (error) {
        console.error("Update status error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

module.exports = router;