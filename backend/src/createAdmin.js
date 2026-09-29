const bcrypt = require("bcrypt");
const db = require("./db/connection");

async function main() {
    const username = process.argv[2];
    const password = process.argv[3];

    if (!username || !password || password.length < 8) {
        console.log("Usage: node src/createAdmin.js <username> <password>");
        console.log("The password must be at least 8 characters.");
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
        "INSERT INTO admins (username, password) VALUES (?, ?)",
        [username, hashedPassword]
    );

    console.log("Admin created: " + username);
    process.exit(0);
}

main().catch((error) => {
    console.error("Could not create admin:", error.message);
    process.exit(1);
});