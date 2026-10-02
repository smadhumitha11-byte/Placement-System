package placement;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class StudentTest {

    private Student student;

    // Runs before every test, so each test gets a fresh student: CSE, year 3, CGPA 7.5
    @BeforeEach
    void setUp() {
        student = new Student("Asha", "21CS001", "CSE", 3, 7.5);
    }

    @Test
    @DisplayName("S1: eligible when CGPA and department both match")
    void eligibleStudent() {
        assertNotNull(student);
        assertTrue(student.isEligible(7.0, "CSE,IT"));
    }

    @Test
    @DisplayName("S2: eligible for any department when the job says ALL")
    void eligibleWhenAllDepartments() {
        assertTrue(student.isEligible(6.0, "ALL"));
    }

    @Test
    @DisplayName("S3: not eligible when CGPA is below the minimum")
    void notEligibleLowCgpa() {
        assertFalse(student.isEligible(8.0, "CSE"));
    }

    @Test
    @DisplayName("S4: not eligible when the department is not allowed")
    void notEligibleWrongDepartment() {
        assertFalse(student.isEligible(6.0, "ECE,EEE"));
    }

    @Test
    @DisplayName("S5: boundary - CGPA exactly equal to the minimum is eligible")
    void boundaryCgpaEqualsMinimum() {
        assertTrue(student.isEligible(7.5, "CSE"));
    }

    @Test
    @DisplayName("S6: department check ignores letter case and spaces")
    void departmentIgnoresCaseAndSpaces() {
        assertTrue(student.isEligible(7.0, "ece , cse"));
    }

    @Test
    @DisplayName("S7: years 1 to 4 are valid, including both boundaries")
    void validYears() {
        assertTrue(Student.isValidYear(1));
        assertTrue(Student.isValidYear(2));
        assertTrue(Student.isValidYear(4));
    }

    @Test
    @DisplayName("S8: years just outside the range are invalid")
    void invalidYears() {
        assertFalse(Student.isValidYear(0));
        assertFalse(Student.isValidYear(5));
        assertFalse(Student.isValidYear(-1));
    }

    @Test
    @DisplayName("S9: constructor rejects an invalid year")
    void constructorRejectsInvalidYear() {
        assertThrows(IllegalArgumentException.class,
                () -> new Student("Asha", "21CS001", "CSE", 5, 7.5));
    }

    @Test
    @DisplayName("S10: constructor rejects CGPA above 10")
    void constructorRejectsHighCgpa() {
        assertThrows(IllegalArgumentException.class,
                () -> new Student("Asha", "21CS001", "CSE", 3, 10.5));
    }

    @Test
    @DisplayName("S11: constructor rejects a blank name")
    void constructorRejectsBlankName() {
        assertThrows(IllegalArgumentException.class,
                () -> new Student("   ", "21CS001", "CSE", 3, 7.5));
    }

    @Test
    @DisplayName("S12: isEligible rejects a minimum CGPA outside 0 to 10")
    void isEligibleRejectsInvalidMinimum() {
        assertThrows(IllegalArgumentException.class, () -> student.isEligible(11.0, "CSE"));
    }
}