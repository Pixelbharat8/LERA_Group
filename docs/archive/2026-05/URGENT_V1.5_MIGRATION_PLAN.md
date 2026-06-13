# 🚀 URGENT V1.5 MIGRATION PLAN - LERA Academy
## Modified Multi-Tenant Approach (4-6 Weeks)

---

## 🎯 Goal
Add multi-tenant capability to existing V1 system WITHOUT full rebuild.  
Focus: Enable LERA Academy to onboard multiple franchise/partner centers.

---

## 📊 Quick Comparison

| Feature | V1 (Current) | V1.5 (Urgent) | V2 (Full) |
|---------|-------------|---------------|-----------|
| **Timeline** | ✅ Done | **4-6 weeks** | 12 weeks |
| **Tables** | 41 | 56 (+15 new) | 107 |
| **Tenant Support** | ❌ | ✅ | ✅ |
| **SuperAdmin** | ❌ | ✅ (Basic) | ✅ (Advanced) |
| **Infrastructure Cost** | $600/mo | $1,000/mo | $1,750/mo |
| **Breaking Changes** | - | Minimal | Major |
| **Data Migration** | - | Simple | Complex |
| **Team Effort** | - | 4-6 weeks | 10-12 weeks |

---

## 🔄 What Changes in V1.5

### ✅ ADDING (15 New Tables)

**A. Multi-Tenant Core (5 tables)**
```sql
1. tenants                  -- Organizations (LERA, Partner A, Partner B)
2. tenant_settings          -- Branding, features per tenant
3. user_roles              -- Many-to-many: users can have multiple roles
4. impersonation_logs      -- SuperAdmin can switch contexts
5. login_history           -- Security tracking
```

**B. Enhanced CRM (4 tables)**
```sql
6. lead_sources            -- ✅ Already exists, enhanced
7. lead_statuses           -- NEW: Custom status per tenant
8. lead_notes              -- NEW: Detailed follow-up notes
9. lead_tags               -- NEW: Lead categorization
```

**C. Advanced Payments (3 tables)**
```sql
10. payment_methods        -- NEW: Multiple payment gateways
11. fee_rules              -- NEW: Dynamic pricing rules
12. teacher_salaries       -- NEW: Separate from payroll
```

**D. System Utilities (3 tables)**
```sql
13. notification_preferences  -- NEW: User notification settings
14. system_settings          -- NEW: Global system config
15. files                    -- NEW: File storage metadata
```

### 🔄 MODIFYING (15 Existing Tables)

**Add `tenant_id UUID REFERENCES tenants(id)` to:**
1. centers
2. users
3. students
4. teachers
5. classes
6. leads
7. invoices
8. payments
9. payroll
10. course_programs
11. blog_posts
12. testimonials
13. banners
14. cms_settings
15. roles

**Enhanced Tables:**
- `users` → Add `two_factor_enabled`, `failed_login_attempts`
- `students` → Add `student_profile` JSONB for flexibility
- `teachers` → Add `teacher_profile` JSONB
- `roles` → Add `tenant_id`, `is_global`

### 🚫 NOT CHANGING (26 Tables Stay Same)
- course_levels, class_sessions, attendance, makeup_sessions
- exam_types, exams, exam_results, student_progress
- trial_classes, fee_structures, discounts, invoice_items
- cms_pages, media, faqs
- badges, student_badges, points_transactions, leaderboard
- notifications, enrollments, role_permissions, permissions
- audit_logs, user_sessions

---

## 📅 4-Week Sprint Plan

### **Week 1: Database Migration** (5 working days)
**Days 1-2: Schema Updates**
- [ ] Create migration SQL: `migration_v1_to_v1.5.sql`
- [ ] Add 15 new tables
- [ ] Add `tenant_id` to 15 existing tables
- [ ] Create default tenant: "LERA Academy Main"
- [ ] Test on staging database

**Days 3-4: Data Migration**
- [ ] Populate `tenant_id` for all existing data → LERA tenant
- [ ] Migrate user-role relationships
- [ ] Add NOT NULL constraints
- [ ] Verify data integrity

**Day 5: Indexes & Optimization**
- [ ] Add indexes: `idx_*_tenant` on all tenant_id columns
- [ ] Test query performance
- [ ] Document changes

**Deliverables:**
- ✅ `migration_v1_to_v1.5.sql`
- ✅ `rollback_v1.5_to_v1.sql`
- ✅ Migration testing checklist

---

### **Week 2: Backend Service Updates** (5 working days)

