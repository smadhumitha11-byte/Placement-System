package placement;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class InterviewScheduleTest {

    // A fixed "current time", so the tests do not depend on the real date
    private final LocalDateTime now = LocalDateTime.of(2026, 10, 2, 9, 0);
    private final LocalDateTime future = LocalDateTime.of(2026, 10, 5, 10, 30);

    private InterviewSchedule interview;

    @BeforeEach
    void setUp() {
        interview = new InterviewSchedule();
    }

    @Test
    @DisplayName("I1: a new interview has no status before scheduling")
    void newInterviewHasNoStatus() {
        assertNull(interview.getStatus());
    }

    @Test
    @DisplayName("I2: schedule an online interview")
    void scheduleOnline() {
        interview.schedule(1, future, "Online", "https://meet.example.com/abc", now);
        assertEquals("Scheduled", interview.getStatus());
        assertEquals("Online", interview.getMode());
        assertEquals(future, interview.getDateTime());
    }

    @Test
    @DisplayName("I3: schedule an offline interview")
    void scheduleOffline() {
        interview.schedule(1, future, "Offline", "Room 204, Main Block", now);
        assertEquals("Scheduled", interview.getStatus());
        assertEquals("Offline", interview.getMode());
        assertEquals("Room 204, Main Block", interview.getLocationOrLink());
    }

    @Test
    @DisplayName("I4: an invalid mode is rejected")
    void invalidModeThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> interview.schedule(1, future, "Hybrid", "Room 1", now));
        assertNull(interview.getStatus());
    }

    @Test
    @DisplayName("I5: a date in the past is rejected")
    void pastDateThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> interview.schedule(1, now.minusDays(1), "Online", "link", now));
    }

    @Test
    @DisplayName("I6: boundary - a date equal to the current time is rejected")
    void dateEqualToNowThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> interview.schedule(1, now, "Online", "link", now));
    }

    @Test
    @DisplayName("I7: a blank link or venue is rejected")
    void blankLocationThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> interview.schedule(1, future, "Online", "   ", now));
    }

    @Test
    @DisplayName("I8: scheduling again while still Scheduled is not allowed")
    void scheduleTwiceThrows() {
        interview.schedule(1, future, "Online", "link", now);
        assertThrows(IllegalStateException.class,
                () -> interview.schedule(1, future.plusDays(1), "Online", "link", now));
    }

    @Test
    @DisplayName("I9: cancelSchedule() sets the status to Cancelled")
    void cancelSchedule() {
        interview.schedule(1, future, "Online", "link", now);
        interview.cancelSchedule();
        assertEquals("Cancelled", interview.getStatus());
    }

    @Test
    @DisplayName("I10: completeInterview() sets the status to Completed")
    void completeInterview() {
        interview.schedule(1, future, "Online", "link", now);
        interview.completeInterview();
        assertEquals("Completed", interview.getStatus());
    }

    @Test
    @DisplayName("I11: nothing can be cancelled before it is scheduled")
    void cancelBeforeScheduleThrows() {
        assertThrows(IllegalStateException.class, () -> interview.cancelSchedule());
    }

    @Test
    @DisplayName("I12: a cancelled interview cannot be completed")
    void completeAfterCancelThrows() {
        interview.schedule(1, future, "Online", "link", now);
        interview.cancelSchedule();
        assertThrows(IllegalStateException.class, () -> interview.completeInterview());
        assertEquals("Cancelled", interview.getStatus());
    }
}