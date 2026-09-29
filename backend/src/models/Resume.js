const db = require("../db/connection");

const Resume = {
    // Returns the resume file name, but only if the application belongs
    // to a job of this company. Otherwise returns null.
    async findForCompany(applicationId, companyId) {
        const [rows] = await db.query(
            `SELECT s.resume_path
             FROM applications a
             JOIN students s ON s.id = a.student_id
             JOIN jobs j ON j.id = a.job_id
             WHERE a.id = ? AND j.company_id = ?`,
            [applicationId, companyId]
        );
        return rows[0] ? rows[0].resume_path : null;
    }
};

module.exports = Resume;