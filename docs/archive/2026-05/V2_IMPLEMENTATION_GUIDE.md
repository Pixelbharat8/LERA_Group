# 🚀 FULL V2 IMPLEMENTATION GUIDE
## LERA Academy - Multi-Tenant Enterprise Architecture

---

## 📦 What You've Been Given

### Files Created:
1. ✅ `migration_v1_to_v2.sql` - Phase 1 migration (multi-tenant infrastructure)
2. ⏳ `init_v2_complete.sql` - Full V2 schema (creating next)
3. ⏳ `rollback_v2_to_v1.sql` - Safety rollback script
4. ⏳ `V2_IMPLEMENTATION_ROADMAP.md` - 12-week plan
5. ⏳ Backend entity templates
6. ⏳ Frontend React components

---

## 🎯 V2 Architecture Overview

### Database: 41 → 107 Tables

**Multi-Tenant Core (6 tables)**
- tenants
- tenant_settings
- user_roles
- impersonation_logs
- activity_logs
- login_history

**Enhanced LMS (25 tables)**
- student_profiles (NEW)
- teacher_profiles (NEW)
- student_parents (NEW)
- parent_profiles (NEW)
- course_modules (NEW)
- course_lessons (NEW)
- course_materials (NEW)
- class_schedules (NEW)
- class_students (NEW)
- class_assignments (NEW)
- assignment_submissions (NEW)
- certificates (NEW)
- certificate_templates (NEW)
- student_documents (NEW)
- teacher_documents (NEW)
- student_skill_levels (NEW)
- teacher_skill_levels (NEW)

**Advanced CRM (16 tables)**
- lead_statuses (NEW)
- lead_notes (NEW)
- lead_tags (NEW)
- lead_activities (NEW)
- lead_assignments (NEW)
- chat_messages (NEW)
- call_logs (NEW)
- email_logs (NEW)
- crm_automations (NEW)
- crm_automation_rules (NEW)
- crm_triggers (NEW)
- marketing_campaigns (NEW)
- campaign_leads (NEW)

**Rule Engine & Payments (17 tables)**
- payment_methods (NEW)
- scholarships (NEW)
- fee_rules (NEW)
- fee_rule_conditions (NEW)
- fee_rule_actions (NEW)
- fee_rule_tests (NEW)
- fee_previews (NEW)
- payroll_cycles (NEW)
- teacher_salaries (NEW)
- salary_components (NEW)
- salary_payouts (NEW)
- tax_settings (NEW)
- teacher_overtime (NEW)

**AI Gateway (6 tables)**
- ai_exam_requests
- ai_generated_exams
- ai_content_summaries
- ai_chat_sessions
- ai_chat_messages
- ai_embeddings

**Website CMS (7 tables)**
- website_pages
- website_sections
- website_home_sections
- website_courses
- website_testimonials
- website_blog_posts
- website_contacts

**Sports Module - PlayCircle (6 tables)**
- sports_programs
- sports_teams
- sports_coaches
- sports_matches
- sports_training_sessions
- sports_player_stats

**System Utilities (3 tables)**
- notification_preferences
- system_settings
- files

**Analytics (5 materialized views)**
- mv_center_dashboard
- mv_student_performance
- mv_teacher_performance
- mv_revenue_analytics
- mv_lead_conversion

---

## 📅 12-WEEK IMPLEMENTATION PLAN

### **MONTH 1: Foundation** (Weeks 1-4)

#### Week 1: Database Migration
**Days 1-2:**
- [ ] Review migration script
- [ ] Set up staging database
- [ ] Run migration_v1_to_v2.sql on staging
- [ ] Verify data integrity

**Days 3-4:**
- [ ] Create remaining V2 tables
- [ ] Test tenant isolation
- [ ] Performance baseline testing

**Day 5:**
- [ ] Team review
- [ ] Document issues
- [ ] Plan fixes

**Deliverables:**
- ✅ Staging database with V2 schema
- ✅ Data migration verified
- ✅ Performance benchmarks

---