**Day 1: Identity Service (Port 8080)**
- [ ] Add `TenantContext` filter to intercept all requests
- [ ] Update `User` entity: add `tenantId`, `twoFactorEnabled`
- [ ] Create `Tenant` entity & repository
- [ ] Update JWT to include `tenantId`
- [ ] Add SuperAdmin detection logic

**Day 2: Academy Service (Port 8081)**
- [ ] Update entities: Student, Teacher, Class, CourseProgram
- [ ] Add tenant filtering to all queries
- [ ] Create `@TenantScoped` annotation
- [ ] Update repositories with tenant context

**Day 3: Payment & Payroll Services (Port 8082-8083)**
- [ ] Update Invoice, Payment, Payroll entities
- [ ] Add tenant filtering
- [ ] Create new FeeRule entity
- [ ] Update payment gateway integration

**Day 4: CRM (Connect Service - Port 8085)**
- [ ] Update Lead entity
- [ ] Add LeadStatus, LeadNote, LeadTag entities
- [ ] Implement tenant-scoped CRM automation

**Day 5: Attendance Service (Port 8084)**
- [ ] Update attendance queries with tenant filter
- [ ] Test multi-tenant attendance tracking

**Deliverables:**
- ✅ Updated entity models (all services)
- ✅ Tenant context interceptor
- ✅ Unit tests for tenant isolation

---

### **Week 3: Frontend Updates** (5 working days)

**Day 1: Auth & Context**
- [ ] Update login flow to store `tenantId` in localStorage
- [ ] Create `TenantContext` React context
- [ ] Add SuperAdmin tenant switcher component
- [ ] Update API interceptor to send `X-Tenant-ID` header

**Day 2: Dashboard Updates**
- [ ] Add tenant selector to SuperAdmin dashboard
- [ ] Update all data fetching to include tenant context
- [ ] Create tenant management UI

**Day 3: Student/Teacher/Class Pages**
- [ ] Update all list/detail pages to respect tenant
- [ ] Add tenant branding (logo, colors)
- [ ] Test multi-tenant data isolation

**Day 4: CRM & Payments**
- [ ] Update lead management with new fields
- [ ] Add payment method selection
- [ ] Implement fee rule management UI

**Day 5: Testing & Polish**
- [ ] Cross-tenant testing
- [ ] Fix UI bugs
- [ ] Performance optimization

**Deliverables:**
- ✅ Updated Next.js components
- ✅ Tenant switcher UI
- ✅ Multi-tenant branding

---

### **Week 4: Testing & Deployment** (5 working days)

**Day 1: Integration Testing**
- [ ] Test tenant isolation (User A cannot see User B data)
- [ ] Test SuperAdmin impersonation
- [ ] Test multi-tenant workflows

**Day 2: Security Testing**
- [ ] Penetration testing for tenant leakage
- [ ] Test JWT with tenant claims
- [ ] Verify row-level security

**Day 3: Load Testing**
- [ ] Test with 10 tenants, 1000 students each
- [ ] Database query optimization
- [ ] Redis caching setup

**Day 4: Documentation**
- [ ] Update API documentation
- [ ] Create admin user guide
- [ ] Write deployment runbook

**Day 5: Production Deployment**
- [ ] Backup production database
- [ ] Run migration scripts
- [ ] Deploy updated services
- [ ] Monitor for errors

**Deliverables:**
- ✅ Test reports
- ✅ Security audit
- ✅ Deployment documentation
- ✅ Monitoring dashboards

---

## 🛠️ Technical Implementation Details

### 1. Database Migration Script (Preview)

