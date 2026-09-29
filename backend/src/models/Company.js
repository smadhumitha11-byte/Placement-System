const db = require("../db/connection");

const Company = {
    async create(company) {
        const [result] = await db.query(
            `INSERT INTO companies (company_name, email, password, phone, website, description)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [company.company_name, company.email, company.password,
             company.phone, company.website, company.description]
        );
        return result.insertId;
    },

    // Includes the password hash. Only use this for login checks.
    async findByEmail(email) {
        const [rows] = await db.query("SELECT * FROM companies WHERE email = ?", [email]);
        return rows[0] || null;
    },

    async findById(id) {
        const [rows] = await db.query(
            `SELECT id, company_name, email, phone, website, description
             FROM companies WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    async updateProfile(id, data) {
        const [result] = await db.query(
            `UPDATE companies
             SET company_name = ?, phone = ?, website = ?, description = ?
             WHERE id = ?`,
            [data.company_name, data.phone, data.website, data.description, id]
        );
        return result.affectedRows;
    }
};

module.exports = Company;