# Placement Cell Recruiter and Interview Scheduler System

A web application that manages the college placement process. Students apply for jobs and track their progress, recruiters post jobs and schedule interviews, and the placement cell monitors everything and generates reports.

College Software Engineering mini project, Team 24.

## Features

**Students**
- Register, log in, edit profile, upload a PDF resume (max 2 MB)
- Browse and search open jobs, check eligibility, apply, withdraw
- Track each application on a step-by-step progress tracker
- View interview schedule (date, start, end, duration, mode, link)
- In-app notifications and desktop push notifications
- View placement status

**Recruiters (companies)**
- Register, log in, manage company profile
- Post, edit and delete jobs with minimum CGPA and allowed departments
- View applicants with an eligibility check, open resumes
- Shortlist, reject or select candidates
- Schedule interviews with duration (30, 45 or 60 minutes)
- Conflict detection: no overlapping interviews for the same student or the same company
- Mark interviews Completed or Cancelled

**Placement cell (admin)**
- Dashboard with counts
- View and manage students, companies, jobs, applications and interviews
- Recruitment records and placement reports (by department and by company)

## Technology

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Security | bcrypt, JSON Web Tokens, parameterized SQL |
| Push notifications | web-push |
| Unit tests | JUnit 5 (Java, separate module) |
| Version control | Git and GitHub |

## Folder structure

```
Placement-System/
├── backend/
│   ├── src/
│   │   ├── db/            database connection
│   │   ├── middleware/    login and role checks
│   │   ├── models/        all SQL queries
│   │   ├── routes/        REST API routes
│   │   ├── utils/         eligibility rules, push helper
│   │   ├── app.js
│   │   ├── createAdmin.js
│   │   └── smokeTest.js
│   ├── uploads/resumes/   saved resumes (not on GitHub)
│   ├── package.json
│   └── .env.example
├── database/schema.sql    MySQL tables
├── docs/                  project notes
├── frontend/              pages, style.css, script.js, sw.js
└── java-tests/            JUnit 5 module (Maven)
```

## Setup

**Requirements:** Node.js, MySQL 8, and (for the JUnit part) JDK 17+ and Maven.

1. **Clone**
   ```
   git clone https://github.com/smadhumitha11-byte/Placement-System.git
   cd Placement-System
   ```
2. **Database:** open MySQL and run `database/schema.sql`. If you have an older database, also run:
   ```sql
   ALTER TABLE students ADD COLUMN resume_path VARCHAR(255) NULL;
   ALTER TABLE interviews ADD COLUMN end_time DATETIME NULL AFTER interview_date;
   ```
   For push notifications, create the `push_subscriptions` table (see the project notes).
3. **Environment file:** in `backend`, copy `.env.example` to `.env` and fill in your own values (database user and password, a long random `JWT_SECRET`). Never upload `.env` to GitHub.
4. **Install**
   ```
   cd backend
   npm install
   ```
5. **Create the first admin** (admins cannot register on the website)
   ```
   node src/createAdmin.js adminname YourPassword123
   ```
6. **Run**
   ```
   npm run dev
   ```
   Open http://localhost:3000

## Testing

**JUnit 5** (Java business rules for Student, JobApplication, InterviewSchedule):
```
cd java-tests
mvn test
```
Last recorded run: 49 tests, 0 failures, 0 errors.

**API smoke test** (server must be running):
```
cd backend
node src/smokeTest.js adminname YourPassword123
```
It creates test data, which you can delete in the admin page.

The JUnit tests cover the Java copy of the rules, not the Node.js code. The website is checked by the smoke test and by manual testing.

## Branches and baselines

- `main`: stable code
- `develop`: integration branch
- `feature/SCRUM-xx-name`: one branch per Jira ticket
- Changes go in through pull requests.
- Baselines are Git tags: `v1.0-baseline`, `v1.1`, `v1.2`.

## Security

Passwords are hashed with bcrypt. Database settings and secrets live in `.env`. All SQL uses placeholders. Routes check the login token and the user's role. Resumes are only served to the recruiter whose job the student applied to.

## Known limitations

No password reset, no login rate limiting, notifications are in-app and browser push only (no email), and the login token is stored in browser localStorage.