```sql
-- migration_v1_to_v1.5.sql
BEGIN;

-- ==========================================
-- STEP 1: Create Tenant Infrastructure
-- ==========================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    subscription_plan VARCHAR(50) DEFAULT 'STANDARD',
    max_centers INT DEFAULT 5,
    max_students INT DEFAULT 500,
    features JSONB DEFAULT '{"crm": true, "payments": true, "analytics": false}',
    branding JSONB DEFAULT '{}',
    timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text',
    UNIQUE(tenant_id, setting_key)
);

-- Create default tenant
INSERT INTO tenants (code, name, slug, subscription_plan, max_centers, max_students)
VALUES ('LERA', 'LERA Academy', 'lera', 'PREMIUM', 50, 10000)
ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- STEP 2: Add tenant_id to existing tables
-- ==========================================

-- Centers
ALTER TABLE centers ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE centers SET tenant_id = (SELECT id FROM tenants WHERE code = 'LERA');
ALTER TABLE centers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE centers ADD CONSTRAINT fk_centers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_centers_tenant ON centers(tenant_id);

-- Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0;
UPDATE users SET tenant_id = (SELECT id FROM tenants WHERE code = 'LERA');
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_users_tenant ON users(tenant_id);

-- Students
ALTER TABLE students ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE students SET tenant_id = (SELECT id FROM tenants WHERE code = 'LERA');
ALTER TABLE students ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE students ADD CONSTRAINT fk_students_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_students_tenant ON students(tenant_id);

-- Teachers
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE teachers SET tenant_id = (SELECT id FROM tenants WHERE code = 'LERA');
ALTER TABLE teachers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE teachers ADD CONSTRAINT fk_teachers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_teachers_tenant ON teachers(tenant_id);

-- Classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE classes SET tenant_id = (SELECT id FROM tenants WHERE code = 'LERA');
ALTER TABLE classes ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE classes ADD CONSTRAINT fk_classes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_classes_tenant ON classes(tenant_id);

-- Leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE leads SET tenant_id = (SELECT id FROM tenants WHERE code = 'LERA');
ALTER TABLE leads ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE leads ADD CONSTRAINT fk_leads_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_leads_tenant ON leads(tenant_id);

-- Invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE invoices SET tenant_id = (SELECT id FROM tenants WHERE code = 'LERA');
ALTER TABLE invoices ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);

-- Payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE payments SET tenant_id = (SELECT id FROM tenants WHERE code = 'LERA');
ALTER TABLE payments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE payments ADD CONSTRAINT fk_payments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);

-- Payroll
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE payroll SET tenant_id = (SELECT id FROM tenants WHERE code = 'LERA');
ALTER TABLE payroll ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE payroll ADD CONSTRAINT fk_payroll_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_payroll_tenant ON payroll(tenant_id);

-- Course Programs
ALTER TABLE course_programs ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE course_programs SET tenant_id = (SELECT id FROM tenants WHERE code = 'LERA');
ALTER TABLE course_programs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE course_programs ADD CONSTRAINT fk_course_programs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);
CREATE INDEX idx_course_programs_tenant ON course_programs(tenant_id);

-- ==========================================
-- STEP 3: Create New Tables
-- ==========================================

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id),
    tenant_id UUID REFERENCES tenants(id),
    granted_at TIMESTAMP DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),
    UNIQUE(user_id, role_id, center_id)
);

CREATE TABLE IF NOT EXISTS impersonation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    impersonator_id UUID REFERENCES users(id),
    impersonated_user_id UUID REFERENCES users(id),
    tenant_id UUID REFERENCES tenants(id),
    reason TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    tenant_id UUID REFERENCES tenants(id),
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_type VARCHAR(50),
    login_status VARCHAR(20),
    failed_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    name_vi VARCHAR(100),
    color VARCHAR(20),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS lead_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20),
    UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    gateway_type VARCHAR(50),
    config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(tenant_id, code)
);

CREATE TABLE IF NOT EXISTS fee_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50),
    conditions JSONB,
    actions JSONB,
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS teacher_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id),
    tenant_id UUID REFERENCES tenants(id),
    base_salary DECIMAL(12, 2),
    currency VARCHAR(10) DEFAULT 'VND',
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(50),
    notification_type VARCHAR(50),
    is_enabled BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, channel, notification_type)
);

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    entity_type VARCHAR(100),
    entity_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- STEP 4: Update Roles for Multi-Tenant
-- ==========================================

ALTER TABLE roles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT TRUE;

-- Make default roles global
UPDATE roles SET is_global = TRUE, tenant_id = NULL WHERE is_system_role = TRUE;

COMMIT;
```

---

### 2. Backend Tenant Context Filter (Spring Boot)

```java
// TenantContext.java
public class TenantContext {
    private static final ThreadLocal<UUID> currentTenant = new ThreadLocal<>();
    
    public static void setTenantId(UUID tenantId) {
        currentTenant.set(tenantId);
    }
    
    public static UUID getTenantId() {
        return currentTenant.get();
    }
    
    public static void clear() {
        currentTenant.remove();
    }
}

// TenantFilter.java
@Component
@Order(1)
public class TenantFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) {
        try {
            String tenantId = extractTenantId(request);
            if (tenantId != null) {
                TenantContext.setTenantId(UUID.fromString(tenantId));
            }
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
    
    private String extractTenantId(HttpServletRequest request) {
        // 1. Check header
        String headerTenant = request.getHeader("X-Tenant-ID");
        if (headerTenant != null) return headerTenant;
        
        // 2. Extract from JWT
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            Claims claims = jwtUtils.parseToken(token.substring(7));
            return claims.get("tenantId", String.class);
        }
        
        return null;
    }
}

// @TenantScoped Annotation
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface TenantScoped {
}

// TenantScopedAspect.java
@Aspect
@Component
public class TenantScopedAspect {
    
    @Around("@within(com.lera.annotation.TenantScoped)")
    public Object addTenantFilter(ProceedingJoinPoint joinPoint) throws Throwable {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new SecurityException("Tenant context not found");
        }
        return joinPoint.proceed();
    }
}
```

