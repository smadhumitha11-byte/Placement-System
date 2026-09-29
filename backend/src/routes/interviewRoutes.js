const express = require("express");
const Application = require("../models/Application");
const Interview = require("../models/Interview");
const Notification = require("../models/Notification");
const { verifyToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// POST /api/interviews   (recruiter)
// body: { application_id, interview_date: "2026-10-05T10:30", mode, location_or_link }
router.post("/", verifyToken, requireRole("recruiter"), async (req, res) => {
    try {
        const { interview_date, mode, location_or_link } = req.body;
        const applicationId = Number(req.body.application_id);

        if (!Number.isInteger(applicationId) || applicationId < 1) {
            return res.status(400).json({ message: "A valid application_id is required." });
        }
        if (!["Online", "Offline"].includes(mode)) {
            return res.status(400).json({ message: "Mode must be Online or Offline." });
        }
        if (typeof location_or_link !== "string" || location_or_link.trim() === "" || location_or_link.length > 255) {
            return res.status(400).json({ message: "Enter the interview link or location." });
        }
        if (typeof interview_date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(interview_date) ||
            isNaN(new Date(interview_date)) || new Date(interview_date) <= new Date()) {
            return res.status(400).json({ message: "Choose a valid date and time in the future." });
        }

        const application = await Application.findForCompany(applicationId, req.user.id);
        if (!application) {
            return res.status(404).json({ message: "Application not found." });
        }
        if (application.status !== "Shortlisted") {
            return res.status(400).json({ message: "Only shortlisted candidates can be scheduled." });
        }
        if (await Interview.hasScheduled(applicationId)) {
            return res.status(409).json({ message: "This candidate already has a scheduled interview." });
        }

        // "2026-10-05T10:30" -> "2026-10-05 10:30:00" (MySQL format)
        let mysqlDate = interview_date.replace("T", " ");
        if (mysqlDate.length === 16) {
            mysqlDate += ":00";
        }

        const id = await Interview.create({
            application_id: applicationId,
            interview_date: mysqlDate,
            mode: mode,
            location_or_link: location_or_link.trim()
        });

        await Notification.create(
            application.student_id,
            "Interview scheduled for " + application.title + " on " + mysqlDate.slice(0, 16) +
            " (" + mode + ": " + location_or_link.trim() + ")."
        );

        res.status(201).json({ message: "Interview scheduled.", id: id });
    } catch (error) {
        console.error("Schedule interview error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// PUT /api/interviews/:id/status   body: { status: "Completed" | "Cancelled" }   (recruiter)
router.put("/:id/status", verifyToken, requireRole("recruiter"), async (req, res) => {
    try {
        const newStatus = req.body.status;
        if (!["Completed", "Cancelled"].includes(newStatus)) {
            return res.status(400).json({ message: "Status must be Completed or Cancelled." });
        }

        const interview = await Interview.findForCompany(Number(req.params.id), req.user.id);
        if (!interview) {
            return res.status(404).json({ message: "Interview not found." });
        }
        if (interview.status !== "Scheduled") {
            return res.status(400).json({ message: "Only a scheduled interview can be changed." });
        }

        await Interview.updateStatus(interview.id, newStatus);
        await Notification.create(
            interview.student_id,
            "Your interview for " + interview.title + " was marked " + newStatus + "."
        );

        res.json({ message: "Interview marked " + newStatus + "." });
    } catch (error) {
        console.error("Interview status error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// GET /api/interviews/my   (student)
router.get("/my", verifyToken, requireRole("student"), async (req, res) => {
    try {
        res.json(await Interview.findByStudent(req.user.id));
    } catch (error) {
        console.error("My interviews error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// GET /api/interviews/company   (recruiter)
router.get("/company", verifyToken, requireRole("recruiter"), async (req, res) => {
    try {
        res.json(await Interview.findByCompany(req.user.id));
    } catch (error) {
        console.error("Company interviews error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

module.exports = router;