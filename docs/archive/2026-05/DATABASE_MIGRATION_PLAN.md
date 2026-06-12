# 📊 LERA Academy - Complete 107 Tables Migration Plan

## 🎯 Overview
**Status**: Ready for implementation  
**Current Tables**: 41  
**Target Tables**: 107  
**Tables to Add**: 66  
**Migration File**: `database/migrations/V2__add_missing_66_tables.sql`

---

## 📋 66 New Tables Breakdown

### A. Multi-Tenant + Auth (9 tables) 🏢
- ✅ `tenants` - Multi-tenant foundation
- ✅ `tenant_settings` - Tenant-specific settings
- ✅ `center_settings` - Center-specific settings
- ✅ `user_roles` - Explicit user-role mapping
- ✅ `login_history` - Track all logins
- ✅ `activity_logs` - Audit trail
- ✅ `impersonation_logs` - Admin impersonation tracking
- ✅ `system_settings` - Global system configuration
- ✅ `feature_flags` - Feature toggle system

### B. Students & Parents (5 tables) 👨‍👩‍👧‍👦
- ✅ `student_parents` - Student-parent relationships
- ✅ `parent_profiles` - Extended parent information
- ✅ `student_documents` - Document management
- ✅ `student_skill_levels` - Skill tracking

### C. Teachers (2 tables) 👨‍🏫
- ✅ `teacher_documents` - Teacher document management
- ✅ `teacher_skill_levels` - Teacher skill tracking

### D. Courses (3 tables) 📚
- ✅ `course_modules` - Course module breakdown
- ✅ `course_lessons` - Individual lessons
- ✅ `course_materials` - Learning materials

### E. Classes & Attendance (2 tables) 📅
- ✅ `class_schedules` - Recurring class schedules
- ✅ `attendance_exceptions` - Attendance special cases

### F. Assignments & Exams (2 tables) ✍️
- ✅ `class_assignments` - Assignment management
- ✅ `assignment_submissions` - Student submissions

### G. Certificates (2 tables) 🏆
- ✅ `certificate_templates` - Certificate designs
- ✅ `certificates` - Issued certificates

### H. CRM Extensions (13 tables) 📞
- ✅ `lead_statuses` - CRM status pipeline
- ✅ `lead_notes` - Lead notes
- ✅ `lead_tags` - Lead tagging system
- ✅ `lead_tag_assignments` - Tag assignments
- ✅ `lead_activities` - Activity tracking
- ✅ `lead_assignments` - Lead assignment
- ✅ `chat_messages` - In-app chat
- ✅ `call_logs` - Call tracking
- ✅ `email_logs` - Email tracking
- ✅ `crm_automations` - Automation workflows
- ✅ `crm_automation_rules` - Automation rules
- ✅ `crm_triggers` - Trigger history
- ✅ `marketing_campaigns` - Campaign management
- ✅ `campaign_leads` - Campaign lead tracking

### I. Payments (3 tables) 💰
- ✅ `payment_methods` - Payment method types
- ✅ `scholarships` - Scholarship programs
- ✅ `student_scholarships` - Student scholarship assignments

### J. Payroll (6 tables) 💵
- ✅ `payroll_cycles` - Payroll periods
- ✅ `teacher_salaries` - Salary records
- ✅ `salary_components` - Salary breakdown
- ✅ `salary_payouts` - Payout tracking
- ✅ `tax_settings` - Tax configuration
- ✅ `teacher_overtime` - Overtime tracking

### K. AI Gateway (6 tables) 🤖
- ✅ `ai_exam_requests` - AI exam generation requests
- ✅ `ai_generated_exams` - Generated exam content
- ✅ `ai_content_summaries` - AI summaries
- ✅ `ai_chat_sessions` - AI chat sessions
- ✅ `ai_chat_messages` - Chat history
- ✅ `ai_embeddings` - Vector embeddings

### L. Website (3 tables) 🌐
- ✅ `website_sections` - Dynamic sections
- ✅ `website_home_sections` - Home page sections
- ✅ `website_contacts` - Contact form submissions