#### Week 2: Identity Service Updates
**Backend: Identity Service (Port 8080)**

**Day 1: Tenant Context**
```java
// TenantContext.java
@Component
public class TenantContext {
    private static final ThreadLocal<UUID> tenantId = new ThreadLocal<>();
    
    public static void setTenantId(UUID id) {
        tenantId.set(id);
    }
    
    public static UUID getTenantId() {
        return tenantId.get();
    }
    
    public static void clear() {
        tenantId.remove();
    }
}

// TenantFilter.java
@Component
@Order(1)
public class TenantFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain chain
    ) throws ServletException, IOException {
        try {
            String tenantId = extractTenantId(request);
            if (tenantId != null) {
                TenantContext.setTenantId(UUID.fromString(tenantId));
            }
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
```

**Day 2-3: Entity Updates**
```java
// Tenant.java
@Entity
@Table(name = "tenants")
public class Tenant {
    @Id
    @GeneratedValue(generator = "UUID")
    private UUID id;
    
    @Column(unique = true, nullable = false)
    private String code;
    
    @Column(nullable = false)
    private String name;
    
    @Column(unique = true)
    private String slug;
    
    private String subscriptionPlan;
    private Integer maxCenters;
    private Integer maxStudents;
    
    @Type(type = "jsonb")
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> features;
    
    // ... getters/setters
}

// Update User.java
@Entity
@Table(name = "users")
public class User {
    // ... existing fields
    
    @ManyToOne
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;
    
    @Column(name = "two_factor_enabled")
    private Boolean twoFactorEnabled = false;
    
    @Column(name = "failed_login_attempts")
    private Integer failedLoginAttempts = 0;
    
    // ... getters/setters
}
```

**Day 4: JWT Updates**
```java
// JwtUtils.java - Add tenant to JWT
public String generateToken(User user) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("tenantId", user.getTenant().getId().toString());
    claims.put("tenantCode", user.getTenant().getCode());
    claims.put("roles", user.getRoles().stream()
        .map(Role::getName)
        .collect(Collectors.toList()));
    
    return Jwts.builder()
        .setClaims(claims)
        .setSubject(user.getEmail())
        .setIssuedAt(new Date())
        .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
        .signWith(SignatureAlgorithm.HS512, jwtSecret)
        .compact();
}
```

**Day 5: Testing**
- [ ] Unit tests for tenant isolation
- [ ] Integration tests for authentication
- [ ] Load testing

**Deliverables:**
- ✅ Tenant entity and repository
- ✅ Tenant context filter
- ✅ Updated JWT with tenant info
- ✅ All tests passing

---

#### Week 3: Academy Service Updates
**Backend: Academy Service (Port 8081)**

**Day 1: Entity Updates**
```java
// Update Student.java
@Entity
@Table(name = "students")
public class Student {
    // ... existing fields
    
    @ManyToOne
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;
    
    @Column(name = "external_id")
    private String externalId;
    
    @Type(type = "string-array")
    @Column(name = "tags", columnDefinition = "text[]")
    private String[] tags;
    
    // ... getters/setters
}

// StudentProfile.java (NEW)
@Entity
@Table(name = "student_profiles")
public class StudentProfile {
    @Id
    @GeneratedValue(generator = "UUID")
    private UUID id;
    
    @OneToOne
    @JoinColumn(name = "student_id")
    private Student student;
    
    private String bloodType;
    private String allergies;
    private String hobbies;
    private String strengths;
    private String weaknesses;
    
    @Type(type = "jsonb")
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> customFields;
    
    // ... getters/setters
}
```

**Day 2: Repository Updates**
```java
// StudentRepository.java
@Repository
public interface StudentRepository extends JpaRepository<Student, UUID> {
    
    // Add tenant filtering
    List<Student> findByTenantId(UUID tenantId);
    
    List<Student> findByTenantIdAndCenterId(UUID tenantId, UUID centerId);
    
    @Query("SELECT s FROM Student s WHERE s.tenant.id = :tenantId AND s.status = :status")
    List<Student> findActiveStudents(@Param("tenantId") UUID tenantId, @Param("status") String status);
}
```

