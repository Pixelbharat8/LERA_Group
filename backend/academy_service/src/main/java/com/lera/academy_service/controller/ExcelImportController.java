package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.*;
import com.lera.academy_service.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize(AcademyRoles.STAFF)
public class ExcelImportController {
    
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final RestTemplate restTemplate;
    
    private static final String IDENTITY_SERVICE_URL = "http://localhost:8081";
    
    @Value("${lera.internal.api-key:#{null}}")
    private String internalApiKey;
    
    /**
     * Import students from Excel file
     */
    @PostMapping("/students")
    public ResponseEntity<Map<String, Object>> importStudents(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "true") boolean createAccounts,
            @RequestParam(defaultValue = "true") boolean sendWelcomeEmail,
            @RequestParam(defaultValue = "false") boolean skipExisting) {
        
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> imported = new ArrayList<>();
        List<Map<String, Object>> errors = new ArrayList<>();
        
        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {
            
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();
            
            // Skip header row
            if (rows.hasNext()) {
                rows.next();
            }
            
            int rowNum = 1;
            while (rows.hasNext()) {
                rowNum++;
                Row row = rows.next();
                
                try {
                    Student student = parseStudentRow(row);
                    
                    // Generate student code
                    student.setStudentCode(generateStudentCode());
                    
                    // Get email & phone from Excel for account creation
                    String email = getCellStringValue(row.getCell(1));
                    String phone = getCellStringValue(row.getCell(2));
                    String fullname = getCellStringValue(row.getCell(0));
                    
                    Student saved = studentRepository.save(student);
                    
                    // Create login account in identity service if requested
                    if (createAccounts && email != null && !email.isEmpty()) {
                        try {
                            UUID userId = createUserAccount(email, phone, fullname, "STUDENT", saved.getCenterId());
                            if (userId != null) {
                                saved.setUserId(userId);
                                studentRepository.save(saved);
                            }
                        } catch (Exception accountError) {
                            log.warn("Student saved but account creation failed for {}: {}", email, accountError.getMessage());
                        }
                    }
                    
                    Map<String, Object> success = new HashMap<>();
                    success.put("row", rowNum);
                    success.put("id", saved.getId());
                    success.put("studentCode", saved.getStudentCode());
                    success.put("fullname", saved.getFullname());
                    success.put("accountCreated", createAccounts && email != null && !email.isEmpty());
                    imported.add(success);
                    
                } catch (Exception e) {
                    Map<String, Object> error = new HashMap<>();
                    error.put("row", rowNum);
                    error.put("reason", "An unexpected error occurred");
                    errors.add(error);
                }
            }
            
            result.put("success", true);
            result.put("totalProcessed", imported.size() + errors.size());
            result.put("imported", imported.size());
            result.put("errors", errors.size());
            result.put("importedRecords", imported);
            result.put("errorRecords", errors);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error importing students: {}", "An unexpected error occurred");
            result.put("success", false);
            result.put("message", "Failed to import: " + "An unexpected error occurred");
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * Import teachers from Excel file
     */
    @PostMapping("/teachers")
    public ResponseEntity<Map<String, Object>> importTeachers(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "true") boolean createAccounts,
            @RequestParam(defaultValue = "true") boolean sendWelcomeEmail,
            @RequestParam(defaultValue = "false") boolean skipExisting) {
        
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> imported = new ArrayList<>();
        List<Map<String, Object>> errors = new ArrayList<>();
        
        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {
            
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();
            
            // Skip header row
            if (rows.hasNext()) {
                rows.next();
            }
            
            int rowNum = 1;
            while (rows.hasNext()) {
                rowNum++;
                Row row = rows.next();
                
                try {
                    Teacher teacher = parseTeacherRow(row);
                    
                    // Generate teacher code
                    teacher.setTeacherCode(generateTeacherCode());
                    
                    // Get email & phone from Excel for account creation
                    String email = getCellStringValue(row.getCell(1));
                    String phone = getCellStringValue(row.getCell(2));
                    String fullname = getCellStringValue(row.getCell(0));
                    
                    Teacher saved = teacherRepository.save(teacher);
                    
                    // Create login account in identity service if requested
                    if (createAccounts && email != null && !email.isEmpty()) {
                        try {
                            UUID userId = createUserAccount(email, phone, fullname, "TEACHER", saved.getCenterId());
                            if (userId != null) {
                                saved.setUserId(userId);
                                teacherRepository.save(saved);
                            }
                        } catch (Exception accountError) {
                            log.warn("Teacher saved but account creation failed for {}: {}", email, accountError.getMessage());
                        }
                    }
                    
                    Map<String, Object> success = new HashMap<>();
                    success.put("row", rowNum);
                    success.put("id", saved.getId());
                    success.put("teacherCode", saved.getTeacherCode());
                    success.put("accountCreated", createAccounts && email != null && !email.isEmpty());
                    imported.add(success);
                    
                } catch (Exception e) {
                    Map<String, Object> error = new HashMap<>();
                    error.put("row", rowNum);
                    error.put("reason", "An unexpected error occurred");
                    errors.add(error);
                }
            }
            
            result.put("success", true);
            result.put("totalProcessed", imported.size() + errors.size());
            result.put("imported", imported.size());
            result.put("errors", errors.size());
            result.put("importedRecords", imported);
            result.put("errorRecords", errors);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error importing teachers: {}", "An unexpected error occurred");
            result.put("success", false);
            result.put("message", "Failed to import: " + "An unexpected error occurred");
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    /**
     * Download student import template
     */
    @GetMapping("/templates/students")
    public ResponseEntity<byte[]> getStudentTemplate() throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Students");
            
            // Create header row
            Row header = sheet.createRow(0);
            String[] columns = {"Full Name", "Email", "Phone", "Date of Birth (YYYY-MM-DD)", 
                              "Gender", "Center ID", "School Name", "Grade", 
                              "Emergency Contact Name", "Emergency Contact Phone"};
            
            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 20 * 256);
            }
            
            // Add sample row
            Row sample = sheet.createRow(1);
            sample.createCell(0).setCellValue("John Doe");
            sample.createCell(1).setCellValue("john.doe@example.com");
            sample.createCell(2).setCellValue("+1234567890");
            sample.createCell(3).setCellValue("2010-05-15");
            sample.createCell(4).setCellValue("MALE");
            sample.createCell(5).setCellValue("(UUID of center)");
            sample.createCell(6).setCellValue("ABC School");
            sample.createCell(7).setCellValue("5");
            sample.createCell(8).setCellValue("Jane Doe");
            sample.createCell(9).setCellValue("+1234567891");
            
            workbook.write(out);
            
            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=student_import_template.xlsx")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(out.toByteArray());
        }
    }
    
    /**
     * Download teacher import template
     */
    @GetMapping("/templates/teachers")
    public ResponseEntity<byte[]> getTeacherTemplate() throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Teachers");
            
            // Create header row
            Row header = sheet.createRow(0);
            String[] columns = {"Full Name", "Email", "Phone", "Center ID", 
                              "Specialization", "Qualification", "Experience (Years)", "Nationality"};
            
            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 20 * 256);
            }
            
            // Add sample row
            Row sample = sheet.createRow(1);
            sample.createCell(0).setCellValue("Jane Smith");
            sample.createCell(1).setCellValue("jane.smith@example.com");
            sample.createCell(2).setCellValue("+1234567890");
            sample.createCell(3).setCellValue("(UUID of center)");
            sample.createCell(4).setCellValue("Mathematics");
            sample.createCell(5).setCellValue("M.Ed");
            sample.createCell(6).setCellValue("5");
            sample.createCell(7).setCellValue("Vietnamese");
            
            workbook.write(out);
            
            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=teacher_import_template.xlsx")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(out.toByteArray());
        }
    }
    
    /**
     * Download staff import template
     * Frontend calls: GET /api/import/templates/staff
     */
    @GetMapping("/templates/staff")
    public ResponseEntity<byte[]> getStaffTemplate() throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Staff");
            
            // Create header row
            Row header = sheet.createRow(0);
            String[] columns = {"Full Name", "Email", "Phone", "Center ID", 
                              "Department", "Position", "Employment Type", "Start Date"};
            
            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 20 * 256);
            }
            
            // Add sample row
            Row sample = sheet.createRow(1);
            sample.createCell(0).setCellValue("John Doe");
            sample.createCell(1).setCellValue("john.doe@example.com");
            sample.createCell(2).setCellValue("+1234567890");
            sample.createCell(3).setCellValue("(UUID of center)");
            sample.createCell(4).setCellValue("Administration");
            sample.createCell(5).setCellValue("Receptionist");
            sample.createCell(6).setCellValue("FULL_TIME");
            sample.createCell(7).setCellValue("2026-01-15");
            
            workbook.write(out);
            
            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=staff_import_template.xlsx")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(out.toByteArray());
        }
    }
    
    // Helper methods
    
    /**
     * Create a user account in the identity service via REST call.
     * Default password is generated as: first 3 chars of name (lowercase) + phone last 4 digits + "!".
     * Returns the created user's UUID, or null if creation fails.
     */
    private UUID createUserAccount(String email, String phone, String fullname, String roleName, UUID centerId) {
        try {
            String defaultPassword = generateDefaultPassword(fullname, phone);
            
            Map<String, Object> registerRequest = new HashMap<>();
            registerRequest.put("email", email);
            registerRequest.put("phone", phone);
            registerRequest.put("fullname", fullname);
            registerRequest.put("password", defaultPassword);
            registerRequest.put("roleName", roleName);
            registerRequest.put("status", "ACTIVE");
            if (centerId != null) {
                registerRequest.put("centerId", centerId.toString());
            }
            
            // Send with internal API key header to allow privileged role assignment
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Internal-Key", internalApiKey);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(registerRequest, headers);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                IDENTITY_SERVICE_URL + "/api/auth/register",
                entity,
                Map.class
            );
            
            if (response != null) {
                // AuthResponse returns { user: { id: "uuid", ... }, ... }
                @SuppressWarnings("unchecked")
                Map<String, Object> userObj = (Map<String, Object>) response.get("user");
                if (userObj != null && userObj.get("id") != null) {
                    log.info("Account created for {} with role {} (default password generated)", email, roleName);
                    return UUID.fromString(userObj.get("id").toString());
                }
            }
            
            log.info("Account creation response did not contain userId for {}", email);
            return null;
        } catch (Exception e) {
            log.error("Failed to create account for {}: {}", email, "An unexpected error occurred");
            throw e;
        }
    }
    
    /**
     * Generate a default password from name and phone.
     * Format: first 3 chars of lowercase name + last 4 digits of phone + "!"
     * Example: "John Doe" + "0987654321" -> "joh4321!"
     * If insufficient data, falls back to "Lera@" + random 4 digits
     */
    private String generateDefaultPassword(String fullname, String phone) {
        StringBuilder password = new StringBuilder();
        
        // First 3 chars of name (lowercase)
        if (fullname != null && fullname.length() >= 3) {
            password.append(fullname.substring(0, 3).toLowerCase().replaceAll("[^a-z]", ""));
        }
        if (password.length() < 3) {
            password.append("usr");
        }
        
        // Last 4 digits of phone
        if (phone != null) {
            String digits = phone.replaceAll("[^0-9]", "");
            if (digits.length() >= 4) {
                password.append(digits.substring(digits.length() - 4));
            } else {
                password.append(String.format("%04d", new Random().nextInt(10000)));
            }
        } else {
            password.append(String.format("%04d", new Random().nextInt(10000)));
        }
        
        password.append("!");
        return password.toString();
    }
    
    private Student parseStudentRow(Row row) {
        Student student = Student.builder()
            .fullname(getCellStringValue(row.getCell(0)))
            .schoolName(getCellStringValue(row.getCell(6)))
            .grade(getCellStringValue(row.getCell(7)))
            .emergencyContactName(getCellStringValue(row.getCell(8)))
            .emergencyContactPhone(getCellStringValue(row.getCell(9)))
            .status("ACTIVE")
            .enrollmentDate(LocalDate.now())
            .build();
        
        String dob = getCellStringValue(row.getCell(3));
        if (dob != null && !dob.isEmpty()) {
            student.setDateOfBirth(LocalDate.parse(dob));
        }
        
        student.setGender(getCellStringValue(row.getCell(4)));
        
        String centerId = getCellStringValue(row.getCell(5));
        if (centerId != null && !centerId.isEmpty() && !centerId.startsWith("(")) {
            try {
                student.setCenterId(UUID.fromString(centerId));
            } catch (Exception e) {
                // Invalid UUID, skip
            }
        }
        
        return student;
    }
    
    private Teacher parseTeacherRow(Row row) {
        Teacher teacher = Teacher.builder()
            .specialization(getCellStringValue(row.getCell(4)))
            .qualification(getCellStringValue(row.getCell(5)))
            .nationality(getCellStringValue(row.getCell(7)))
            .status("ACTIVE")
            .build();
        
        String experience = getCellStringValue(row.getCell(6));
        if (experience != null && !experience.isEmpty()) {
            try {
                teacher.setYearsOfExperience(Integer.parseInt(experience));
            } catch (NumberFormatException e) {
                // Ignore invalid number
            }
        }
        
        String centerId = getCellStringValue(row.getCell(3));
        if (centerId != null && !centerId.isEmpty() && !centerId.startsWith("(")) {
            try {
                teacher.setCenterId(UUID.fromString(centerId));
            } catch (Exception e) {
                // Invalid UUID, skip
            }
        }
        
        return teacher;
    }
    
    private String getCellStringValue(Cell cell) {
        if (cell == null) return null;
        
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> null;
        };
    }
    
    private String generateStudentCode() {
        return "STU" + System.currentTimeMillis() % 1000000;
    }
    
    private String generateTeacherCode() {
        return "TCH" + System.currentTimeMillis() % 1000000;
    }
}
