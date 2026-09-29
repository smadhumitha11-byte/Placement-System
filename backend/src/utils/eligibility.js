// Today's date as text, e.g. "2026-09-29"
function todayString() {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + month + "-" + day;
}

// Checks only the student's CGPA and department against the job.
// Returns a list of reasons (empty list = the student meets the criteria).
function criteriaReasons(student, job) {
    const reasons = [];

    if (Number(student.cgpa) < Number(job.min_cgpa)) {
        reasons.push("Minimum CGPA is " + job.min_cgpa + " (yours is " + student.cgpa + ").");
    }

    const allowed = job.allowed_departments.split(",").map(function (d) {
        return d.trim().toUpperCase();
    });
    if (!allowed.includes("ALL") && !allowed.includes(String(student.department).toUpperCase())) {
        reasons.push("Your department (" + student.department + ") is not eligible.");
    }
    return reasons;
}

// Full check used before applying: job open, deadline, CGPA, department.
function checkEligibility(student, job) {
    const reasons = [];

    if (job.status !== "Open") {
        reasons.push("This job is closed.");
    }
    if (job.deadline && job.deadline < todayString()) {
        reasons.push("The application deadline has passed.");
    }
    reasons.push(...criteriaReasons(student, job));

    return { eligible: reasons.length === 0, reasons: reasons };
}

module.exports = { checkEligibility, criteriaReasons };