---

### 3. Frontend Tenant Context (React)

```typescript
// contexts/TenantContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface TenantContextType {
  tenantId: string | null;
  tenantName: string | null;
  isSuperAdmin: boolean;
  switchTenant: (tenantId: string) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC = ({ children }) => {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    // Extract from JWT on login
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decoded = jwtDecode(token);
      setTenantId(decoded.tenantId);
      setTenantName(decoded.tenantName);
      setIsSuperAdmin(decoded.role === 'SUPER_ADMIN');
    }
  }, []);

  const switchTenant = async (newTenantId: string) => {
    if (!isSuperAdmin) {
      throw new Error('Only SuperAdmin can switch tenants');
    }
    
    // Call API to get new JWT for different tenant
    const response = await fetch('/api/auth/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: newTenantId })
    });
    
    const { token, tenantName } = await response.json();
    localStorage.setItem('accessToken', token);
    setTenantId(newTenantId);
    setTenantName(tenantName);
    
    // Reload data
    window.location.reload();
  };

  return (
    <TenantContext.Provider value={{ tenantId, tenantName, isSuperAdmin, switchTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
};

// API interceptor
axios.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('tenantId');
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }
  return config;
});
```

---

## 💰 Cost Breakdown (V1.5)

| Component | Monthly Cost |
|-----------|--------------|
| Database (AWS RDS r5.large) | $400 |
| Application Servers (3x t3.medium) | $350 |
| Redis Cache (t3.small) | $50 |
| Load Balancer | $30 |
| S3 Storage | $100 |
| CloudFront CDN | $50 |
| Monitoring (CloudWatch) | $20 |
| **Total** | **~$1,000/mo** |

**Notes:**
- Can handle 10-20 tenants
- 5,000-10,000 students total
- 99.9% uptime SLA

---

## 🎯 Success Metrics

### Week 1 Completion
- [ ] Migration script tested on staging
- [ ] All existing data migrated to LERA tenant
- [ ] Zero data loss verified

### Week 2 Completion
- [ ] All 6 backend services updated
- [ ] Tenant filtering working
- [ ] Unit tests passing (>90% coverage)

### Week 3 Completion
- [ ] Frontend tenant context implemented
- [ ] SuperAdmin can switch tenants
- [ ] No cross-tenant data leakage

### Week 4 Completion
- [ ] Production deployment successful
- [ ] 2nd tenant onboarded
- [ ] System monitoring active

---

## 🚨 Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| **Data Loss** | Full backup before migration + rollback script |
| **Downtime** | Deploy during off-hours (2-5 AM) |
| **Performance** | Load testing with 10 tenants before launch |
| **Security** | Penetration testing for tenant isolation |
| **User Confusion** | Training videos + in-app tutorials |

---

## 📚 What's NOT in V1.5 (Can Add Later)

These features from V2 can be added incrementally:

1. **AI Gateway** - Can add in Month 2-3
2. **Sports Module** - Can add in Month 3-4
3. **Advanced Analytics** - Can add in Month 4-5
4. **Rule Engine** - Basic version included, advanced later
5. **Marketing Automation** - Can add in Month 5-6

---

## ✅ Next Immediate Actions

**TODAY (Hour 1-2):**
1. Review this plan with your team
2. Approve or request modifications
3. I'll create migration SQL script

**THIS WEEK:**
1. Set up staging environment
2. Test migration on staging
3. Start backend updates

**NEXT WEEK:**
1. Deploy to production (Friday night)
2. Onboard 2nd test tenant
3. Monitor for issues

---

## 📞 Support Plan

**Team Structure (10 people):**
- 1 Project Manager (you?)
- 3 Backend Developers (Spring Boot services)
- 2 Frontend Developers (Next.js)
- 1 DevOps Engineer (AWS, Docker, PostgreSQL)
- 2 QA Engineers (Testing)
- 1 UI/UX Designer (Tenant branding)

**Communication:**
- Daily standups (15 min)
- Weekly sprint reviews
- Slack/Discord for real-time help

---

**Status:** ⏳ **AWAITING YOUR APPROVAL TO START**

Once you approve, I'll immediately create:
1. ✅ Complete migration SQL script
2. ✅ Rollback script
3. ✅ Testing checklist
4. ✅ Updated backend entity models

🚀 **Ready to start migration?** Say "YES, START V1.5" and I'll begin!
