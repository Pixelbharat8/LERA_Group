# 🚀 Phase 2: Core Features Implementation Guide

## 📋 Overview
**Phase**: 2 of 4  
**Priority**: HIGH  
**Timeline**: 2-3 weeks  
**Entities**: 20  
**Services**: Identity (1), Academy (8), Connect (7), Payment (3), Attendance (1)

---

## 🎯 Phase 2 Goals

Implement core operational features:
1. **Class Scheduling** - Recurring class schedules
2. **Assignments System** - Homework & submissions
3. **Advanced CRM** - Lead pipeline, notes, tags, activities
4. **Payment Extensions** - Payment methods, scholarships
5. **Document Management** - Teacher & student documents
6. **Attendance Exceptions** - Special attendance cases

---

## 📊 Entities to Implement (20)

### 🏫 Academy Service (8 entities)

#### 1. ClassSchedule
```java
@Entity
@Table(name = "class_schedules")
public class ClassSchedule {
    private UUID id;
    private UUID classId;
    private Integer dayOfWeek; // 1=Monday, 7=Sunday
    private LocalTime startTime;
    private LocalTime endTime;
    private String room;
    private Boolean isActive;
    private LocalDate effectiveFrom;
    private LocalDate effectiveTo;
}
```

**Use Case**: Define recurring weekly class schedules
**Repository Methods**: 
- `findByClassId(UUID classId)`
- `findByClassIdAndIsActiveTrue(UUID classId)`
- `findByDayOfWeek(Integer dayOfWeek)`

---

#### 2. ClassAssignment
```java
@Entity
@Table(name = "class_assignments")
public class ClassAssignment {
    private UUID id;
    private UUID classId;
    private UUID lessonId;
    private String assignmentName;
    private String description;
    private String assignmentType; // homework, quiz, project, exam
    private BigDecimal maxScore;
    private LocalDateTime dueDate;
    private String instructions;
    private String attachments; // JSON
}
```

**Use Case**: Teachers assign homework/projects to classes
**Repository Methods**:
- `findByClassId(UUID classId)`
- `findByClassIdAndDueDateAfter(UUID classId, LocalDateTime date)`
- `findByLessonId(UUID lessonId)`

---

#### 3. AssignmentSubmission
```java
@Entity
@Table(name = "assignment_submissions")
public class AssignmentSubmission {
    private UUID id;
    private UUID assignmentId;
    private UUID studentId;
    private LocalDateTime submittedAt;
    private String submissionText;
    private String attachments; // JSON
    private BigDecimal score;
    private String feedback;
    private UUID gradedBy;
    private LocalDateTime gradedAt;
    private String status; // PENDING, SUBMITTED, GRADED, LATE
}
```

**Use Case**: Students submit assignments, teachers grade
**Repository Methods**:
- `findByAssignmentId(UUID assignmentId)`
- `findByStudentId(UUID studentId)`
- `findByAssignmentIdAndStudentId(UUID assignmentId, UUID studentId)`

---

#### 4-5. TeacherDocument & TeacherSkillLevel
```java
@Entity
@Table(name = "teacher_documents")
public class TeacherDocument {
    private UUID id;
    private UUID teacherId;
    private String documentType; // resume, certificate, id_card, contract
    private String documentName;
    private String filePath;
    private String fileUrl;
    private LocalDate expiresAt;
    private Boolean isVerified;
}

@Entity
@Table(name = "teacher_skill_levels")
public class TeacherSkillLevel {
    private UUID id;
    private UUID teacherId;
    private String skillCategory; // teaching, curriculum, technology
    private String skillName;
    private String level; // beginner, intermediate, expert
    private Integer yearsExperience;
    private String certification;
}
```

---

#### 6. CenterSettings
```java
@Entity
@Table(name = "center_settings")
public class CenterSettings {
    private UUID id;
    private UUID centerId;
    private String settingKey;
    private String settingValue;
    private String settingType; // text, number, boolean, json
}
```

**Use Case**: Each center has custom settings (operating hours, policies, etc.)

---

#### 7-8. Student Extended (Already Created ✅)
- StudentDocument ✅
- StudentSkillLevel ✅

---

### 📞 Connect Service - CRM Extensions (7 entities)

#### 1. LeadStatus
```java
@Entity
@Table(name = "lead_statuses")
public class LeadStatus {
    private UUID id;
    private String statusName; // New, Contacted, Qualified, Won, Lost
    private String statusNameVi;
    private String color; // #3B82F6
    private Integer displayOrder;
    private Boolean isActive;
}
```

**Use Case**: Define CRM pipeline stages
**Seed Data**: New, Contacted, Qualified, Proposal Sent, Won, Lost

---

#### 2. LeadNote
```java
@Entity
@Table(name = "lead_notes")
public class LeadNote {
    private UUID id;
    private UUID leadId;
    private String note;
    private UUID createdBy;
    private LocalDateTime createdAt;
}
```

**Use Case**: Sales team adds notes to leads

---

