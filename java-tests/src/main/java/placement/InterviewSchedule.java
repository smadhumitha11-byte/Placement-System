package placement;

import java.time.LocalDateTime;

public class InterviewSchedule {

    public static final String SCHEDULED = "Scheduled";
    public static final String COMPLETED = "Completed";
    public static final String CANCELLED = "Cancelled";

    private int applicationId;
    private LocalDateTime dateTime;
    private String mode;
    private String locationOrLink;
    private String status;   // null until schedule() is called

    public void schedule(int applicationId, LocalDateTime dateTime, String mode,
                         String locationOrLink, LocalDateTime now) {
        if (applicationId < 1) {
            throw new IllegalArgumentException("A valid application id is required.");
        }
        if (mode == null || (!mode.equals("Online") && !mode.equals("Offline"))) {
            throw new IllegalArgumentException("Mode must be Online or Offline.");
        }
        if (locationOrLink == null || locationOrLink.trim().isEmpty()) {
            throw new IllegalArgumentException("Enter the interview link or location.");
        }
        if (dateTime == null || now == null || !dateTime.isAfter(now)) {
            throw new IllegalArgumentException("The interview must be in the future.");
        }
        if (SCHEDULED.equals(status)) {
            throw new IllegalStateException("This interview is already scheduled.");
        }

        this.applicationId = applicationId;
        this.dateTime = dateTime;
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
    public int getApplicationId() { return applicationId; }
}