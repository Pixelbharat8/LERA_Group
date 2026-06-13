# 🚀 LERA ECOSYSTEM V2.0 - Multi-Tenant Architecture

## 📊 Migration from V1 to V2

### Current Status (V1)
- ✅ Single-tenant architecture
- ✅ 41 tables for LERA Academy
- ✅ Basic LMS, CRM, Payments
- ✅ 6 microservices operational

### Target (V2) - Enterprise Multi-Tenant
- 🎯 **107 tables** across all modules
- 🎯 **Multi-tenant** with SuperAdmin God Mode
- 🎯 **8 major sections** + Analytics
- 🎯 **Complete API ecosystem**

---

## 📋 Complete Table List (107 Tables)

### 🔴 A. MULTI-TENANT SYSTEM (13 tables)
1. `tenants` - Organizations/educational brands
2. `tenant_settings` - Themes, logos, feature toggles
3. `centers` - Learning centers under tenant
4. `center_settings` - Operating hours, locale
5. `roles` - System-wide roles
6. `permissions` - Granular permissions
7. `role_permissions` - Role→permission mapping
8. `users` - All system users
9. `user_roles` - User→role mapping
10. `impersonation_logs` - SuperAdmin impersonation tracking
11. `audit_logs` - All create/update/delete events
12. `activity_logs` - Business activity tracking
13. `login_history` - IP, device, failed logins

### 🟦 B. LERA ACADEMY - LMS (25 tables)
**Students (7 tables)**
14. `students`
15. `student_profiles`
16. `student_parents`
17. `parent_profiles`
18. `student_documents`
19. `student_progress`
20. `student_skill_levels`

**Teachers (4 tables)**
21. `teachers`
22. `teacher_profiles`
23. `teacher_documents`
24. `teacher_skill_levels`

**Courses (4 tables)**
25. `courses`
26. `course_modules`
27. `course_lessons`
28. `course_materials`

**Classes (6 tables)**
29. `classes`
30. `class_schedules`
31. `class_students`
32. `class_attendance`
33. `class_assignments`
34. `assignment_submissions`

**Exams (2 tables)**
35. `exams`
36. `exam_results`

**Certificates (2 tables)**
37. `certificates`
38. `certificate_templates`

### 🟪 C. CRM - LERA CONNECT (16 tables)
**Leads (8 tables)**
39. `leads`
40. `lead_sources`
41. `lead_statuses`
42. `lead_notes`
43. `lead_tags`
44. `lead_activities`
45. `lead_assignments`
46. `lead_followups`

**Communication (3 tables)**
47. `chat_messages`
48. `call_logs`
49. `email_logs`

**Automation (3 tables)**
50. `crm_automations`
51. `crm_automation_rules`
52. `crm_triggers`

**Campaigns (2 tables)**
53. `marketing_campaigns`
54. `campaign_leads`

### 🟧 D. PAYMENTS & PAYROLL (17 tables)
**Payments (6 tables)**
55. `invoices`
56. `invoice_items`
57. `payments`
58. `payment_methods`
59. `discounts`
60. `scholarships`

**Fee Rule Engine (5 tables)**
61. `fee_rules`
62. `fee_rule_conditions`
63. `fee_rule_actions`
64. `fee_rule_tests`
65. `fee_previews`

**Payroll (6 tables)**
66. `payroll_cycles`
67. `teacher_salaries`
68. `salary_components`
69. `salary_payouts`
70. `tax_settings`
71. `teacher_overtime`

### 🟩 E. ATTENDANCE (3 tables)
72. `attendance_sessions`
73. `student_attendance`
74. `attendance_exceptions`

### 🟨 F. AI GATEWAY (6 tables)
75. `ai_exam_requests`
76. `ai_generated_exams`
77. `ai_content_summaries`
78. `ai_chat_sessions`
79. `ai_chat_messages`
80. `ai_embeddings`

### 🟫 G. PUBLIC WEBSITE (7 tables)
81. `website_pages`
82. `website_sections`
83. `website_home_sections`
84. `website_courses`
85. `website_testimonials`
86. `website_blog_posts`
87. `website_contacts`

### 🟪 H. PLAYCIRCLE SPORTS (6 tables)
88. `sports_programs`
89. `sports_teams`
90. `sports_coaches`
91. `sports_matches`
92. `sports_training_sessions`
93. `sports_player_stats`

### 🟦 I. SYSTEM UTILITIES (3 tables)
94. `notifications`
95. `notification_preferences`
96. `system_settings`

### 🟥 J. STORAGE (2 tables)
97. `files`
98. `media_library`

### 🔥 K. ANALYTICS - Materialized Views (5 views)
99. `mv_center_dashboard`
100. `mv_academy_performance`
101. `mv_connect_leads_analytics`
102. `mv_teacher_salary_summary`
103. `mv_payment_overview`

### 🟧 L. FUTURE MODULES (4 tables)
104. `transport_routes`
105. `transport_students`
106. `bookstore_products`
107. `bookstore_orders`

---

## 🎯 Key Architectural Changes