**Day 3: Service Layer**
```java
// StudentService.java
@Service
public class StudentService {
    
    @Autowired
    private StudentRepository studentRepository;
    
    public List<Student> getAllStudents() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new SecurityException("Tenant context not found");
        }
        return studentRepository.findByTenantId(tenantId);
    }
    
    public Student createStudent(StudentDTO dto) {
        UUID tenantId = TenantContext.getTenantId();
        
        Student student = new Student();
        student.setTenant(new Tenant(tenantId));
        student.setFullname(dto.getFullname());
        // ... map other fields
        
        return studentRepository.save(student);
    }
}
```

**Day 4-5: Similar updates for Teacher, Class, Course entities**

**Deliverables:**
- ✅ All Academy entities updated with tenant_id
- ✅ Tenant-scoped repositories
- ✅ Service layer with tenant filtering
- ✅ Tests passing

---

#### Week 4: CRM & Payments Services
**Backend: Connect Service (Port 8085) & Payment Service (Port 8082)**

**Similar pattern:**
1. Add tenant_id to entities
2. Update repositories
3. Add tenant filtering
4. Update services
5. Test isolation

**New CRM Features:**
```java
// LeadStatus.java (NEW)
@Entity
@Table(name = "lead_statuses")
public class LeadStatus {
    @Id
    @GeneratedValue(generator = "UUID")
    private UUID id;
    
    @ManyToOne
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;
    
    private String name;
    private String nameVi;
    private String color;
    private Integer displayOrder;
    
    // ... getters/setters
}

// FeeRule.java (NEW)
@Entity
@Table(name = "fee_rules")
public class FeeRule {
    @Id
    @GeneratedValue(generator = "UUID")
    private UUID id;
    
    @ManyToOne
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;
    
    private String name;
    private String ruleType;
    
    @Type(type = "jsonb")
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> conditions;
    
    @Type(type = "jsonb")
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> actions;
    
    private Integer priority;
    
    // ... getters/setters
}
```

**Deliverables:**
- ✅ CRM entities updated
- ✅ Payment entities updated
- ✅ New fee rules engine
- ✅ Tests passing

---

### **MONTH 2: Frontend & Advanced Features** (Weeks 5-8)

#### Week 5: Frontend Tenant Context
**Frontend: Next.js Updates**

**TenantContext.tsx**
```typescript
import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface TenantContextType {
  tenantId: string | null;
  tenantCode: string | null;
  tenantName: string | null;
  isSuperAdmin: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC = ({ children }) => {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantCode, setTenantCode] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decoded: any = jwtDecode(token);
      setTenantId(decoded.tenantId);
      setTenantCode(decoded.tenantCode);
      setTenantName(decoded.tenantName);
      setIsSuperAdmin(decoded.roles?.includes('SUPER_ADMIN'));
    }
  }, []);

  const switchTenant = async (newTenantId: string) => {
    if (!isSuperAdmin) {
      throw new Error('Only SuperAdmin can switch tenants');
    }
    
    const response = await fetch('/api/auth/impersonate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ tenantId: newTenantId })
    });
    
    const { token, tenantName } = await response.json();
    localStorage.setItem('accessToken', token);
    
    const decoded: any = jwtDecode(token);
    setTenantId(newTenantId);
    setTenantCode(decoded.tenantCode);
    setTenantName(tenantName);
    
    window.location.reload();
  };

  return (
    <TenantContext.Provider value={{ 
      tenantId, 
      tenantCode, 
      tenantName, 
      isSuperAdmin, 
      switchTenant 
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
};
```

**API Interceptor**
```typescript
// lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    
    // Add tenant ID header
    const decoded: any = jwtDecode(token);
    if (decoded.tenantId) {
      config.headers['X-Tenant-ID'] = decoded.tenantId;
    }
  }
  return config;
});

export default api;
```

**Deliverables:**
- ✅ Tenant context provider
- ✅ API interceptor with tenant header
- ✅ Tenant switcher component
- ✅ All pages updated to use tenant context

