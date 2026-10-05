package placement;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

public class InterviewSchedule {

    public static final String SCHEDULED = "Scheduled";
    public static final String COMPLETED = "Completed";
    public static final String CANCELLED = "Cancelled";

    private int applicationId;
    private int studentId;     // 0 when not given (old 5-argument schedule)
    private int companyId;     // 0 when not given
    private LocalDateTime dateTime;
    private LocalDateTime endTime;
    private int durationMinutes;
    private String mode;
    private String locationOrLink;
    private String status;     // null until schedule() is called

    // Only 30, 45 and 60 minutes are allowed
    public static boolean isValidDuration(int minutes) {
        return minutes == 30 || minutes == 45 || minutes == 60;
    }

    // Two time ranges overlap when: start1 < end2 AND end1 > start2
    public static boolean overlaps(LocalDateTime start1, LocalDateTime end1,
                                   LocalDateTime start2, LocalDateTime end2) {
        return start1.isBefore(end2) && end1.isAfter(start2);
    }

    // Original method, kept so the earlier tests still work. Assumes 60 minutes.
    public void schedule(int applicationId, LocalDateTime dateTime, String mode,
                         String locationOrLink, LocalDateTime now) {
        doSchedule(applicationId, 0, 0, dateTime, 60, mode, locationOrLink, now,
                Collections.<InterviewSchedule>emptyList());
    }

    // Full method with student, company, duration and conflict checking
    public void schedule(int applicationId, int studentId, int companyId, LocalDateTime dateTime,
                         int durationMinutes, String mode, String locationOrLink,
                         LocalDateTime now, List<InterviewSchedule> existing) {
        if (studentId < 1 || companyId < 1) {
            throw new IllegalArgumentException("A valid student id and company id are required.");
        }
        doSchedule(applicationId, studentId, companyId, dateTime, durationMinutes, mode,
                locationOrLink, now, existing);
    }

    private void doSchedule(int applicationId, int studentId, int companyId, LocalDateTime dateTime,
                            int durationMinutes, String mode, String locationOrLink,
                            LocalDateTime now, List<InterviewSchedule> existing) {
        if (applicationId < 1) {
            throw new IllegalArgumentException("A valid application id is required.");
        }
        if (mode == null || (!mode.equals("Online") && !mode.equals("Offline"))) {
            throw new IllegalArgumentException("Mode must be Online or Offline.");
        }
        if (locationOrLink == null || locationOrLink.trim().isEmpty()) {
            throw new IllegalArgumentException("Enter the interview link or location.");
        }
        if (!isValidDuration(durationMinutes)) {
            throw new IllegalArgumentException("Duration must be 30, 45, or 60 minutes.");
        }
        if (dateTime == null || now == null || !dateTime.isAfter(now)) {
            throw new IllegalArgumentException("Interview date must be in the future.");
        }
        if (SCHEDULED.equals(status)) {
            throw new IllegalStateException("An interview is already scheduled for this application.");
        }

        LocalDateTime newEnd = dateTime.plusMinutes(durationMinutes);
        for (InterviewSchedule other : existing) {
            if (other == this || !SCHEDULED.equals(other.status)) {
                continue;   // only Scheduled interviews can block a new one
            }
            if (!overlaps(dateTime, newEnd, other.dateTime, other.endTime)) {
                continue;
            }
            if (studentId > 0 && other.studentId == studentId) {
                throw new IllegalStateException("Student already has another interview scheduled during this time.");
            }
            if (companyId > 0 && other.companyId == companyId) {
                throw new IllegalStateException("Company already has another interview scheduled during this time.");
            }
        }

        this.applicationId = applicationId;
        this.studentId = studentId;
        this.companyId = companyId;
        this.dateTime = dateTime;
        this.durationMinutes = durationMinutes;
        this.endTime = newEnd;
        this.mode = mode;
        this.locationOrLink = locationOrLink.trim();
        this.status = SCHEDULED;
    }

    public void cancelSchedule() {
        if (!SCHEDULED.equals(status)) {
            throw new IllegalStateException("Only a scheduled interview can be cancelled.");
        }
        status = CANCELLED;
    }

    public void completeInterview() {
        if (!SCHEDULED.equals(status)) {
            throw new IllegalStateException("Only a scheduled interview can be completed.");
        }
        status = COMPLETED;
    }

    public String getStatus() { return status; }
    public String getMode() { return mode; }
    public String getLocationOrLink() { return locationOrLink; }
    public LocalDateTime getDateTime() { return dateTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public int getDurationMinutes() { return durationMinutes; }
    public int getApplicationId() { return applicationId; }
    public int getStudentId() { return studentId; }
    public int getCompanyId() { return companyId; }
}