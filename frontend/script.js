// ===== Shared settings and helper functions =====
// Every page loads this file first.

const API_URL = "http://localhost:3000/api";

// ----- Login information (saved in the browser) -----
function saveLogin(data) {
    // data looks like { token, role, name }
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("name", data.name);
}

function getToken() { return localStorage.getItem("token"); }
function getRole() { return localStorage.getItem("role"); }
function getName() { return localStorage.getItem("name"); }

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

// Call this at the top of a protected page, e.g. requireLogin("student")
function requireLogin(role) {
    if (!getToken() || getRole() !== role) {
        window.location.href = "login.html";
    }
}

// ----- Talking to the backend -----
// Usage: const data = await apiRequest("/jobs");
// It adds the login token automatically and throws an Error with a
// readable message if the server says something went wrong.
async function apiRequest(path, options = {}) {
    const headers = options.headers || {};
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }
    if (getToken()) {
        headers["Authorization"] = "Bearer " + getToken();
    }

    let response;
    try {
        response = await fetch(API_URL + path, { ...options, headers });
    } catch (error) {
        throw new Error("Cannot reach the server. Is the backend running?");
    }

    let data = {};
    try {
        data = await response.json();
    } catch (error) {
        // response had no JSON body
    }

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong (code " + response.status + ").");
    }
    return data;
}

// ----- Messages on the page -----
function showMessage(elementId, text, type) {
    const box = document.getElementById(elementId);
    if (!box) return;
    box.textContent = text;
    box.className = "alert show " + (type === "success" ? "alert-success" : "alert-error");
}

function hideMessage(elementId) {
    const box = document.getElementById(elementId);
    if (box) box.className = "alert";
}

// ----- Small helpers -----
// Stops text from being treated as HTML (protects against script injection)
function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Coloured label for a status, e.g. statusBadge("Shortlisted")
function statusBadge(status) {
    return '<span class="badge badge-' + escapeHtml(String(status).toLowerCase()) + '">' +
        escapeHtml(status) + "</span>";
}

// ----- Form field validation helpers -----
function setFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(inputId + "-error");
    if (input) input.classList.toggle("invalid", message !== "");
    if (error) error.textContent = message;
    return message === "";
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9]{10}$/;

// ----- Navigation bar (built here so every page shares one copy) -----
function renderNavbar() {
    const nav = document.getElementById("navbar");
    if (!nav) return;

    const role = getRole();
    let links = "";

    if (role === "student") {
        links = '<a href="student.html">Dashboard</a>' +
                '<a href="jobs.html">Jobs</a>' +
                '<a href="applications.html">My Applications</a>' +
                '<a href="interview.html">Interviews</a>';
    } else if (role === "recruiter") {
        links = '<a href="recruiter.html">Dashboard</a>';
    } else if (role === "admin") {
        links = '<a href="admin.html">Dashboard</a>';
    } else {
        links = '<a href="index.html">Home</a>' +
                '<a href="login.html">Login</a>' +
                '<a href="register.html">Register</a>';
    }

    if (role) {
        links += '<span class="user-name">' + escapeHtml(getName()) + "</span>" +
                 '<button type="button" onclick="logout()">Logout</button>';
    }

    nav.className = "navbar";
    nav.innerHTML = '<a class="brand" href="index.html">Placement Cell Portal</a>' +
                    '<div class="nav-links">' + links + "</div>";
}

document.addEventListener("DOMContentLoaded", renderNavbar);


// ----- Sidebar for student pages -----
document.addEventListener("DOMContentLoaded", function () {
    const main = document.querySelector("main");
    if (getRole() !== "student" || !main) return;

    const page = window.location.pathname.split("/").pop();
    const menu = [
        ["student.html", "📊 Dashboard"],
        ["jobs.html", "💼 Browse Jobs"],
        ["applications.html", "📄 My Applications"],
        ["interview.html", "📅 Interviews"]
    ];
    if (!menu.some(function (m) { return m[0] === page; })) return;

    const aside = document.createElement("aside");
    aside.className = "sidebar";
    aside.innerHTML = menu.map(function (m) {
        return '<a href="' + m[0] + '"' + (m[0] === page ? ' class="active"' : "") + ">" + m[1] + "</a>";
    }).join("");

    const shell = document.createElement("div");
    shell.className = "app-shell";
    main.parentNode.insertBefore(shell, main);
    shell.appendChild(aside);
    shell.appendChild(main);
    document.body.classList.add("with-sidebar");
});


// ----- Desktop push notifications (student) -----
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
    return output;
}

async function enablePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("This browser does not support push notifications.");
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        throw new Error("Notifications were blocked. Allow them in the browser's site settings.");
    }

    const registration = await navigator.serviceWorker.register("sw.js");
    await navigator.serviceWorker.ready;

    const data = await apiRequest("/push/key");
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(data.key)
        });
    }
    await apiRequest("/push/subscribe", { method: "POST", body: JSON.stringify(subscription.toJSON()) });
}


// ----- Interview times: "2026-10-20 10:30:00" -> "10:30 AM" -----
function formatClock(text) {
    const m = /(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/.exec(String(text));
    if (!m) return "";
    let hour = Number(m[2]);
    const suffix = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return hour + ":" + m[3] + " " + suffix;
}

// Date, Start, End and Duration as ready-to-use HTML
function interviewTimes(i) {
    return escapeHtml(String(i.interview_date).slice(0, 10)) +
        "<br>Start: " + escapeHtml(formatClock(i.interview_date)) +
        "<br>End: " + escapeHtml(formatClock(i.end_time || i.interview_date)) +
        "<br>Duration: " + escapeHtml(i.duration_minutes || 60) + " minutes";
}