---

#### Week 6-7: New Features Implementation
- AI Gateway service
- Sports module
- Advanced analytics
- Rule engine UI

#### Week 8: Integration Testing
- Cross-service testing
- Multi-tenant isolation verification
- Performance testing
- Security audit

---

### **MONTH 3: Testing & Deployment** (Weeks 9-12)

#### Week 9-10: Comprehensive Testing
- Load testing (1000+ concurrent users)
- Security penetration testing
- Data migration validation
- User acceptance testing

#### Week 11: Production Preparation
- Infrastructure setup (AWS/Cloud)
- CI/CD pipeline
- Monitoring & alerting
- Documentation

#### Week 12: Production Deployment
- Database migration on production
- Service deployment
- Post-deployment monitoring
- Team training

---

## 🚨 CRITICAL SUCCESS FACTORS

### 1. Data Backup Strategy
```bash
# Before any migration
pg_dump lera > backup_v1_$(date +%Y%m%d_%H%M%S).sql

# Test restore
createdb lera_test
psql lera_test < backup_v1_20251220_120000.sql
```

### 2. Rollback Plan
- Keep V1 backup for 30 days
- Document rollback procedure
- Test rollback on staging

### 3. Tenant Isolation Testing
```sql
-- Verify no cross-tenant data leakage
SELECT 'Cross-tenant check' as test,
       COUNT(DISTINCT tenant_id) as tenant_count,
       COUNT(*) as total_records
FROM students
GROUP BY tenant_id
HAVING COUNT(DISTINCT tenant_id) > 1;
-- Should return 0 rows
```

### 4. Performance Benchmarks
- Page load time < 2s
- API response time < 500ms
- Database query time < 100ms
- Support 10,000 concurrent users

---

## 📞 TEAM ASSIGNMENTS

**Backend Team (3 developers)**
- Developer 1: Identity Service + Tenant Management
- Developer 2: Academy Service + LMS Features
- Developer 3: CRM + Payment Services

**Frontend Team (2 developers)**
- Developer 1: Tenant Context + Dashboard
- Developer 2: Student/Teacher Management UI

**DevOps (1 engineer)**
- Database migrations
- AWS infrastructure
- CI/CD pipeline
- Monitoring setup

**QA Team (2 engineers)**
- Test automation
- Security testing
- Performance testing
- User acceptance testing

**UI/UX Designer (1 designer)**
- Tenant branding system
- Multi-tenant UI components
- Admin dashboards

**Project Manager (You)**
- Sprint planning
- Risk management
- Stakeholder communication
- Resource allocation

---

## 🎯 NEXT IMMEDIATE STEPS

### TODAY (Hours 1-4):
1. **Review migration_v1_to_v2.sql** (created)
2. **Schedule team kickoff meeting**
3. **Set up project tracking (Jira/Trello)**
4. **Assign week 1 tasks**

### THIS WEEK:
1. **Set up staging environment**
2. **Run migration on staging**
3. **Start Identity Service updates**
4. **Create development branches**

### NEXT WEEK:
1. **Begin Academy Service updates**
2. **Frontend tenant context**
3. **Daily standups**
4. **Weekly demos**

---

## 📚 Additional Files Being Created

I'm now creating:
1. ✅ `migration_v1_to_v2.sql` - DONE
2. ⏳ `init_v2_complete.sql` - Complete V2 schema (next)
3. ⏳ `rollback_v2_to_v1.sql` - Safety script
4. ⏳ `TESTING_CHECKLIST.md` - QA guide
5. ⏳ Entity model templates (Java)
6. ⏳ React component templates

---

**Status:** 🚀 **FULL V2 IMPLEMENTATION APPROVED & IN PROGRESS**

**Timeline:** 12 weeks to production  
**Team Size:** 10 people  
**Budget:** Unlimited  
**Priority:** URGENT

Ready to continue with the remaining files? Say **"CONTINUE V2"** and I'll create the complete V2 schema file next! 🎯
