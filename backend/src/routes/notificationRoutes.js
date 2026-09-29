const express = require("express");
const Notification = require("../models/Notification");
const { verifyToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/notifications   (student)
router.get("/", verifyToken, requireRole("student"), async (req, res) => {
    try {
        res.json(await Notification.findByStudent(req.user.id));
    } catch (error) {
        console.error("Notifications error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

// PUT /api/notifications/read-all   (student)
router.put("/read-all", verifyToken, requireRole("student"), async (req, res) => {
    try {
        await Notification.markAllRead(req.user.id);
        res.json({ message: "All notifications marked as read." });
    } catch (error) {
        console.error("Mark read error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

module.exports = router;