#### 3. LeadTag
```java
@Entity
@Table(name = "lead_tags")
public class LeadTag {
    private UUID id;
    private String tagName; // VIP, Urgent, Hot, Cold
    private String color;
}

@Entity
@Table(name = "lead_tag_assignments")
public class LeadTagAssignment {
    private UUID id;
    private UUID leadId;
    private UUID tagId;
}
```

**Use Case**: Categorize leads with tags

---

#### 4. LeadActivity
```java
@Entity
@Table(name = "lead_activities")
public class LeadActivity {
    private UUID id;
    private UUID leadId;
    private String activityType; // call, email, meeting, demo
    private LocalDateTime activityDate;
    private String description;
    private Integer durationMinutes;
    private String outcome; // positive, negative, neutral
}
```

**Use Case**: Track all interactions with leads

---

#### 5. LeadAssignment
```java
@Entity
@Table(name = "lead_assignments")
public class LeadAssignment {
    private UUID id;
    private UUID leadId;
    private UUID assignedTo; // User ID
    private UUID assignedBy;
    private LocalDateTime assignedAt;
    private String notes;
}
```

**Use Case**: Assign leads to sales representatives

---

### 💰 Payment Service (3 entities)

#### 1. PaymentMethod
```java
@Entity
@Table(name = "payment_methods")
public class PaymentMethod {
    private UUID id;
    private String methodName; // Cash, Bank Transfer, Credit Card
    private String methodCode;
    private Boolean isOnline;
    private Boolean isActive;
    private Integer displayOrder;
}
```

**Seed Data**: Cash, Bank Transfer, Credit Card, MoMo, VNPay

---

#### 2-3. Scholarship System
```java
@Entity
@Table(name = "scholarships")
public class Scholarship {
    private UUID id;
    private String scholarshipName;
    private String scholarshipCode;
    private String scholarshipType; // percentage, fixed_amount
    private BigDecimal discountPercentage;
    private BigDecimal discountAmount;
    private String eligibilityCriteria;
    private LocalDate validFrom;
    private LocalDate validTo;
    private Boolean isActive;
}

@Entity
@Table(name = "student_scholarships")
public class StudentScholarship {
    private UUID id;
    private UUID studentId;
    private UUID scholarshipId;
    private UUID approvedBy;
    private LocalDateTime approvedAt;
    private String status; // ACTIVE, EXPIRED, REVOKED
}
```

---

### 📅 Attendance Service (1 entity)

#### AttendanceException
```java
@Entity
@Table(name = "attendance_exceptions")
public class AttendanceException {
    private UUID id;
    private UUID attendanceId;
    private String exceptionType; // LATE_ARRIVAL, EARLY_DEPARTURE, MEDICAL, EXCUSED
    private String reason;
    private UUID approvedBy;
    private LocalDateTime approvedAt;
    private String notes;
}
```

**Use Case**: Handle special attendance cases (late, sick leave, etc.)

---

## 🔄 Implementation Order

### Week 1: Class Management
```
Day 1-2: ClassSchedule
  ├── Entity + Repository
  ├── Service (CRUD + schedule conflicts)
  └── Controller (REST API)

Day 3-5: Assignments System
  ├── ClassAssignment entity
  ├── AssignmentSubmission entity
  ├── Services (create, submit, grade)
  └── Controllers + DTOs
```

### Week 2: CRM Extensions
```
Day 1-2: Lead Pipeline
  ├── LeadStatus entity (seed data)
  ├── LeadNote entity
  ├── LeadTag + LeadTagAssignment
  └── Update Lead entity with statusId

Day 3-5: Lead Activities & Assignment
  ├── LeadActivity entity
  ├── LeadAssignment entity
  ├── Services (activity tracking)
  └── Controllers + DTOs
```

### Week 3: Documents & Payments
```
Day 1-2: Teacher Management
  ├── TeacherDocument entity
  ├── TeacherSkillLevel entity
  └── Services + Controllers

Day 3-4: Payment Extensions
  ├── PaymentMethod entity (seed data)
  ├── Scholarship entities
  └── Services + Controllers

Day 5: Final Tasks
  ├── CenterSettings entity
  ├── AttendanceException entity
  └── Integration testing
```

---

## 🛠️ Implementation Template

### For Each Entity:

#### 1. Entity Class
```java
@Entity
@Table(name = "table_name")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EntityName {
    @Id
    @GeneratedValue(generator = "UUID")
    private UUID id;
    
    // Fields...
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
```

#### 2. Repository Interface
```java
@Repository
public interface EntityNameRepository extends JpaRepository<EntityName, UUID> {
    // Custom query methods
    List<EntityName> findByParentId(UUID parentId);
    Optional<EntityName> findByCode(String code);
}
```

#### 3. Service Class
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class EntityNameService {
    private final EntityNameRepository repository;
    
    public EntityName create(EntityNameRequest request) {
        // Validation
        // Business logic
        // Save
        return repository.save(entity);
    }
    
    public EntityName getById(UUID id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Entity not found"));
    }
    
    public List<EntityName> getAll() {
        return repository.findAll();
    }
    
    public EntityName update(UUID id, EntityNameRequest request) {
        // Find, update, save
    }
    
    public void delete(UUID id) {
        repository.deleteById(id);
    }
}
```

#### 4. Controller Class
```java
@RestController
@RequestMapping("/api/entity-names")
@RequiredArgsConstructor
@Tag(name = "Entity Management")
public class EntityNameController {
    private final EntityNameService service;
    
