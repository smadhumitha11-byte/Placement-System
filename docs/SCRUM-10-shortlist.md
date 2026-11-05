# SCRUM-10 Shortlist Candidates

## Purpose
Lets a recruiter move applicants through the selection stages.

## How it works
- Applied can become Shortlisted or Rejected.
- Shortlisted can become Selected or Rejected.
- Any other change is refused with an error message.
- The student gets a notification on every change.
- Selecting a candidate creates a placement record.

## Files
| Part | File |
|---|---|
| API route | `backend/src/routes/applicationRoutes.js` (PUT `/api/applications/:id/status`) |
| Model | `backend/src/models/Application.js` |
| Frontend | `frontend/recruiter.html` (Applicants table buttons) |

## Rules
- A recruiter can only change applications of their own company's jobs.

## Testing
- API smoke test steps "Recruiter shortlists" and "Recruiter selects the candidate": PASS
- JUnit tests J4, J5, J6 (status flow): PASS