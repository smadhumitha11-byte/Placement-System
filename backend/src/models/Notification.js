const db = require("../db/connection");
const { sendToStudent } = require("../utils/push");

const Notification = {
    async create(studentId, message) {
        await db.query(
            "INSERT INTO notifications (student_id, message) VALUES (?, ?)",
            [studentId, message]
        );
        // Push is a bonus: if it fails, the saved notification still exists
        sendToStudent(studentId, message).catch(function (error) {
            console.error("Push failed:", error.message);
        });
    },

    async findByStudent(studentId) {
        const [rows] = await db.query(
            `SELECT id, message, is_read, created_at
             FROM notifications WHERE student_id = ?
             ORDER BY created_at DESC, id DESC LIMIT 50`,
            [studentId]
        );
        return rows;
    },

    async markAllRead(studentId) {
        await db.query("UPDATE notifications SET is_read = TRUE WHERE student_id = ?", [studentId]);
    }
};

module.exports = Notification;