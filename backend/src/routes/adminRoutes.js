const express = require("express");
const Report = require("../models/Report");
const { verifyToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Every route in this file needs a logged-in admin
router.use(verifyToken, requireRole("admin"));

// Wraps a handler so we don't repeat try/catch in every route
function handle(name, action) {
    return async function (req, res) {
        try {
            await action(req, res);
        } catch (error) {
            console.error(name + " error:", error);
            res.status(500).json({ message: "Server error. Please try again." });
        }
    };
}

// Turns the id in the address into a number, or null if it is not valid
function idFrom(req) {
    const id = Number(req.params.id);
    return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/admin/dashboard
router.get("/dashboard", handle("Dashboard", async (req, res) => {
    res.json(await Report.counts());
}));

// GET /api/admin/students?search=text
router.get("/students", handle("Admin students", async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 50) : "";
    res.json(await Report.students(search));
}));

// DELETE /api/admin/students/:id
router.delete("/students/:id", handle("Delete student", async (req, res) => {
    const id = idFrom(req);
    if (!id) return res.status(400).json({ message: "Invalid id." });
    const changed = await Report.deleteStudent(id);
    if (changed === 0) return res.status(404).json({ message: "Student not found." });
    res.json({ message: "Student deleted." });
}));

// GET /api/admin/companies
router.get("/companies", handle("Admin companies", async (req, res) => {
    res.json(await Report.companies());
}));

// DELETE /api/admin/companies/:id
router.delete("/companies/:id", handle("Delete company", async (req, res) => {
    const id = idFrom(req);
    if (!id) return res.status(400).json({ message: "Invalid id." });
    const changed = await Report.deleteCompany(id);
    if (changed === 0) return res.status(404).json({ message: "Company not found." });
    res.json({ message: "Company deleted." });
}));

// GET /api/admin/jobs
router.get("/jobs", handle("Admin jobs", async (req, res) => {
    res.json(await Report.jobs());
}));

// PUT /api/admin/jobs/:id/status   body: { status: "Open" | "Closed" }
router.put("/jobs/:id/status", handle("Admin job status", async (req, res) => {
    const id = idFrom(req);
    if (!id) return res.status(400).json({ message: "Invalid id." });
    if (!["Open", "Closed"].includes(req.body.status)) {
        return res.status(400).json({ message: "Status must be Open or Closed." });
    }
    const changed = await Report.setJobStatus(id, req.body.status);
    if (changed === 0) return res.status(404).json({ message: "Job not found." });
    res.json({ message: "Job marked " + req.body.status + "." });
}));

// DELETE /api/admin/jobs/:id
router.delete("/jobs/:id", handle("Admin delete job", async (req, res) => {
    const id = idFrom(req);
    if (!id) return res.status(400).json({ message: "Invalid id." });
    const changed = await Report.deleteJob(id);
    if (changed === 0) return res.status(404).json({ message: "Job not found." });
    res.json({ message: "Job deleted." });
}));

// GET /api/admin/applications
router.get("/applications", handle("Admin applications", async (req, res) => {
    res.json(await Report.applications());
}));

// GET /api/admin/interviews
router.get("/interviews", handle("Admin interviews", async (req, res) => {
    res.json(await Report.interviews());
}));

// GET /api/admin/records   (recruitment / placement records)
router.get("/records", handle("Admin records", async (req, res) => {
    res.json(await Report.records());
}));

// GET /api/admin/reports
router.get("/reports", handle("Admin reports", async (req, res) => {
    const counts = await Report.counts();
    const stats = await Report.packageStats();

    const placementPercentage = counts.students === 0
        ? 0
        : Math.round((counts.placed_students / counts.students) * 1000) / 10;

    res.json({
        total_students: counts.students,
        placed_students: counts.placed_students,
        placement_percentage: placementPercentage,
        highest_package: stats.highest_package,
        average_package: stats.average_package === null ? null : Math.round(stats.average_package * 100) / 100,
        by_department: await Report.byDepartment(),
        by_company: await Report.byCompany()
    });
}));

module.exports = router;