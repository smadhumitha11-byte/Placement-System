# SCRUM-13 Track Placement Status

## Purpose
Lets a student see whether they have been placed, and in which company and job.

## How it works
1. A recruiter marks an application as **Selected**.
2. The system saves a row in the `placement_records` table
   (application, student, company, package, placement date).
3. The student dashboard calls the API and shows **Placed** with the
   company, job title and package. Otherwise it shows **Not placed yet**.

## Files
| Part | File |
|---|---|
| API route | `backend/src/routes/applicationRoutes.js` (GET `/api/applications/placement`) |
| Model (SQL) | `backend/src/models/Application.js` (`createPlacement`, `placementsByStudent`) |
| Database table | `placement_records` |
| Frontend | `frontend/student.html` (Placement Status card) |
| Admin view | Records tab in `frontend/admin.html` |

## API
- Method and path: GET `/api/applications/placement`
- Access: logged-in student only
- Response: `{ "placed": true or false, "records": [ ... ] }`

## Rules
- A placement record is created only when the status changes to Selected.
- One placement record per application (`application_id` is UNIQUE).
- A student can only see their own placement status.

## Testing
- API smoke test step "Student placement status shows placed": PASS
  (27 of 27 steps passed on the earlier run).
- Manual check: *(add the date and what you saw in the browser)*

## Known limitation
The system stores only the current status, not the full history of changes.