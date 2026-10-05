const db = require("../db/connection");

const PushSubscription = {
    // Saves a browser subscription. If it already exists, it is updated.
    async save(studentId, sub) {
        await db.query(
            `INSERT INTO push_subscriptions (student_id, endpoint, p256dh, auth)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE student_id = VALUES(student_id),
                                     p256dh = VALUES(p256dh), auth = VALUES(auth)`,
            [studentId, sub.endpoint, sub.keys.p256dh, sub.keys.auth]
        );
    },

    async findByStudent(studentId) {
        const [rows] = await db.query(
            "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE student_id = ?",
            [studentId]
        );
        return rows;
    },

    async removeByEndpoint(endpoint) {
        await db.query("DELETE FROM push_subscriptions WHERE endpoint = ?", [endpoint]);
    }
};

module.exports = PushSubscription;