### M. Sports / PlayCircle (6 tables) ⚽
- ✅ `sports_programs` - Sports programs
- ✅ `sports_teams` - Team management
- ✅ `sports_coaches` - Coach profiles
- ✅ `sports_matches` - Match records
- ✅ `sports_training_sessions` - Training sessions
- ✅ `sports_player_stats` - Player statistics

### N. Notifications (1 table) 🔔
- ✅ `notification_preferences` - User notification settings

### O. Storage / Media (1 table) 📁
- ✅ `files` - Generic file storage

### Q. Future Expansion (4 tables) 🚀
- ✅ `transport_routes` - Transportation routes
- ✅ `transport_students` - Student transport assignments
- ✅ `bookstore_products` - Bookstore inventory
- ✅ `bookstore_orders` - Bookstore orders

### R. Internal Ops (5 tables) 🔧
- ✅ `feature_flags` - Feature toggles
- ✅ `email_templates` - Email templates
- ✅ `sms_templates` - SMS templates
- ✅ `api_keys` - API key management
- ✅ `background_jobs` - Job queue

---

## 🔄 Multi-Tenant Support Added
Existing tables updated with `tenant_id`:
- ✅ `centers`
- ✅ `users`
- ✅ `course_programs`
- ✅ `leads`
- ✅ `invoices`

---

## 🚀 Implementation Phases

### **Phase 1: Critical Foundation** (Priority: HIGHEST)
**Tables**: 15 | **Timeline**: Week 1-2

**Database**:
- Tenants, tenant_settings, center_settings
- User_roles, login_history, activity_logs
- System_settings, feature_flags
- Student_parents, parent_profiles
- Email_templates, sms_templates

**Backend Entities Needed**:
```
identity_service:
  - Tenant.java
  - TenantSettings.java
  - UserRole.java
  - LoginHistory.java
  - ActivityLog.java
  - ImpersonationLog.java

academy_service:
  - StudentParent.java
  - ParentProfile.java
```

**API Endpoints**:
- `/api/tenants` - Tenant management
- `/api/users/{id}/roles` - Role assignment
- `/api/activity-logs` - Activity tracking
- `/api/students/{id}/parents` - Parent management

---

### **Phase 2: Core Features** (Priority: HIGH)
**Tables**: 20 | **Timeline**: Week 3-4

**Database**:
- Course modules, lessons, materials
- Class schedules
- Assignments & submissions
- Student/teacher documents
- Lead statuses, notes, tags
- Payment methods, scholarships

**Backend Entities Needed**:
```
academy_service:
  - CourseModule.java
  - CourseLesson.java
  - CourseMaterial.java
  - ClassSchedule.java
  - ClassAssignment.java
  - AssignmentSubmission.java
  - StudentDocument.java
  - TeacherDocument.java

connect_service:
  - LeadStatus.java
  - LeadNote.java
  - LeadTag.java
  - LeadActivity.java

payment_service:
  - PaymentMethod.java
  - Scholarship.java
```

---

### **Phase 3: Advanced Features** (Priority: MEDIUM)
**Tables**: 16 | **Timeline**: Week 5-6

**Database**:
- CRM automation & campaigns
- Certificates
- Payroll system
- Website management

**Backend Entities Needed**:
```
connect_service:
  - ChatMessage.java
  - CallLog.java
  - EmailLog.java
  - CrmAutomation.java
  - MarketingCampaign.java

academy_service:
  - Certificate.java
  - CertificateTemplate.java
  - WebsiteSection.java

payroll_service:
  - PayrollCycle.java
  - TeacherSalary.java
  - SalaryComponent.java
```

---

### **Phase 4: Optional Modules** (Priority: LOW)
**Tables**: 15 | **Timeline**: Week 7-8

**Database**:
- AI Gateway
- Sports module
- Transport & Bookstore
- Background jobs

