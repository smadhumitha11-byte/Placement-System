// Runs the full placement flow against the running server and prints PASS/FAIL per step.
// Usage (from the backend folder):  node src/smokeTest.js <adminUsername> <adminPassword>

const BASE = process.env.API_URL || "http://localhost:3000/api";
const adminUser = process.argv[2];
const adminPass = process.argv[3];

if (!adminUser || !adminPass) {
    console.log("Usage: node src/smokeTest.js <adminUsername> <adminPassword>");
    process.exit(1);
}

async function call(path, options = {}) {
    const headers = {};
    if (options.token) headers.Authorization = "Bearer " + options.token;
    let body;
    if (options.form) {
        body = options.form;
    } else if (options.body) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(options.body);
    }
    const res = await fetch(BASE + path, { method: options.method || "GET", headers, body });
    let data = {};
    try { data = await res.json(); } catch (e) { /* no JSON body */ }
    return { status: res.status, data };
}

const results = [];
async function step(scrum, label, fn) {
    let outcome;
    try {
        outcome = await fn();
    } catch (error) {
        outcome = "Exception: " + error.message;
    }
    const pass = outcome === true;
    results.push({ scrum, label, pass });
    console.log((pass ? "PASS  " : "FAIL  ") + scrum.padEnd(9) + label + (pass ? "" : "  -> " + outcome));
}
function expect(res, status, extra) {
    if (res.status !== status) return "expected " + status + " but got " + res.status + " " + JSON.stringify(res.data);
    if (extra && !extra(res.data)) return "unexpected response " + JSON.stringify(res.data);
    return true;
}

const stamp = Date.now();
const studentEmail = "test.student." + stamp + "@example.com";
const companyEmail = "test.company." + stamp + "@example.com";
const password = "TestPass123";
const ctx = {};

function pad(n) { return String(n).padStart(2, "0"); }
function dateAhead(days, withTime) {
    const d = new Date(Date.now() + days * 86400000);
    const day = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    return withTime ? day + "T10:30" : day;
}

