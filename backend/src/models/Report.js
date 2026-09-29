const db = require("../db/connection");

const Report = {
    // Numbers for the dashboard cards
    async counts() {
        const [rows] = await db.query(
            `SELECT
                (SELECT COUNT(*) FROM students) AS students,
                (SELECT COUNT(*) FROM companies) AS companies,
                (SELECT COUNT(*) FROM jobs) AS jobs,
                (SELECT COUNT(*) FROM applications) AS applications,
                (SELECT COUNT(*) FROM interviews) AS interviews,
                (SELECT COUNT(DISTINCT student_id) FROM placement_records) AS placed_students`
        );
        return rows[0];
    },

    async students(search) {
        let sql = `SELECT s.id, s.name, s.roll_no, s.email, s.phone, s.department, s.year, s.cgpa,
                          s.resume_path,
                          (SELECT COUNT(*) FROM placement_records p WHERE p.student_id = s.id) AS placed
                   FROM students s`;
        const params = [];
        if (search) {
            sql += " WHERE s.name LIKE ? OR s.roll_no LIKE ? OR s.email LIKE ? OR s.department LIKE ?";
            const like = "%" + search + "%";
            params.push(like, like, like, like);
        }
        sql += " ORDER BY s.name";
        const [rows] = await db.query(sql, params);
        return rows;
    },

    async deleteStudent(id) {
        const [result] = await db.query("DELETE FROM students WHERE id = ?", [id]);
        return result.affectedRows;
    },

    async companies() {
        const [rows] = await db.query(
            `SELECT c.id, c.company_name, c.email, c.phone, c.website, c.created_at,
                    (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id) AS job_count
             FROM companies c ORDER BY c.company_name`
        );
        return rows;
    },

    async deleteCompany(id) {
        const [result] = await db.query("DELETE FROM companies WHERE id = ?", [id]);
        return result.affectedRows;
    },

    async jobs() {
        const [rows] = await db.query(
            `SELECT j.id, j.title, j.location, j.package_lpa, j.min_cgpa, j.allowed_departments,
                    j.deadline, j.status, c.company_name,
                    (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applicant_count
             FROM jobs j JOIN companies c ON c.id = j.company_id
             ORDER BY j.created_at DESC`
        );
        return rows;
    },

    async setJobStatus(id, status) {
        const [result] = await db.query("UPDATE jobs SET status = ? WHERE id = ?", [status, id]);
        return result.affectedRows;
    },

    async deleteJob(id) {
        const [result] = await db.query("DELETE FROM jobs WHERE id = ?", [id]);
        return result.affectedRows;
    },

    async applications() {
        const [rows] = await db.query(
            `SELECT a.id, a.status, a.applied_at, s.name AS student_name, s.roll_no,
                    j.title, c.company_name
             FROM applications a
             JOIN students s ON s.id = a.student_id
             JOIN jobs j ON j.id = a.job_id
             JOIN companies c ON c.id = j.company_id
             ORDER BY a.applied_at DESC`
        );
        return rows;
    },

    async interviews() {
        const [rows] = await db.query(
            `SELECT i.id, i.interview_date, i.mode, i.location_or_link, i.status,
                    s.name AS student_name, s.roll_no, j.title, c.company_name
             FROM interviews i
             JOIN applications a ON a.id = i.application_id
             JOIN students s ON s.id = a.student_id
             JOIN jobs j ON j.id = a.job_id
             JOIN companies c ON c.id = j.company_id
             ORDER BY i.interview_date DESC`
        );
        return rows;
    },

    // Recruitment records = final placements
    async records() {
        const [rows] = await db.query(
            `SELECT p.id, p.package_lpa, p.placed_on, s.name AS student_name, s.roll_no,
                    s.department, c.company_name, j.title
             FROM placement_records p
             JOIN students s ON s.id = p.student_id
             JOIN companies c ON c.id = p.company_id
             JOIN applications a ON a.id = p.application_id
             JOIN jobs j ON j.id = a.job_id
             ORDER BY p.placed_on DESC, p.id DESC`
        );
        return rows;
    },

    async byDepartment() {
        const [rows] = await db.query(
            `SELECT s.department, COUNT(DISTINCT s.id) AS total_students,
                    COUNT(DISTINCT p.student_id) AS placed_students
             FROM students s LEFT JOIN placement_records p ON p.student_id = s.id
             GROUP BY s.department ORDER BY s.department`
        );
        return rows;
    },

    async byCompany() {
        const [rows] = await db.query(
            `SELECT c.company_name, COUNT(p.id) AS placed_students, AVG(p.package_lpa) AS average_package
             FROM companies c LEFT JOIN placement_records p ON p.company_id = c.id
             GROUP BY c.id, c.company_name ORDER BY placed_students DESC, c.company_name`
        );
        return rows;
    },

    async packageStats() {
        const [rows] = await db.query(
            "SELECT MAX(package_lpa) AS highest_package, AVG(package_lpa) AS average_package FROM placement_records"
        );
        return rows[0];
    }
};

module.exports = Report;