**Backend Entities Needed**:
```
NEW: ai_gateway_service (Port 8086):
  - AiExamRequest.java
  - AiGeneratedExam.java
  - AiChatSession.java

NEW: sports_service (Port 8087):
  - SportsProgram.java
  - SportsTeam.java
  - SportsCoach.java
  - SportsMatch.java

academy_service:
  - TransportRoute.java
  - BookstoreProduct.java
```

---

## 🛠️ Technical Implementation Steps

### Step 1: Database Migration ✅
```bash
# Apply migration
psql -U postgres -d lera_academy < database/migrations/V2__add_missing_66_tables.sql

# Or using Flyway/Liquibase
mvn flyway:migrate
```

### Step 2: Generate Backend Entities (66 files)
For each new table, create:
1. **Entity class** (`@Entity`, `@Table`)
2. **Repository interface** (extends `JpaRepository`)
3. **Service class** (business logic)
4. **Controller class** (REST endpoints)
5. **DTO classes** (request/response)

**Example Structure**:
```
backend/identity_service/src/main/java/com/lera/identity/
  ├── entity/
  │   ├── Tenant.java
  │   ├── TenantSettings.java
  │   └── UserRole.java
  ├── repository/
  │   ├── TenantRepository.java
  │   ├── TenantSettingsRepository.java
  │   └── UserRoleRepository.java
  ├── service/
  │   ├── TenantService.java
  │   └── UserRoleService.java
  └── controller/
      ├── TenantController.java
      └── UserRoleController.java
```

### Step 3: Update Existing Services
- Add `tenant_id` filtering to all queries
- Implement multi-tenant context
- Add tenant validation

### Step 4: Create New Microservices
```
backend/
  ├── sports_service/ (NEW - Port 8086)
  ├── ai_gateway_service/ (NEW - Port 8087)
  ├── analytics_service/ (NEW - Port 8088)
  └── transport_service/ (NEW - Port 8089)
```

### Step 5: Frontend Updates
Update frontend to support:
- Multi-tenant switching
- New modules (Sports, AI, Certificates)
- Enhanced CRM features
- Parent portal

---

## 📊 Entity Generation Roadmap

### Identity Service (8 → 14 entities) +6
**Current**: User, Role, Permission, Center  
**Add**: Tenant, TenantSettings, UserRole, LoginHistory, ActivityLog, ImpersonationLog

### Academy Service (11 → 30 entities) +19
**Current**: Student, Teacher, Class, CourseProgram, Enrollment, BlogPost, Testimonial, CmsSetting, Banner, PointTransaction  
**Add**: CourseModule, CourseLesson, CourseMaterial, ClassSchedule, ClassAssignment, AssignmentSubmission, Certificate, CertificateTemplate, StudentParent, ParentProfile, StudentDocument, TeacherDocument, StudentSkillLevel, TeacherSkillLevel, WebsiteSection, WebsiteHomeSection, WebsiteContact, TransportRoute, BookstoreProduct

### Connect Service (2 → 16 entities) +14
**Current**: Lead, Followup  
**Add**: LeadStatus, LeadNote, LeadTag, LeadActivity, LeadAssignment, ChatMessage, CallLog, EmailLog, CrmAutomation, CrmAutomationRule, CrmTrigger, MarketingCampaign, CampaignLead

### Payment Service (1 → 5 entities) +4
**Current**: Payment  
**Add**: PaymentMethod, Scholarship, StudentScholarship, Invoice

### Payroll Service (1 → 7 entities) +6
**Current**: PayrollRecord  
**Add**: PayrollCycle, TeacherSalary, SalaryComponent, SalaryPayout, TaxSetting, TeacherOvertime

### Attendance Service (1 → 2 entities) +1
**Current**: AttendanceRecord  
**Add**: AttendanceException

### NEW: Sports Service (6 entities) 🆕
SportsProgram, SportsTeam, SportsCoach, SportsMatch, SportsTrainingSession, SportsPlayerStats

### NEW: AI Gateway Service (6 entities) 🆕
AiExamRequest, AiGeneratedExam, AiContentSummary, AiChatSession, AiChatMessage, AiEmbedding