### 1. Multi-Tenancy Architecture
```
SuperAdmin (God Mode)
    ↓
Tenants (Organizations)
    ↓
Centers (Locations)
    ↓
Users + Students + Teachers
```

### 2. Enhanced Security
- **Tenant Isolation**: All data scoped by tenant_id
- **Role-Based Access**: Hierarchical permissions
- **Impersonation Tracking**: SuperAdmin can switch context
- **Audit Trail**: Complete activity logging
- **2FA Support**: Two-factor authentication

### 3. Advanced Features
- **Rule Engine**: Dynamic fee calculations
- **Automation**: CRM workflow automation
- **AI Integration**: Exam generation, content summaries
- **Analytics**: Materialized views for dashboards
- **Multi-Center**: Single tenant, multiple locations

---

## 📡 Complete API Endpoints (50+ endpoints)

### 🔵 A. Authentication & User Management
```
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me
POST   /auth/reset-password
POST   /auth/impersonate
POST   /auth/stop-impersonation
```

### 🔵 B. Tenant & Center Management (SuperAdmin Only)
```
GET    /tenants
POST   /tenants
PUT    /tenants/{id}
DELETE /tenants/{id}

GET    /centers
POST   /centers
PUT    /centers/{id}
DELETE /centers/{id}
```

### 🟦 C. Student Management
```
GET    /students
POST   /students
GET    /students/{id}
PUT    /students/{id}
DELETE /students/{id}
GET    /students/{id}/parents
POST   /students/{id}/parents
GET    /students/{id}/progress
POST   /students/{id}/progress
```

### 🟩 D. Teacher Management
```
GET    /teachers
POST   /teachers
PUT    /teachers/{id}
DELETE /teachers/{id}
```

### 📘 E. Course Management
```
GET    /courses
POST   /courses
GET    /courses/{id}
PUT    /courses/{id}
DELETE /courses/{id}
POST   /courses/{id}/modules
POST   /courses/{id}/lessons
POST   /courses/{id}/materials
```

### 📚 F. Class Management
```
GET    /classes
POST   /classes
PUT    /classes/{id}
POST   /classes/{id}/students
DELETE /classes/{id}/students/{studentId}
GET    /classes/{id}/attendance
POST   /classes/{id}/attendance
```

### 📝 G. Exams & Assignments
```
POST   /exams
GET    /exams/{id}
POST   /exams/{id}/results
POST   /assignments
POST   /assignments/{id}/submissions
```

### 🏆 H. Certificates
```
POST   /certificates
GET    /certificates/{id}
POST   /certificates/{id}/generate
```

### 🟪 I. CRM - Leads & Pipelines
```
GET    /leads
POST   /leads
PUT    /leads/{id}
POST   /leads/{id}/assign
POST   /leads/{id}/status
POST   /leads/{id}/followup
POST   /chat/{leadId}
GET    /chat/{leadId}
POST   /calls
POST   /emails
```

### 🟧 J. Payments & Invoicing
```
GET    /payments
POST   /payments
GET    /invoices
POST   /invoices
POST   /invoices/{id}/pay
```

### 💰 K. Payroll System
```
POST   /payroll/cycles
GET    /payroll/cycles/{id}
POST   /payroll/salaries/{teacherId}
POST   /payroll/payouts
```

### 🧠 L. AI Gateway
```
POST   /ai/exams/generate
POST   /ai/summarize
POST   /ai/chat
GET    /ai/chat/{sessionId}
```

### 🌍 M. Public Website Management
```
GET    /public/home
GET    /public/courses
POST   /public/contact
POST   /public/pages
POST   /public/sections
```

### 🟨 N. Notifications
```
GET    /notifications
POST   /notifications/read
```

### 🎾 O. Sports - PlayCircle
```
GET    /sports/programs
POST   /sports/programs
GET    /sports/teams
POST   /sports/teams
POST   /sports/stats/update
```

---

## 🏗️ Microservice Architecture V2

### Service Ownership

| Service | Tables Owned | Port |
|---------|-------------|------|
| **Auth Service** | users, roles, permissions, login_history | 8080 |
| **Tenant Service** | tenants, centers, tenant_settings | 8081 |
| **Academy Service** | students, teachers, courses, classes, exams | 8082 |
| **CRM Service** | leads, chat, automation, campaigns | 8083 |
| **Payment Service** | invoices, payments, discounts | 8084 |
| **Payroll Service** | payroll_cycles, teacher_salaries | 8085 |
| **AI Gateway** | ai_exams, ai_summaries, ai_chat | 8086 |
| **Website Service** | website_pages, sections, blogs | 8087 |
| **Notification Service** | notifications, preferences | 8088 |
| **Analytics Service** | materialized views (read-only) | 8089 |

---

## 🔄 Migration Strategy

### Phase 1: Database Schema Migration
1. **Backup V1 database**
   ```bash
   pg_dump lera > backup_v1_$(date +%Y%m%d).sql
   ```

2. **Add tenant infrastructure**
   - Create tenants table
   - Create default tenant: "LERA Academy"
   - Add tenant_id to existing tables

