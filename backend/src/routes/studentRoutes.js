const express = require("express");
const Student = require("../models/Student");

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const student = await Student.create(req.body);

        res.status(201).json({
            message: "Student registered successfully",
            studentId: student.insertId
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
                message: "Email or roll number already exists"
            });
        }

        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
});

router.get("/:email", async (req, res) => {
    try {
        const student = await Student.findByEmail(req.params.email);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        res.json(student);
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving student",
            error: error.message
        });
    }
});

module.exports = router;