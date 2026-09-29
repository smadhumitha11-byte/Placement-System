const db = require("../db/connection");

const Application = {
    async create(studentId, jobId) {
        const [result] = await db.query(
            "INSERT INTO applications (student_id, job_id) VALUES (?, ?)",
            [studentId, jobId]
        );
        return result.insertId;
    },

    // A student's own applications
    async findByStudent(studentId) {
        const [rows] = await db.query(
            `SELECT a.id, a.status, a.applied_at, j.id AS job_id, j.title, j.location,
                    j.package_lpa, c.company_name
             FROM applications a
             JOIN jobs j ON j.id = a.job_id
             JOIN companies c ON c.id = j.company_id
             WHERE a.student_id = ?
             ORDER BY a.applied_at DESC`,
            [studentId]
        );
        return rows;
    },

    // Applicants of one job (recruiter view)
    async findByJob(jobId) {
        const [rows] = await db.query(
            `SELECT a.id, a.status, a.applied_at, s.id AS student_id, s.name, s.roll_no,
                    s.email, s.phone, s.department, s.year, s.cgpa, s.resume_path
             FROM applications a JOIN students s ON s.id = a.student_id
             WHERE a.job_id = ?
             ORDER BY a.applied_at`,
            [jobId]
        );
        return rows;
    },

    // An application, but only if the job belongs to this company
    async findForCompany(id, companyId) {
        const [rows] = await db.query(
            `SELECT a.id, a.status, a.student_id, j.title, j.package_lpa
             FROM applications a JOIN jobs j ON j.id = a.job_id
             WHERE a.id = ? AND j.company_id = ?`,
            [id, companyId]
        );
        return rows[0] || null;
    },

    // An application, but only if it belongs to this student
    async findForStudent(id, studentId) {
        const [rows] = await db.query(
            `SELECT a.id, a.status, j.title
             FROM applications a JOIN jobs j ON j.id = a.job_id
             WHERE a.id = ? AND a.student_id = ?`,
            [id, studentId]
        );
        return rows[0] || null;
    },

    async updateStatus(id, status) {
        await db.query("UPDATE applications SET status = ? WHERE id = ?", [status, id]);
    },

    async createPlacement(record) {
        await db.query(
            `INSERT INTO placement_records (application_id, student_id, company_id, package_lpa, placed_on)
             VALUES (?, ?, ?, ?, CURDATE())`,
            [record.application_id, record.student_id, record.company_id, record.package_lpa]
        );
    },

    async placementsByStudent(studentId) {
        const [rows] = await db.query(
            `SELECT p.id, p.package_lpa, p.placed_on, c.company_name, j.title
             FROM placement_records p
             JOIN companies c ON c.id = p.company_id
             JOIN applications a ON a.id = p.application_id
             JOIN jobs j ON j.id = a.job_id
             WHERE p.student_id = ?`,
            [studentId]
        );
        return rows;
    }
};

module.exports = Application;