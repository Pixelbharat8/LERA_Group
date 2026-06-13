package com.lera.identity_service.controller;

import com.lera.identity_service.entity.DropdownOption;
import com.lera.identity_service.repository.DropdownOptionRepository;
import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Configurable dropdown options (leave types, staff positions, …) — now DB-backed.
 * Defaults are seeded once on first start; admin edits persist (the old stub lost them on restart).
 */
@RestController
@RequestMapping("/api/dropdown-options")
public class DropdownOptionController {

    private final DropdownOptionRepository repository;

    public DropdownOptionController(DropdownOptionRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    void seedDefaultsIfEmpty() {
        if (repository.count() > 0) return;
        repository.saveAll(buildDefaults());
    }

    private Map<String, Object> toMap(DropdownOption o) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", o.getId() != null ? o.getId().toString() : null);
        m.put("category", o.getCategory());
        m.put("value", o.getValue());
        m.put("label", o.getLabel());
        m.put("labelVi", o.getLabelVi());
        m.put("sortOrder", o.getSortOrder());
        m.put("isActive", o.getIsActive());
        m.put("createdAt", o.getCreatedAt());
        m.put("updatedAt", o.getUpdatedAt());
        return m;
    }

    @GetMapping
    public ResponseEntity<Map<String, List<Map<String, Object>>>> getAllOptions() {
        Map<String, List<Map<String, Object>>> byCategory = new LinkedHashMap<>();
        for (DropdownOption o : repository.findAllByOrderByCategoryAscSortOrderAsc()) {
            byCategory.computeIfAbsent(o.getCategory(), k -> new ArrayList<>()).add(toMap(o));
        }
        return ResponseEntity.ok(byCategory);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, Object>>> getCategories() {
        return ResponseEntity.ok(List.of(
                Map.of("key", "director_positions", "label", "Director Positions", "description", "Titles/positions for directors"),
                Map.of("key", "department_types", "label", "Department Types", "description", "Types of departments"),
                Map.of("key", "staff_positions", "label", "Staff Positions", "description", "Staff job titles"),
                Map.of("key", "leave_types", "label", "Leave Types", "description", "Types of leave requests"),
                Map.of("key", "contract_types", "label", "Contract Types", "description", "Employee contract types"),
                Map.of("key", "payment_methods", "label", "Payment Methods", "description", "Payment method options"),
                Map.of("key", "student_status", "label", "Student Status", "description", "Student enrollment status"),
                Map.of("key", "teacher_qualifications", "label", "Teacher Qualifications", "description", "Teacher certifications")
        ));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Map<String, Object>>> getOptionsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(repository.findByCategoryOrderBySortOrderAsc(category)
                .stream().map(this::toMap).collect(Collectors.toList()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<Map<String, Object>> createOption(@Valid @RequestBody Map<String, Object> body) {
        String category = (String) body.get("category");
        if (category == null || category.isBlank()) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(toMap(repository.save(fromBody(new DropdownOption(), body, category))));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<Map<String, Object>> updateOption(@PathVariable String id, @Valid @RequestBody Map<String, Object> body) {
        UUID uuid;
        try { uuid = UUID.fromString(id); } catch (IllegalArgumentException e) { return ResponseEntity.notFound().build(); }
        return repository.findById(uuid).map(o -> {
            if (body.containsKey("value")) o.setValue(str(body.get("value")));
            if (body.containsKey("label")) o.setLabel(str(body.get("label")));
            if (body.containsKey("labelVi")) o.setLabelVi(str(body.get("labelVi")));
            if (body.containsKey("sortOrder")) o.setSortOrder(toInt(body.get("sortOrder")));
            if (body.containsKey("isActive")) o.setIsActive(Boolean.valueOf(String.valueOf(body.get("isActive"))));
            return ResponseEntity.ok(toMap(repository.save(o)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    public ResponseEntity<Void> deleteOption(@PathVariable String id) {
        UUID uuid;
        try { uuid = UUID.fromString(id); } catch (IllegalArgumentException e) { return ResponseEntity.notFound().build(); }
        if (!repository.existsById(uuid)) return ResponseEntity.notFound().build();
        repository.deleteById(uuid);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/batch")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN')")
    @SuppressWarnings("unchecked")
    public ResponseEntity<List<Map<String, Object>>> createBatchOptions(@Valid @RequestBody Map<String, Object> body) {
        String category = (String) body.get("category");
        if (category == null || category.isBlank()) return ResponseEntity.badRequest().build();
        List<Map<String, Object>> items = (List<Map<String, Object>>) body.getOrDefault("options", List.of());
        List<DropdownOption> toSave = items.stream().map(i -> fromBody(new DropdownOption(), i, category)).collect(Collectors.toList());
        return ResponseEntity.ok(repository.saveAll(toSave).stream().map(this::toMap).collect(Collectors.toList()));
    }

    // ---- helpers ----

    private DropdownOption fromBody(DropdownOption o, Map<String, Object> body, String category) {
        o.setCategory(category);
        o.setValue(str(body.get("value")));
        o.setLabel(str(body.get("label")));
        o.setLabelVi(str(body.get("labelVi")));
        o.setSortOrder(toInt(body.get("sortOrder")));
        o.setIsActive(body.containsKey("isActive") ? Boolean.valueOf(String.valueOf(body.get("isActive"))) : Boolean.TRUE);
        return o;
    }

    private static String str(Object o) { return o != null ? o.toString() : null; }
    private static Integer toInt(Object o) {
        if (o == null) return null;
        try { return (int) Double.parseDouble(o.toString()); } catch (NumberFormatException e) { return null; }
    }

    private DropdownOption def(String category, String value, String label, String labelVi, int sortOrder) {
        DropdownOption o = new DropdownOption();
        o.setCategory(category); o.setValue(value); o.setLabel(label); o.setLabelVi(labelVi);
        o.setSortOrder(sortOrder); o.setIsActive(true);
        return o;
    }

    private List<DropdownOption> buildDefaults() {
        List<DropdownOption> d = new ArrayList<>();
        String c;
        c = "director_positions";
        d.add(def(c, "managing_director", "Managing Director", "Giám đốc Điều hành", 1));
        d.add(def(c, "executive_director", "Executive Director", "Giám đốc Hành chính", 2));
        d.add(def(c, "director_operations", "Director of Operations", "Giám đốc Vận hành", 3));
        d.add(def(c, "director_finance", "Director of Finance", "Giám đốc Tài chính", 4));
        d.add(def(c, "director_hr", "Director of HR", "Giám đốc Nhân sự", 5));
        d.add(def(c, "academic_director", "Academic Director", "Giám đốc Học vụ", 6));
        d.add(def(c, "center_director", "Center Director", "Giám đốc Trung tâm", 7));
        c = "department_types";
        d.add(def(c, "academic", "Academic", "Học vụ", 1));
        d.add(def(c, "administration", "Administration", "Hành chính", 2));
        d.add(def(c, "finance", "Finance", "Tài chính", 3));
        d.add(def(c, "marketing", "Marketing", "Marketing", 4));
        d.add(def(c, "hr", "Human Resources", "Nhân sự", 5));
        d.add(def(c, "it", "Information Technology", "Công nghệ thông tin", 6));
        d.add(def(c, "student_services", "Student Services", "Dịch vụ Sinh viên", 7));
        c = "staff_positions";
        d.add(def(c, "receptionist", "Receptionist", "Lễ tân", 1));
        d.add(def(c, "admin_assistant", "Administrative Assistant", "Trợ lý Hành chính", 2));
        d.add(def(c, "accountant", "Accountant", "Kế toán", 3));
        d.add(def(c, "hr_officer", "HR Officer", "Nhân viên Nhân sự", 4));
        d.add(def(c, "it_support", "IT Support", "Hỗ trợ IT", 5));
        d.add(def(c, "driver", "Driver", "Tài xế", 6));
        d.add(def(c, "security", "Security Guard", "Bảo vệ", 7));
        c = "leave_types";
        d.add(def(c, "annual", "Annual Leave", "Nghỉ phép năm", 1));
        d.add(def(c, "sick", "Sick Leave", "Nghỉ ốm", 2));
        d.add(def(c, "personal", "Personal Leave", "Nghỉ việc riêng", 3));
        d.add(def(c, "maternity", "Maternity Leave", "Nghỉ thai sản", 4));
        d.add(def(c, "paternity", "Paternity Leave", "Nghỉ phép cha", 5));
        d.add(def(c, "unpaid", "Unpaid Leave", "Nghỉ không lương", 6));
        c = "contract_types";
        d.add(def(c, "full_time", "Full-time", "Toàn thời gian", 1));
        d.add(def(c, "part_time", "Part-time", "Bán thời gian", 2));
        d.add(def(c, "contract", "Fixed-term Contract", "Hợp đồng có thời hạn", 3));
        d.add(def(c, "probation", "Probation", "Thử việc", 4));
        d.add(def(c, "intern", "Internship", "Thực tập", 5));
        c = "payment_methods";
        d.add(def(c, "cash", "Cash", "Tiền mặt", 1));
        d.add(def(c, "bank_transfer", "Bank Transfer", "Chuyển khoản", 2));
        d.add(def(c, "momo", "MoMo E-Wallet", "Ví MoMo", 3));
        d.add(def(c, "vnpay", "VNPay", "VNPay", 4));
        d.add(def(c, "zalopay", "ZaloPay", "ZaloPay", 5));
        c = "student_status";
        d.add(def(c, "active", "Active", "Đang học", 1));
        d.add(def(c, "inactive", "Inactive", "Tạm nghỉ", 2));
        d.add(def(c, "graduated", "Graduated", "Đã tốt nghiệp", 3));
        d.add(def(c, "withdrawn", "Withdrawn", "Đã rút", 4));
        c = "teacher_qualifications";
        d.add(def(c, "celta", "CELTA", "CELTA", 1));
        d.add(def(c, "delta", "DELTA", "DELTA", 2));
        d.add(def(c, "tesol", "TESOL", "TESOL", 3));
        d.add(def(c, "tefl", "TEFL", "TEFL", 4));
        d.add(def(c, "ma_tesol", "MA TESOL", "Thạc sĩ TESOL", 5));
        d.add(def(c, "ba_english", "BA English", "Cử nhân Tiếng Anh", 6));
        return d;
    }
}