3. **Migrate existing data**
   ```sql
   -- Create default tenant
   INSERT INTO tenants (code, name, slug, status)
   VALUES ('LERA', 'LERA Academy', 'lera', 'ACTIVE');
   
   -- Update existing tables with tenant_id
   ALTER TABLE centers ADD COLUMN tenant_id UUID;
   UPDATE centers SET tenant_id = (SELECT id FROM tenants WHERE code = 'LERA');
   ```

### Phase 2: New Tables
1. Add all new tables from V2 schema
2. Create indexes for performance
3. Set up foreign key constraints
4. Populate seed data

### Phase 3: Microservices Update
1. Update existing services for multi-tenancy
2. Add new services (Analytics, Website)
3. Update authentication to include tenant context
4. Test cross-service communication

### Phase 4: Frontend Updates
1. Add tenant selector for SuperAdmin
2. Update all API calls to include tenant context
3. Add new UI for advanced features
4. Test multi-tenant isolation

### Phase 5: Testing & Rollout
1. Test data isolation between tenants
2. Performance testing with multiple tenants
3. Security audit
4. Gradual rollout

---

## 🎨 New Features in V2

### 1. SuperAdmin God Mode
- Access all tenants
- Impersonate any user
- System-wide analytics
- Tenant management

### 2. Advanced CRM
- Lead automation workflows
- Multi-channel communication
- Campaign management
- Lead scoring

### 3. Rule Engine
- Dynamic fee calculation
- Discount rules
- Scholarship eligibility
- Payment plan automation

### 4. AI Integration
- Auto-generate exams
- Content summarization
- Intelligent chatbot
- Student insights

### 5. Analytics Dashboard
- Real-time KPIs
- Custom reports
- Materialized views
- Export capabilities

### 6. PlayCircle Sports
- Sports program management
- Team & coach tracking
- Match scheduling
- Player statistics

---

## 📊 Performance Optimizations

### Indexes Required (60+ indexes)
```sql
-- Tenant isolation
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_students_tenant ON students(tenant_id);
CREATE INDEX idx_teachers_tenant ON teachers(tenant_id);

-- Multi-tenant queries
CREATE INDEX idx_centers_tenant ON centers(tenant_id);
CREATE INDEX idx_classes_tenant_center ON classes(tenant_id, center_id);
CREATE INDEX idx_leads_tenant_status ON leads(tenant_id, status_id);

-- Performance
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_payments_tenant_status ON payments(tenant_id, status);
```

### Materialized Views
```sql
-- Dashboard analytics
CREATE MATERIALIZED VIEW mv_center_dashboard AS
SELECT 
    c.tenant_id,
    c.id as center_id,
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT t.id) as total_teachers,
    COUNT(DISTINCT cl.id) as total_classes
FROM centers c
LEFT JOIN students s ON s.center_id = c.id
LEFT JOIN teachers t ON t.center_id = c.id
LEFT JOIN classes cl ON cl.center_id = c.id
GROUP BY c.tenant_id, c.id;

-- Refresh daily
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_center_dashboard;
```

---

## 🔐 Security Enhancements

### Row-Level Security (RLS)
```sql
-- Enable RLS on all tenant tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their tenant's data
CREATE POLICY tenant_isolation ON students
    USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

### Data Encryption
- Passwords: bcrypt with 12 rounds
- Sensitive fields: pgcrypto
- JWT tokens: RS256 with rotation
- API keys: Encrypted at rest

---

## 📈 Scalability Considerations

### Database
- Partitioning by tenant_id for large tables
- Read replicas for analytics
- Connection pooling (min: 5, max: 20 per service)
- Query optimization with EXPLAIN ANALYZE

### Caching Strategy
- Redis for session management
- Cache tenant settings (TTL: 1 hour)
- Cache course catalogs (TTL: 24 hours)
- Invalidate on updates

### Load Balancing
- Nginx for API gateway
- Round-robin for stateless services
- Sticky sessions for WebSocket connections

---

## ✅ Migration Checklist

- [ ] Backup V1 database
- [ ] Create V2 schema in test environment
- [ ] Run migration scripts
- [ ] Validate data integrity
- [ ] Update microservices code
- [ ] Update frontend code
- [ ] Performance testing
- [ ] Security audit
- [ ] User acceptance testing
- [ ] Documentation update
- [ ] Deploy to staging
- [ ] Monitor for 1 week
- [ ] Deploy to production
- [ ] Post-deployment verification

---

## 🎯 Success Metrics

### Technical
- 99.9% uptime
- API response time < 200ms (p95)
- Database query time < 50ms (p95)
- Zero data breaches
- < 1% error rate

### Business
- Support 100+ tenants
- Handle 10,000+ concurrent users
- Process 1M+ transactions/day
- 99% tenant isolation success
- < 5min tenant onboarding time

---

**Version:** 2.0  
**Last Updated:** December 20, 2025  
**Status:** 🚧 Architecture Design Complete - Ready for Implementation
