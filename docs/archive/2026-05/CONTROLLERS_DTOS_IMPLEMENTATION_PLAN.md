# 🎯 REST CONTROLLERS + DTOs IMPLEMENTATION PLAN

**Status**: In Progress  
**Total Controllers**: 39  
**Total DTOs**: 78 (39 Request + 39 Response)  
**Estimated Time**: 3-4 hours

---

## 📊 IMPLEMENTATION CHECKLIST

### Identity Service (7 Controllers + 14 DTOs) ✅ IN PROGRESS
- [x] TenantController + TenantRequest/Response
- [x] TenantSettingsController + TenantSettingsRequest/Response
- [x] SystemSettingsController + SystemSettingsRequest/Response
- [x] ActivityLogController + ActivityLogRequest/Response
- [ ] UserRoleController + UserRoleRequest/Response
- [ ] LoginHistoryController + LoginHistoryRequest/Response
- [ ] FeatureFlagController + FeatureFlagRequest/Response

### Academy Service Phase 1 (9 Controllers + 18 DTOs)
- [ ] StudentParentController + DTOs
- [ ] ParentProfileController + DTOs
- [ ] StudentDocumentController + DTOs
- [ ] StudentSkillLevelController + DTOs
- [ ] TeacherDocumentController + DTOs
- [ ] TeacherSkillLevelController + DTOs
- [ ] CourseModuleController + DTOs
- [ ] CourseLessonController + DTOs
- [ ] CourseMaterialController + DTOs

### Academy Service Phase 2 (7 Controllers + 14 DTOs)
- [ ] ClassScheduleController + DTOs
- [ ] ClassSessionController + DTOs
- [ ] SessionAttendanceController + DTOs
- [ ] ClassScheduleExceptionController + DTOs
- [ ] AssignmentController + DTOs
- [ ] AssignmentSubmissionController + DTOs
- [ ] AssignmentFeedbackController + DTOs

### Connect Service (8 Controllers + 16 DTOs)
- [ ] LeadStatusController + DTOs
- [ ] LeadNoteController + DTOs
- [ ] LeadTagController + DTOs
- [ ] LeadActivityController + DTOs
- [ ] LeadAssignmentController + DTOs
- [ ] ChatMessageController + DTOs
- [ ] CallLogController + DTOs
- [ ] EmailLogController + DTOs

### Payment Service (3 Controllers + 6 DTOs)
- [ ] PaymentMethodController + DTOs
- [ ] PaymentScheduleController + DTOs
- [ ] RefundController + DTOs

### Attendance Service (2 Controllers + 4 DTOs)
- [ ] AttendanceExceptionController + DTOs
- [ ] LeaveRequestController + DTOs

### Payroll Service (3 Controllers + 6 DTOs)
- [ ] SalaryController + DTOs
- [ ] PayrollScheduleController + DTOs
- [ ] DeductionController + DTOs

---

## 🏗️ CONTROLLER PATTERN

```java
@RestController
@RequestMapping("/api/v1/resource")
@RequiredArgsConstructor
@Slf4j
public class ResourceController {
    private final ResourceService service;
    
    @GetMapping
    public ResponseEntity<List<ResourceResponse>> getAll() {
        List<Resource> resources = service.getAll();
        return ResponseEntity.ok(resources.stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponse> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(r -> ResponseEntity.ok(toResponse(r)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<ResourceResponse> create(@Valid @RequestBody ResourceRequest request) {
        Resource resource = toEntity(request);
        Resource created = service.create(resource);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(created));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ResourceResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ResourceRequest request) {
        Resource resource = toEntity(request);
        Resource updated = service.update(id, resource);
        return ResponseEntity.ok(toResponse(updated));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    private ResourceResponse toResponse(Resource r) {
        return ResourceResponse.builder()
                // map all fields
                .build();
    }
    
    private Resource toEntity(ResourceRequest request) {
        return Resource.builder()
                // map all fields
                .build();
    }
}
```

---

## 📝 DTO PATTERNS

