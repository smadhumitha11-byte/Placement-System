const db = require("../db/connection");

const Notification = {
    async create(studentId, message) {
        await db.query(
            "INSERT INTO notifications (student_id, message) VALUES (?, ?)",
            [studentId, message]
        );
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