    @PostMapping
    public ResponseEntity<EntityNameResponse> create(@Valid @RequestBody EntityNameRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(toResponse(service.create(request)));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<EntityNameResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(toResponse(service.getById(id)));
    }
    
    @GetMapping
    public ResponseEntity<List<EntityNameResponse>> getAll() {
        return ResponseEntity.ok(service.getAll().stream()
            .map(this::toResponse)
            .toList());
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<EntityNameResponse> update(
        @PathVariable UUID id,
        @Valid @RequestBody EntityNameRequest request) {
        return ResponseEntity.ok(toResponse(service.update(id, request)));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

#### 5. DTOs
```java
@Data
@Builder
public class EntityNameRequest {
    @NotBlank(message = "Name is required")
    private String name;
    
    // Other fields with validation
}

@Data
@Builder
public class EntityNameResponse {
    private UUID id;
    private String name;
    private LocalDateTime createdAt;
    // Other fields
}
```

---

## 📊 API Endpoints to Create

### Class Schedule API
```http
POST   /api/classes/{classId}/schedules
GET    /api/classes/{classId}/schedules
GET    /api/schedules/{id}
PUT    /api/schedules/{id}
DELETE /api/schedules/{id}
GET    /api/schedules/conflicts?classId=X&dayOfWeek=1&startTime=09:00
```

### Assignment API
```http
POST   /api/classes/{classId}/assignments
GET    /api/classes/{classId}/assignments
GET    /api/assignments/{id}
PUT    /api/assignments/{id}
DELETE /api/assignments/{id}

POST   /api/assignments/{id}/submit
GET    /api/assignments/{id}/submissions
PUT    /api/submissions/{id}/grade
GET    /api/students/{studentId}/submissions
```

### Lead CRM API
```http
GET    /api/lead-statuses
POST   /api/lead-statuses
PUT    /api/leads/{id}/status

POST   /api/leads/{id}/notes
GET    /api/leads/{id}/notes

POST   /api/leads/{id}/tags
DELETE /api/leads/{id}/tags/{tagId}

POST   /api/leads/{id}/activities
GET    /api/leads/{id}/activities

POST   /api/leads/{id}/assign
GET    /api/leads/my-leads
```

### Payment & Scholarship API
```http
GET    /api/payment-methods
POST   /api/payment-methods

GET    /api/scholarships
POST   /api/scholarships
PUT    /api/scholarships/{id}

POST   /api/students/{id}/scholarships
GET    /api/students/{id}/scholarships
PUT    /api/student-scholarships/{id}/revoke
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Repository: findBy methods
- [ ] Service: business logic validation
- [ ] Controller: request/response mapping

### Integration Tests
- [ ] Class schedule conflict detection
- [ ] Assignment submission workflow
- [ ] Lead status pipeline transitions
- [ ] Scholarship eligibility calculation

### E2E Tests
- [ ] Teacher creates assignment → Student submits → Teacher grades
- [ ] Lead moves through pipeline stages
- [ ] Student applies for scholarship → Admin approves

---

## 📈 Success Metrics

### Completion Criteria:
- ✅ All 20 entities created
- ✅ All 20 repositories with queries
- ✅ All 20 services with business logic
- ✅ All 20 controllers with REST APIs
- ✅ All 40 DTOs (request + response)
- ✅ Unit tests (80% coverage)
- ✅ Integration tests pass
- ✅ API documentation (Swagger)

### Progress Tracking:
```
Phase 2: Core Features
├── Entities      [    0/20  ]  0%
├── Repositories  [    0/20  ]  0%
├── Services      [    0/20  ]  0%
├── Controllers   [    0/20  ]  0%
├── DTOs          [    0/40  ]  0%
└── Tests         [    0/60  ]  0%
```

---

## 🚀 Getting Started

### Generate Phase 2 Scaffolding:
```bash
# Create directory structure
mkdir -p backend/academy_service/src/main/java/com/lera/academy_service/{entity,repository,service,controller,dto}
mkdir -p backend/connect_service/src/main/java/com/lera/connect_service/{entity,repository,service,controller,dto}

# Generate entity templates
./scripts/generate-phase2-entities.sh

# Build and test
mvn clean install
mvn test
```

---

## 📞 Ready to Start Phase 2?

**Prerequisites:**
- ✅ Phase 1 complete (15 entities)
- ✅ Database migration applied
- ✅ Services running

**Choose your starting point:**
1. 🏫 Class Management (ClassSchedule, Assignments)
2. 📞 CRM Extensions (Statuses, Notes, Activities)
3. 💰 Payment System (Methods, Scholarships)
4. 📄 Document Management (Teacher docs)

**Let me know which module you want to implement first!** 🎯
