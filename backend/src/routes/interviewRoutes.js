const express = require("express");
const Application = require("../models/Application");
const Interview = require("../models/Interview");
const Notification = require("../models/Notification");
const { verifyToken, requireRole } = require("../middleware/auth");

const router = express.Router();

const ALLOWED_DURATIONS = [30, 45, 60];

// "2026-10-20T10:30" -> a Date in server local time, or null if the text is not a real date and time
function parseLocal(text) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(text);
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
    if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 ||
        d.getDate() !== +m[3] || d.getHours() !== +m[4]) {
        return null;
    }
    return d;
}

// Date -> "2026-10-20 10:30:00" (MySQL format)
function toMysql(d) {
    const p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " +
           p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
}

// POST /api/interviews   (recruiter)
// body: { application_id, interview_date: "2026-10-20T10:30", duration_minutes: 30|45|60,
//         mode, location_or_link }
router.post("/", verifyToken, requireRole("recruiter"), async (req, res) => {
    try {
        const { interview_date, mode, location_or_link } = req.body;
        const applicationId = Number(req.body.application_id);
        const duration = (req.body.duration_minutes === undefined || req.body.duration_minutes === null ||
                          req.body.duration_minutes === "") ? 60 : Number(req.body.duration_minutes);

        if (!Number.isInteger(applicationId) || applicationId < 1) {
            return res.status(400).json({ message: "A valid application_id is required." });
        }
        if (!["Online", "Offline"].includes(mode)) {
            return res.status(400).json({ message: "Mode must be Online or Offline." });
        }
        if (typeof location_or_link !== "string" || location_or_link.trim() === "" || location_or_link.length > 255) {
            return res.status(400).json({ message: "Enter the interview link or location." });
        }
        if (!ALLOWED_DURATIONS.includes(duration)) {
            return res.status(400).json({ message: "Duration must be 30, 45, or 60 minutes." });
        }
        const start = typeof interview_date === "string" ? parseLocal(interview_date) : null;
        if (!start) {
            return res.status(400).json({ message: "Choose a valid date and time." });
        }
        if (start <= new Date()) {
            return res.status(400).json({ message: "Interview date must be in the future." });
        }

        const application = await Application.findForCompany(applicationId, req.user.id);
        if (!application) {
            return res.status(404).json({ message: "Application not found." });
        }
        if (application.status !== "Shortlisted") {
            return res.status(400).json({ message: "Only shortlisted candidates can be scheduled." });
        }

        // The end time is calculated, never typed by the recruiter
        const end = new Date(start.getTime() + duration * 60000);
        const startText = toMysql(start);
        const endText = toMysql(end);

        if (await Interview.hasScheduled(applicationId)) {
            return res.status(409).json({ message: "An interview is already scheduled for this application." });
        }
        if (await Interview.hasStudentConflict(application.student_id, startText, endText)) {
            return res.status(409).json({ message: "Student already has another interview scheduled during this time." });
        }
        if (await Interview.hasCompanyConflict(req.user.id, startText, endText)) {
            return res.status(409).json({ message: "Company already has another interview scheduled during this time." });
        }

        const id = await Interview.create({
            application_id: applicationId,
            interview_date: startText,
            end_time: endText,
            mode: mode,
            location_or_link: location_or_link.trim()
        });

        await Notification.create(
            application.student_id,
            "Interview scheduled for " + application.title + " on " + startText.slice(0, 10) +
            " from " + startText.slice(11, 16) + " to " + endText.slice(11, 16) +
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