### Request DTO (with Validation)
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceRequest {
    
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
    private String name;
    
    @NotNull(message = "Tenant ID is required")
    private Long tenantId;
    
    @Email(message = "Invalid email format")
    private String email;
    
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone format")
    private String phone;
    
    @Min(value = 0, message = "Must be non-negative")
    @Max(value = 100, message = "Cannot exceed 100")
    private Integer score;
    
    // Other fields without validation
    private String description;
    private Boolean isActive;
}
```

### Response DTO (No Validation)
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceResponse {
    private Long id;
    private String name;
    private Long tenantId;
    private String email;
    private String phone;
    private Integer score;
    private String description;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

---

## 🔧 VALIDATION ANNOTATIONS

Common validations used:
- `@NotNull` - Field cannot be null
- `@NotBlank` - String cannot be null or empty
- `@NotEmpty` - Collection/Array cannot be empty
- `@Size(min, max)` - String/Collection size constraints
- `@Min(value)` - Minimum numeric value
- `@Max(value)` - Maximum numeric value
- `@Email` - Valid email format
- `@Pattern(regexp)` - Regex pattern matching
- `@Past` - Date must be in the past
- `@Future` - Date must be in the future
- `@Positive` - Number must be positive
- `@PositiveOrZero` - Number must be >= 0

---

## 🚀 HTTP STATUS CODES

Responses use appropriate status codes:
- `200 OK` - Successful GET, PUT
- `201 CREATED` - Successful POST
- `204 NO CONTENT` - Successful DELETE
- `400 BAD REQUEST` - Validation errors
- `404 NOT FOUND` - Resource not found
- `500 INTERNAL SERVER ERROR` - Server errors

---

## 📡 API ENDPOINT CONVENTIONS

**Base URL**: `/api/v1/{resource}`

Standard CRUD endpoints:
- `GET /api/v1/{resource}` - Get all resources
- `GET /api/v1/{resource}/{id}` - Get resource by ID
- `POST /api/v1/{resource}` - Create new resource
- `PUT /api/v1/{resource}/{id}` - Update resource
- `DELETE /api/v1/{resource}/{id}` - Delete resource

Custom endpoints:
- `GET /api/v1/{resource}/search?query=` - Search resources
- `GET /api/v1/{resource}/tenant/{tenantId}` - Filter by tenant
- `GET /api/v1/{resource}/active` - Get active resources
- `POST /api/v1/{resource}/{id}/action` - Perform action

---

## 📦 PACKAGE STRUCTURE

```
src/main/java/com/lera/{service}/
├── controller/
│   ├── TenantController.java
│   ├── UserRoleController.java
│   └── ...
├── dto/
│   ├── TenantRequest.java
│   ├── TenantResponse.java
│   ├── UserRoleRequest.java
│   ├── UserRoleResponse.java
│   └── ...
├── service/
│   ├── TenantService.java
│   └── ...
├── repository/
│   ├── TenantRepository.java
│   └── ...
└── entity/
    ├── Tenant.java
    └── ...
```

---

## 🎯 IMPLEMENTATION STRATEGY

### Phase 1: Identity Service (Priority: Highest)
Foundation for multi-tenancy, authentication, authorization

### Phase 2: Academy Service
Core business logic for education management

### Phase 3: Connect Service
CRM and communication features

### Phase 4: Payment Service
Financial transactions and billing

### Phase 5: Attendance Service
Attendance tracking and leave management

### Phase 6: Payroll Service
Salary and payroll processing

---

## ✅ QUALITY CHECKLIST

For each controller, ensure:
- [x] Proper REST annotations (@RestController, @RequestMapping)
- [x] Dependency injection via constructor (@RequiredArgsConstructor)
- [x] Logging with SLF4J (@Slf4j)
- [x] Request validation (@Valid)
- [x] Proper HTTP status codes
- [x] Error handling (via service layer)
- [x] DTO mapping (toEntity/toResponse)
- [x] API documentation ready (comments)

For each DTO, ensure:
- [x] Lombok annotations (@Data, @Builder, etc.)
- [x] Proper validation annotations (Request DTOs)
- [x] No validation on Response DTOs
- [x] All entity fields mapped
- [x] Proper data types (LocalDate, LocalDateTime, BigDecimal)

---

## 🔄 AUTOMATED GENERATION APPROACH

Due to the large volume (39 controllers + 78 DTOs), I will:

1. **Create templates** for common patterns
2. **Batch generate** files per service
3. **Use shell scripts** for file creation
4. **Maintain consistency** across all controllers
5. **Follow naming conventions** strictly

This approach ensures:
- ✅ Speed (batch creation)
- ✅ Consistency (templates)
- ✅ Quality (patterns)
- ✅ Maintainability (conventions)

---

## 📊 PROGRESS TRACKING

**Current Status**:
- Total Files: 109 (entities, repos, services)
- Controllers: 4/39 (10%) - In Progress
- DTOs: 8/78 (10%) - In Progress
- Overall: 121/226 (54%)

**Next Steps**:
1. Complete Identity Service (3 more controllers)
2. Academy Service Phase 1 (9 controllers)
3. Academy Service Phase 2 (7 controllers)
4. Connect Service (8 controllers)
5. Payment Service (3 controllers)
6. Attendance Service (2 controllers)
7. Payroll Service (3 controllers)

---

**Document Status**: Living Document  
**Last Updated**: January 2025  
**Implementation**: In Progress
