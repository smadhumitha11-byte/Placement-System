package placement;

import java.util.Arrays;
import java.util.List;

public class JobApplication {

    public static final String APPLIED = "Applied";
    public static final String SHORTLISTED = "Shortlisted";
    public static final String SELECTED = "Selected";
    public static final String REJECTED = "Rejected";
    public static final String WITHDRAWN = "Withdrawn";

    private static final List<String> VALID_STATUSES =
            Arrays.asList(APPLIED, SHORTLISTED, SELECTED, REJECTED, WITHDRAWN);

    private final int studentId;
    private final int jobId;
    private String status;   // null until apply() is called

    public JobApplication(int studentId, int jobId) {
        if (studentId < 1 || jobId < 1) {
            throw new IllegalArgumentException("Student id and job id must be positive.");
        }
        this.studentId = studentId;
        this.jobId = jobId;
    }

    // Submits the application. It can only be done once.
    public void apply() {
        if (status != null) {
            throw new IllegalStateException("Already applied.");
        }
        status = APPLIED;
    }

    // Recruiter changes: Applied -> Shortlisted/Rejected, Shortlisted -> Selected/Rejected
    public void updateStatus(String newStatus) {
        if (newStatus == null || !VALID_STATUSES.contains(newStatus)) {
            throw new IllegalArgumentException("Invalid status: " + newStatus);
        }
        if (status == null) {
            throw new IllegalStateException("Apply first before changing the status.");
        }

        boolean allowed =
                (status.equals(APPLIED) && (newStatus.equals(SHORTLISTED) || newStatus.equals(REJECTED)))
             || (status.equals(SHORTLISTED) && (newStatus.equals(SELECTED) || newStatus.equals(REJECTED)));

        if (!allowed) {
            throw new IllegalStateException("Cannot change status from " + status + " to " + newStatus + ".");
        }
        status = newStatus;
    }

    // Student withdraws. Allowed only while Applied or Shortlisted.
    public void withdraw() {
        if (status == null) {
            throw new IllegalStateException("Apply first before withdrawing.");
        }
        if (!status.equals(APPLIED) && !status.equals(SHORTLISTED)) {
            throw new IllegalStateException("You cannot withdraw a " + status + " application.");
        }
        status = WITHDRAWN;
    }

    public String getStatus() { return status; }
    public int getStudentId() { return studentId; }
    public int getJobId() { return jobId; }
}