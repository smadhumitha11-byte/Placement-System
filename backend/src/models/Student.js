const db = require("../db/connection");

const Student = {
    create: async (student) => {
        const sql = `
            INSERT INTO students
            (name, roll_no, email, phone, department, year, cgpa, password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.execute(sql, [
            student.name,
            student.rollNo,
            student.email,
            student.phone,
            student.department,
            student.year || null,
            student.cgpa,
            student.password
        ]);

        return result;
    },

    findByEmail: async (email) => {
        const [rows] = await db.execute(
            "SELECT * FROM students WHERE email = ?",
            [email]
        );

        return rows[0];
    }
};

module.exports = Student;