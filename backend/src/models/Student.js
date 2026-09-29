const db = require("../db/connection");

// All SQL for the students table lives here.
// The ? marks are placeholders: MySQL inserts the values safely,
// which protects against SQL injection.
const Student = {
    async create(student) {
        const [result] = await db.query(
            `INSERT INTO students (name, roll_no, email, phone, department, year, cgpa, password)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [student.name, student.roll_no, student.email, student.phone,
             student.department, student.year, student.cgpa, student.password]
        );
        return result.insertId;
    },

    // Includes the password hash. Only use this for login checks.
    async findByEmail(email) {
        const [rows] = await db.query("SELECT * FROM students WHERE email = ?", [email]);
        return rows[0] || null;
    },

    // Never returns the password.
    async findById(id) {
        const [rows] = await db.query(
            `SELECT id, name, roll_no, email, phone, department, year, cgpa, resume_path
             FROM students WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    async updateProfile(id, data) {
        const [result] = await db.query(
            `UPDATE students
             SET name = ?, phone = ?, department = ?, year = ?, cgpa = ?
             WHERE id = ?`,
            [data.name, data.phone, data.department, data.year, data.cgpa, id]
        );
        return result.affectedRows;
    },

    async setResume(id, fileName) {
        await db.query("UPDATE students SET resume_path = ? WHERE id = ?", [fileName, id]);
    }
};

module.exports = Student;