package placement;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JobApplicationTest {

    private JobApplication application;

    @BeforeEach
    void setUp() {
        application = new JobApplication(1, 10);
    }

    @Test
    @DisplayName("J1: a new application has no status until apply() is called")
    void newApplicationHasNoStatus() {
        assertNull(application.getStatus());
    }

    @Test
    @DisplayName("J2: apply() sets the status to Applied")
    void applySetsApplied() {
        application.apply();
        assertEquals("Applied", application.getStatus());
    }

    @Test
    @DisplayName("J3: applying twice is not allowed")
    void applyTwiceThrows() {
        application.apply();
        assertThrows(IllegalStateException.class, () -> application.apply());
    }

    @Test
    @DisplayName("J4: Applied can be shortlisted")
    void shortlistApplication() {
        application.apply();
        application.updateStatus(JobApplication.SHORTLISTED);
        assertEquals("Shortlisted", application.getStatus());
    }

    @Test
    @DisplayName("J5: Shortlisted can be selected")
    void selectShortlistedApplication() {
        application.apply();
        application.updateStatus(JobApplication.SHORTLISTED);
        application.updateStatus(JobApplication.SELECTED);
        assertEquals("Selected", application.getStatus());
    }

    @Test
    @DisplayName("J6: Applied cannot jump straight to Selected")
    void cannotSkipShortlisting() {
        application.apply();
        assertThrows(IllegalStateException.class,
                () -> application.updateStatus(JobApplication.SELECTED));
        assertEquals("Applied", application.getStatus());
    }

    @Test
    @DisplayName("J7: an unknown status is rejected")
    void invalidStatusThrows() {
        application.apply();
        assertThrows(IllegalArgumentException.class, () -> application.updateStatus("Hired"));
        assertThrows(IllegalArgumentException.class, () -> application.updateStatus(null));
    }

    @Test
    @DisplayName("J8: status cannot be changed before applying")
    void updateBeforeApplyThrows() {
        assertThrows(IllegalStateException.class,
                () -> application.updateStatus(JobApplication.SHORTLISTED));
    }

    @Test
    @DisplayName("J9: a student can withdraw an Applied application")
    void withdrawApplied() {
        application.apply();
        application.withdraw();
        assertEquals("Withdrawn", application.getStatus());
    }

    @Test
    @DisplayName("J10: a Selected application cannot be withdrawn")
    void cannotWithdrawSelected() {
        application.apply();
        application.updateStatus(JobApplication.SHORTLISTED);
        application.updateStatus(JobApplication.SELECTED);
        assertThrows(IllegalStateException.class, () -> application.withdraw());
        assertEquals("Selected", application.getStatus());
    }

    @Test
    @DisplayName("J11: a Rejected application cannot be changed again")
    void rejectedIsFinal() {
        application.apply();
        application.updateStatus(JobApplication.REJECTED);
        assertThrows(IllegalStateException.class,
                () -> application.updateStatus(JobApplication.SHORTLISTED));
    }

    @Test
    @DisplayName("J12: constructor rejects ids below 1")
    void invalidIdsThrow() {
        assertThrows(IllegalArgumentException.class, () -> new JobApplication(0, 10));
        assertThrows(IllegalArgumentException.class, () -> new JobApplication(1, 0));
    }
}