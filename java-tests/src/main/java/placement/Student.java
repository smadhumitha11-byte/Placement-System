package placement;

public class Student {
    private final String name;
    private final String rollNo;
    private final String department;
    private final int year;
    private final double cgpa;

    public Student(String name, String rollNo, String department, int year, double cgpa) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name is required.");
        }
        if (rollNo == null || rollNo.trim().isEmpty()) {
            throw new IllegalArgumentException("Roll number is required.");
        }
        if (department == null || department.trim().isEmpty()) {
            throw new IllegalArgumentException("Department is required.");
        }
        if (!isValidYear(year)) {
            throw new IllegalArgumentException("Year must be 1, 2, 3 or 4.");
        }
        if (!(cgpa >= 0 && cgpa <= 10)) {
            throw new IllegalArgumentException("CGPA must be between 0 and 10.");
        }

        this.name = name.trim();
        this.rollNo = rollNo.trim();
        this.department = department.trim();
        this.year = year;
        this.cgpa = cgpa;
    }

    public static boolean isValidYear(int year) {
        return year >= 1 && year <= 4;
    }

    public boolean isEligible(double minCgpa, String allowedDepartments) {
        if (!(minCgpa >= 0 && minCgpa <= 10)) {
            throw new IllegalArgumentException("Minimum CGPA must be between 0 and 10.");
        }
        if (allowedDepartments == null || allowedDepartments.trim().isEmpty()) {
            throw new IllegalArgumentException("Allowed departments are required.");
        }

        if (cgpa < minCgpa) {
            return false;
        }

        for (String allowed : allowedDepartments.split(",")) {
            String d = allowed.trim();
            if (d.equalsIgnoreCase("ALL") || d.equalsIgnoreCase(department)) {
                return true;
            }
        }

        return false;
    }

    public String getName() {
        return name;
    }

    public String getRollNo() {
        return rollNo;
    }

    public String getDepartment() {
        return department;
    }

    public int getYear() {
        return year;
    }

    public double getCgpa() {
        return cgpa;
    }
}