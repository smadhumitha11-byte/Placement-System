package placement;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class InterviewConflictTest {

    private static final String STUDENT_MSG = "Student already has another interview scheduled during this time.";
    private static final String COMPANY_MSG = "Company already has another interview scheduled during this time.";

    private final LocalDateTime now = LocalDateTime.of(2026, 10, 2, 9, 0);

    // Time on a fixed future day
    private LocalDateTime t(int hour, int minute) {
        return LocalDateTime.of(2026, 10, 20, hour, minute);
    }

    // Creates an already scheduled interview
    private InterviewSchedule scheduled(int appId, int studentId, int companyId, LocalDateTime start, int minutes) {
        InterviewSchedule i = new InterviewSchedule();
        i.schedule(appId, studentId, companyId, start, minutes, "Online", "link", now, new ArrayList<>());
        return i;
    }

    // Existing interview: student 1, company 10, 10:00 to 11:00
    private List<InterviewSchedule> existing() {
        List<InterviewSchedule> list = new ArrayList<>();
        list.add(scheduled(1, 1, 10, t(10, 0), 60));
        return list;
    }

    private void tryToSchedule(int appId, int studentId, int companyId, LocalDateTime start,
                               int minutes, List<InterviewSchedule> list) {
        new InterviewSchedule().schedule(appId, studentId, companyId, start, minutes, "Online", "link", now, list);
    }

    @Test
    @DisplayName("C1: valid interviews that do not overlap are allowed, end time is calculated")
    void nonOverlappingAllowed() {
        List<InterviewSchedule> list = existing();
        InterviewSchedule next = new InterviewSchedule();
        next.schedule(2, 1, 10, t(14, 0), 45, "Offline", "Room 1", now, list);
        assertEquals("Scheduled", next.getStatus());
        assertEquals(t(14, 45), next.getEndTime());
        assertEquals(45, next.getDurationMinutes());
    }

    @Test
    @DisplayName("C2: same student, overlapping time, different company is rejected")
    void sameStudentRejected() {
        IllegalStateException e = assertThrows(IllegalStateException.class,
                () -> tryToSchedule(2, 1, 20, t(10, 30), 60, existing()));
        assertEquals(STUDENT_MSG, e.getMessage());
    }

    @Test
    @DisplayName("C3: same company, overlapping time, different student is rejected")
    void sameCompanyRejected() {
        IllegalStateException e = assertThrows(IllegalStateException.class,
                () -> tryToSchedule(2, 2, 10, t(10, 30), 60, existing()));
        assertEquals(COMPANY_MSG, e.getMessage());
    }

    @Test
    @DisplayName("C4: different student and different company at the same time is allowed")
    void unrelatedAllowed() {
        InterviewSchedule next = new InterviewSchedule();
        next.schedule(2, 2, 20, t(10, 0), 60, "Online", "link", now, existing());
        assertEquals("Scheduled", next.getStatus());
    }

    @Test
    @DisplayName("C5: boundary - new interview starts exactly when the old one ends")
    void startsWhenOldEnds() {
        InterviewSchedule next = new InterviewSchedule();
        next.schedule(2, 1, 10, t(11, 0), 30, "Online", "link", now, existing());
        assertEquals("Scheduled", next.getStatus());
    }

    @Test
    @DisplayName("C6: boundary - new interview ends exactly when the old one starts")
    void endsWhenOldStarts() {
        InterviewSchedule next = new InterviewSchedule();
        next.schedule(2, 1, 10, t(9, 30), 30, "Online", "link", now, existing());
        assertEquals("Scheduled", next.getStatus());
    }

    @Test
    @DisplayName("C7: partial overlap at the start is rejected")
    void partialOverlapRejected() {
        assertThrows(IllegalStateException.class,
                () -> tryToSchedule(2, 1, 10, t(9, 45), 30, existing()));
    }

    @Test
    @DisplayName("C8: new interview that completely contains the existing one is rejected")
    void newContainsExistingRejected() {
        List<InterviewSchedule> list = new ArrayList<>();
        list.add(scheduled(1, 1, 10, t(10, 15), 30));   // 10:15 to 10:45
        assertThrows(IllegalStateException.class,
                () -> tryToSchedule(2, 1, 10, t(10, 0), 60, list));   // 10:00 to 11:00
    }

    @Test
    @DisplayName("C9: existing interview that completely contains the new one is rejected")
    void existingContainsNewRejected() {
        assertThrows(IllegalStateException.class,
                () -> tryToSchedule(2, 1, 10, t(10, 15), 30, existing()));   // 10:15 to 10:45 inside 10:00 to 11:00
    }

    @Test
    @DisplayName("C10: invalid duration is rejected")
    void invalidDurationRejected() {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> tryToSchedule(2, 2, 20, t(14, 0), 50, new ArrayList<>()));
        assertEquals("Duration must be 30, 45, or 60 minutes.", e.getMessage());
        assertThrows(IllegalArgumentException.class, () -> tryToSchedule(2, 2, 20, t(14, 0), 0, new ArrayList<>()));
        assertThrows(IllegalArgumentException.class, () -> tryToSchedule(2, 2, 20, t(14, 0), 90, new ArrayList<>()));
    }

    @Test
    @DisplayName("C11: a date in the past is rejected")
    void pastDateRejected() {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class,
                () -> tryToSchedule(2, 2, 20, now.minusDays(1), 60, new ArrayList<>()));
        assertEquals("Interview date must be in the future.", e.getMessage());
    }

    @Test
    @DisplayName("C12: a cancelled interview no longer blocks the time slot")
    void cancelledDoesNotBlock() {
        List<InterviewSchedule> list = existing();
        list.get(0).cancelSchedule();
        InterviewSchedule next = new InterviewSchedule();
        next.schedule(2, 1, 10, t(10, 30), 60, "Online", "link", now, list);
        assertEquals("Scheduled", next.getStatus());
    }

    @Test
    @DisplayName("C13: only 30, 45 and 60 are valid durations")
    void validDurations() {
        assertTrue(InterviewSchedule.isValidDuration(30));
        assertTrue(InterviewSchedule.isValidDuration(45));
        assertTrue(InterviewSchedule.isValidDuration(60));
        assertFalse(InterviewSchedule.isValidDuration(15));
    }
}