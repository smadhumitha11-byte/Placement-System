const db = require("../db/connection");

const Job = {
    async create(companyId, job) {
        const [result] = await db.query(
            `INSERT INTO jobs (company_id, title, description, location, package_lpa,
                               min_cgpa, allowed_departments, deadline)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [companyId, job.title, job.description, job.location, job.package_lpa,
             job.min_cgpa, job.allowed_departments, job.deadline]
        );
        return result.insertId;
    },

    async findById(id) {
        const [rows] = await db.query(
            `SELECT j.*, c.company_name
             FROM jobs j JOIN companies c ON c.id = j.company_id
             WHERE j.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    // Open jobs whose deadline has not passed. "search" is optional.
    async findOpen(search) {
        let sql = `SELECT j.id, j.title, j.description, j.location, j.package_lpa, j.min_cgpa,
                          j.allowed_departments, j.deadline, j.status, c.company_name
                   FROM jobs j JOIN companies c ON c.id = j.company_id
                   WHERE j.status = 'Open' AND (j.deadline IS NULL OR j.deadline >= CURDATE())`;
        const params = [];
        if (search) {
            sql += " AND (j.title LIKE ? OR c.company_name LIKE ? OR j.location LIKE ?)";
            const like = "%" + search + "%";
            params.push(like, like, like);
        }
        sql += " ORDER BY j.created_at DESC";
        const [rows] = await db.query(sql, params);
        return rows;
    },

    // All jobs of one company, with the number of applicants
    async findByCompany(companyId) {
        const [rows] = await db.query(
            `SELECT j.*, COUNT(a.id) AS applicant_count
             FROM jobs j LEFT JOIN applications a ON a.job_id = j.id
             WHERE j.company_id = ?
             GROUP BY j.id
             ORDER BY j.created_at DESC`,
            [companyId]
        );
        return rows;
    },

    // "AND company_id = ?" makes sure a company can only change its own jobs
    async update(id, companyId, job) {
        const [result] = await db.query(
            `UPDATE jobs
             SET title = ?, description = ?, location = ?, package_lpa = ?, min_cgpa = ?,
                 allowed_departments = ?, deadline = ?, status = ?
             WHERE id = ? AND company_id = ?`,
            [job.title, job.description, job.location, job.package_lpa, job.min_cgpa,
             job.allowed_departments, job.deadline, job.status, id, companyId]
        );
        return result.affectedRows;
    },

    async remove(id, companyId) {
        const [result] = await db.query(
            "DELETE FROM jobs WHERE id = ? AND company_id = ?",
            [id, companyId]
        );
        return result.affectedRows;
    }
};

module.exports = Job;