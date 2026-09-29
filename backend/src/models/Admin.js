const db = require("../db/connection");

const Admin = {
    async findByUsername(username) {
        const [rows] = await db.query("SELECT * FROM admins WHERE username = ?", [username]);
        return rows[0] || null;
    }
};

module.exports = Admin;