async function main() {
    console.log("Testing " + BASE + "\n");

    await step("SCRUM-1", "Student registration", async () => {
        const r = await call("/students/register", { method: "POST", body: {
            name: "Test Student", roll_no: "T" + String(stamp).slice(-8), email: studentEmail,
            phone: "9876543210", department: "CSE", year: 3, cgpa: 8.5, password } });
        return expect(r, 201);
    });
    await step("SCRUM-1", "Student login", async () => {
        const r = await call("/auth/student/login", { method: "POST", body: { email: studentEmail, password } });
        ctx.student = r.data.token;
        return expect(r, 200, d => !!d.token);
    });
    await step("SCRUM-1", "Wrong password is rejected", async () => {
        const r = await call("/auth/student/login", { method: "POST", body: { email: studentEmail, password: "wrong-pass" } });
        return expect(r, 401);
    });
    await step("SCRUM-4", "Company registration", async () => {
        const r = await call("/companies/register", { method: "POST", body: {
            company_name: "Test Company " + stamp, email: companyEmail, phone: "9123456780", password } });
        return expect(r, 201);
    });
    await step("SCRUM-1", "Company login", async () => {
        const r = await call("/auth/company/login", { method: "POST", body: { email: companyEmail, password } });
        ctx.company = r.data.token;
        return expect(r, 200, d => !!d.token);
    });
    await step("SCRUM-1", "Admin login", async () => {
        const r = await call("/auth/admin/login", { method: "POST", body: { username: adminUser, password: adminPass } });
        ctx.admin = r.data.token;
        return expect(r, 200, d => !!d.token);
    });

    await step("SCRUM-2", "Student profile read and update", async () => {
        const g = await call("/students/profile", { token: ctx.student });
        if (g.status !== 200) return "read failed " + g.status;
        const u = await call("/students/profile", { method: "PUT", token: ctx.student, body: {
            name: "Test Student Updated", phone: "9876543210", department: "CSE", year: 3, cgpa: 8.5 } });
        return expect(u, 200);
    });
    await step("SCRUM-3", "Resume upload (PDF)", async () => {
        const form = new FormData();
        const pdf = new Blob(["%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"], { type: "application/pdf" });
        form.append("resume", pdf, "resume.pdf");
        const r = await call("/students/resume", { method: "POST", token: ctx.student, form });
        return expect(r, 200);
    });
    await step("SCRUM-3", "Non-PDF resume is rejected", async () => {
        const form = new FormData();
        form.append("resume", new Blob(["hello"], { type: "text/plain" }), "notes.txt");
        const r = await call("/students/resume", { method: "POST", token: ctx.student, form });
        return expect(r, 400);
    });

    await step("SCRUM-5", "Recruiter posts a job", async () => {
        const r = await call("/jobs", { method: "POST", token: ctx.company, body: {
            title: "Test Engineer", description: "Smoke test job", location: "Chennai", package_lpa: 6,
            min_cgpa: 7, allowed_departments: "ALL", deadline: dateAhead(60, false) } });
        if (r.status !== 201) return expect(r, 201);
        ctx.jobId = r.data.id;
        return true;
    });
    await step("SCRUM-6", "Student sees the job in the list", async () => {
        const r = await call("/jobs", { token: ctx.student });
        return expect(r, 200, d => d.some(j => j.id === ctx.jobId));
    });
    await step("SCRUM-8", "Eligibility check says eligible", async () => {
        const r = await call("/jobs/" + ctx.jobId + "/eligibility", { token: ctx.student });
        return expect(r, 200, d => d.eligible === true);
    });
    await step("SCRUM-7", "Student applies", async () => {
        return expect(await call("/applications", { method: "POST", token: ctx.student, body: { job_id: ctx.jobId } }), 201);
    });
    await step("SCRUM-7", "Duplicate application is blocked", async () => {
        return expect(await call("/applications", { method: "POST", token: ctx.student, body: { job_id: ctx.jobId } }), 409);
    });
    await step("SCRUM-9", "Student sees own application; recruiter sees applicant", async () => {
        const mine = await call("/applications/my", { token: ctx.student });
        if (mine.status !== 200 || mine.data.length < 1) return "student list empty or failed";
        const list = await call("/jobs/" + ctx.jobId + "/applications", { token: ctx.company });
        if (list.status !== 200 || list.data.length !== 1) return "recruiter list wrong: " + JSON.stringify(list.data);
        ctx.appId = list.data[0].id;
        return true;
    });
    await step("SCRUM-9", "Recruiter can open the resume", async () => {
        const res = await fetch(BASE + "/resumes/application/" + ctx.appId, { headers: { Authorization: "Bearer " + ctx.company } });
        return res.status === 200 ? true : "got status " + res.status;
    });
    await step("SCRUM-10", "Recruiter shortlists", async () => {
        return expect(await call("/applications/" + ctx.appId + "/status", { method: "PUT", token: ctx.company, body: { status: "Shortlisted" } }), 200);
    });
    await step("SCRUM-11", "Interview in the past is rejected", async () => {
        return expect(await call("/interviews", { method: "POST", token: ctx.company, body: {
            application_id: ctx.appId, interview_date: "2020-01-01T10:00", mode: "Online", location_or_link: "https://meet.example.com/x" } }), 400);
    });
    await step("SCRUM-11", "Recruiter schedules an interview", async () => {
        return expect(await call("/interviews", { method: "POST", token: ctx.company, body: {
            application_id: ctx.appId, interview_date: dateAhead(2, true), mode: "Online", location_or_link: "https://meet.example.com/abc" } }), 201);
    });
    await step("SCRUM-11", "Student sees the interview", async () => {
        return expect(await call("/interviews/my", { token: ctx.student }), 200, d => d.length === 1);
    });
    await step("SCRUM-12", "Student has notifications", async () => {
        return expect(await call("/notifications", { token: ctx.student }), 200, d => d.length >= 2);
    });
    await step("SCRUM-10", "Recruiter selects the candidate", async () => {
        return expect(await call("/applications/" + ctx.appId + "/status", { method: "PUT", token: ctx.company, body: { status: "Selected" } }), 200);
    });
    await step("SCRUM-13", "Student placement status shows placed", async () => {
        return expect(await call("/applications/placement", { token: ctx.student }), 200, d => d.placed === true);
    });
    await step("SCRUM-14", "Admin sees the placement record", async () => {
        return expect(await call("/admin/records", { token: ctx.admin }), 200, d => d.length >= 1);
    });
    await step("SCRUM-15", "Admin report shows placed students", async () => {
        return expect(await call("/admin/reports", { token: ctx.admin }), 200, d => d.placed_students >= 1);
    });
    await step("Security", "Student cannot open admin dashboard (403)", async () => {
        return expect(await call("/admin/dashboard", { token: ctx.student }), 403);
    });
    await step("Security", "No token is rejected (401)", async () => {
        return expect(await call("/jobs"), 401);
    });

    const failed = results.filter(r => !r.pass).length;
    console.log("\n" + (results.length - failed) + " passed, " + failed + " failed, " + results.length + " total.");
    console.log("Test data created: " + studentEmail + " and " + companyEmail + " (delete them in the admin page).");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch(e => { console.error("Could not run tests:", e.message); process.exit(1); });