---

## 🔐 Security & Performance

### Multi-Tenant Security
```java
@Aspect
public class TenantFilterAspect {
    @Before("@annotation(TenantScoped)")
    public void filterByTenant(JoinPoint jp) {
        // Auto-inject tenant_id filter
    }
}
```

### Indexes Added
- ✅ All foreign keys indexed
- ✅ Tenant_id indexed on all tables
- ✅ Created_at indexed for time-series queries
- ✅ Status fields indexed for filtering

### Caching Strategy
```yaml
cache:
  - system_settings (1 hour)
  - tenants (30 minutes)
  - feature_flags (5 minutes)
  - course_programs (1 hour)
```

---

## 📈 Database Size Estimate

| Module | Tables | Est. Rows/Year | Storage |
|--------|--------|----------------|---------|
| Multi-tenant | 9 | 1K | 10 MB |
| Students/Parents | 5 | 50K | 500 MB |
| Courses | 3 | 10K | 100 MB |
| Classes | 2 | 5K | 50 MB |
| Assignments | 2 | 100K | 1 GB |
| Certificates | 2 | 10K | 200 MB |
| CRM | 13 | 500K | 5 GB |
| Payments | 3 | 50K | 500 MB |
| Payroll | 6 | 10K | 100 MB |
| AI Gateway | 6 | 100K | 2 GB |
| Sports | 6 | 20K | 200 MB |
| Other | 9 | 50K | 500 MB |
| **TOTAL** | **66** | **~900K** | **~10 GB** |

---

## ✅ Migration Checklist

### Database
- [ ] Review migration script
- [ ] Backup existing database
- [ ] Run migration on dev environment
- [ ] Verify all 107 tables exist
- [ ] Test foreign key constraints
- [ ] Verify indexes created
- [ ] Seed initial data

### Backend (Phase 1 - Critical)
- [ ] Create Tenant entity + CRUD
- [ ] Create UserRole entity + CRUD
- [ ] Create LoginHistory entity
- [ ] Create ActivityLog entity
- [ ] Create StudentParent entity + CRUD
- [ ] Add tenant_id filtering
- [ ] Update existing controllers

### Backend (Phase 2 - Core)
- [ ] Create Course entities (Module, Lesson, Material)
- [ ] Create Assignment entities
- [ ] Create Document entities
- [ ] Create Lead extension entities
- [ ] Create Payment extension entities

### Backend (Phase 3 - Advanced)
- [ ] Create CRM automation entities
- [ ] Create Certificate entities
- [ ] Create Payroll entities
- [ ] Create Website entities

### Backend (Phase 4 - Optional)
- [ ] Create Sports service + entities
- [ ] Create AI Gateway service + entities
- [ ] Create Transport entities
- [ ] Create Bookstore entities

### Testing
- [ ] Unit tests for new entities
- [ ] Integration tests for APIs
- [ ] Multi-tenant isolation tests
- [ ] Performance tests
- [ ] Load testing

### Frontend
- [ ] Tenant switcher UI
- [ ] Parent portal
- [ ] Certificate generator
- [ ] CRM automation UI
- [ ] Sports management UI
- [ ] AI features UI

### Deployment
- [ ] Update docker-compose.yml
- [ ] Update environment variables
- [ ] Deploy database migration
- [ ] Deploy backend services
- [ ] Deploy frontend
- [ ] Smoke tests

---

## 🎯 Next Steps

**Immediate Actions:**
1. ✅ Review migration script V2__add_missing_66_tables.sql
2. 📝 Choose implementation approach:
   - **Option A**: Phase-by-phase (Recommended)
   - **Option B**: All at once
3. 🚀 Start Phase 1 (Foundation - 15 tables)

**Would you like me to:**
1. Generate Phase 1 Java entities (Tenant, UserRole, etc.)?
2. Update existing services for multi-tenant support?
3. Create new Sports/AI services?
4. Generate frontend components for new features?

---

**Status**: 📊 Migration Plan Complete | 🟢 Ready for Implementation
