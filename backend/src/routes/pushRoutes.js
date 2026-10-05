const express = require("express");
const PushSubscription = require("../models/PushSubscription");
const { verifyToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/push/key   (student) gives the browser the public key
router.get("/key", verifyToken, requireRole("student"), (req, res) => {
    if (!process.env.VAPID_PUBLIC_KEY) {
        return res.status(503).json({ message: "Push notifications are not set up on the server." });
    }
    res.json({ key: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe   (student) body: the browser subscription
router.post("/subscribe", verifyToken, requireRole("student"), async (req, res) => {
    try {
        const sub = req.body;
        if (!sub || typeof sub.endpoint !== "string" || sub.endpoint.length > 500 ||
            !sub.keys || typeof sub.keys.p256dh !== "string" || typeof sub.keys.auth !== "string") {
            return res.status(400).json({ message: "Invalid subscription." });
        }
        await PushSubscription.save(req.user.id, sub);
        res.status(201).json({ message: "Notifications enabled on this browser." });
    } catch (error) {
        console.error("Subscribe error:", error);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

module.exports = router;