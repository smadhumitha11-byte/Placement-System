const db = require("../db/connection");

// If an old row has no end_time, it is treated as a 60 minute interview.
const END = "COALESCE(i.end_time, DATE_ADD(i.interview_date, INTERVAL 60 MINUTE))";

const Interview = {
    async create(data) {
        const [result] = await db.query(
            `INSERT INTO interviews (application_id, interview_date, end_time, mode, location_or_link)
             VALUES (?, ?, ?, ?, ?)`,
            [data.application_id, data.interview_date, data.end_time, data.mode, data.location_or_link]
        );
        return result.insertId;
    },

    // True if this application already has a Scheduled interview
    async hasScheduled(applicationId) {
        const [rows] = await db.query(
            "SELECT id FROM interviews WHERE application_id = ? AND status = 'Scheduled'",
            [applicationId]
        );
        return rows.length > 0;
    },

    // Overlap rule: new_start < existing_end AND new_end > existing_start
    // CHECK 1: the same student already has a Scheduled interview in this time range
    async hasStudentConflict(studentId, start, end) {
        const [rows] = await db.query(
            `SELECT i.id
             FROM interviews i
             JOIN applications a ON a.id = i.application_id
             WHERE a.student_id = ? AND i.status = 'Scheduled'
               AND ? < ${END} AND ? > i.interview_date
             LIMIT 1`,
            [studentId, start, end]
        );
        return rows.length > 0;
    },

    // CHECK 2: the same company already has a Scheduled interview in this time range
    async hasCompanyConflict(companyId, start, end) {
        const [rows] = await db.query(
            `SELECT i.id
             FROM interviews i
             JOIN applications a ON a.id = i.application_id
             JOIN jobs j ON j.id = a.job_id
             WHERE j.company_id = ? AND i.status = 'Scheduled'
               AND ? < ${END} AND ? > i.interview_date
             LIMIT 1`,
            [companyId, start, end]
        );
        return rows.length > 0;
    },

    async findForCompany(id, companyId) {
        const [rows] = await db.query(
            `SELECT i.id, i.status, a.student_id, j.title
             FROM interviews i
             JOIN applications a ON a.id = i.application_id
             JOIN jobs j ON j.id = a.job_id
             WHERE i.id = ? AND j.company_id = ?`,
            [id, companyId]
        );
        return rows[0] || null;
    },

    async updateStatus(id, status) {
        await db.query("UPDATE interviews SET status = ? WHERE id = ?", [status, id]);
    },

    async findByStudent(studentId) {
        const [rows] = await db.query(
            `SELECT i.id, i.application_id, i.interview_date,
                    ${END} AS end_time,
                    TIMESTAMPDIFF(MINUTE, i.interview_date, ${END}) AS duration_minutes,
                    i.mode, i.location_or_link, i.status,
                    j.title, c.company_name
             FROM interviews i
             JOIN applications a ON a.id = i.application_id
             JOIN jobs j ON j.id = a.job_id
             JOIN companies c ON c.id = j.company_id
             WHERE a.student_id = ?
             ORDER BY i.interview_date`,
            [studentId]
        );
        return rows;
    },

    async findByCompany(companyId) {
        const [rows] = await db.query(
            `SELECT i.id, i.application_id, i.interview_date,
                    ${END} AS end_time,
                    TIMESTAMPDIFF(MINUTE, i.interview_date, ${END}) AS duration_minutes,
                    i.mode, i.location_or_link, i.status,
                    j.title, s.name AS student_name, s.roll_no
             FROM interviews i
             JOIN applications a ON a.id = i.application_id
             JOIN jobs j ON j.id = a.job_id
             JOIN students s ON s.id = a.student_id
             WHERE j.company_id = ?
             ORDER BY i.interview_date`,
            [companyId]
        );
        return rows;
    }
};

module.exports = Interview;