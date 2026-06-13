# 🔍 Frontend-Backend Gaps Analysis

## Overview
This document identifies missing fields, features, and improvements needed across frontend pages compared to their backend entities.

**Last Updated:** January 2026
**Fixed in This Session:**
- ✅ CRM Leads - Added center filtering for CENTER_MANAGER
- ✅ Attendance - Added student name resolution and mark attendance functionality
- ✅ Payments - Added edit modal, transaction ID display, inline status update

---

## � RECENTLY FIXED

### 1. **CRM Leads Page** (`/dashboard/crm/leads/page.tsx`) ✅ FIXED
- ✅ Added center filtering via `useUserCenter` hook
- ✅ Added center column to table
- ✅ Added center filter dropdown for superadmin
- ✅ Added centerId to new lead creation
- ✅ Added student age and preferred schedule fields
- ✅ Stats now calculated from filtered data

### 2. **Attendance Page** (`/dashboard/attendance/page.tsx`) ✅ FIXED  
- ✅ Added student name resolution (shows names instead of IDs)
- ✅ Added center name display
- ✅ Added "Mark Attendance" modal with functionality
- ✅ Added status filter
- ✅ Added center filter for superadmin
- ✅ Added inline status update
- ✅ Added attendance rate calculation

### 3. **Payments Page** (`/dashboard/payments/page.tsx`) ✅ FIXED
- ✅ Added Edit Payment modal
- ✅ Added Transaction ID column
- ✅ Added Payment Gateway display
- ✅ Added inline status update dropdown
- ✅ Added Paid At date display
- ✅ Notes now shown in student column

---

## �🔴 REMAINING CRITICAL GAPS

### 1. **Payments Page** (`/dashboard/payments/page.tsx`)

#### ~~Missing Backend Fields Not Displayed:~~ (MOST FIXED)
| Backend Field | Type | Frontend Status |
|--------------|------|-----------------|
| `paymentGateway` | String | ✅ Now displayed |
| `transactionId` | String | ✅ Now displayed |
| `processedBy` | UUID | ❌ Still not displayed |
| `paidAt` | DateTime | ✅ Now displayed |
| `invoiceId` | UUID | ❌ Not linked to invoice |

#### ~~Missing Features:~~ (MOST FIXED)
- ✅ **Edit Payment Modal** - Now implemented
- ❌ **Link to Invoice** - No way to see related invoice
- ❌ **Payment Gateway Filter** - Can't filter by gateway
- ❌ **Processed By Display** - Should show who processed
- ❌ **Transaction ID Search** - Important for reconciliation
- ❌ **Export to Excel/CSV** - Finance needs export capability

---

### 2. **Attendance Page** (`/dashboard/attendance/page.tsx`)

#### ~~Missing Backend Fields Not Displayed:~~ (ALL FIXED)
| Backend Field | Type | Frontend Status |
|--------------|------|-----------------|
| `sessionId` | UUID | ⚠️ Not essential for now |
| `centerId` | UUID | ✅ Now filtering properly |
| `markedBy` | UUID | ❌ Not displayed |

#### ~~Missing Features:~~ (MOST FIXED)
- ✅ **Mark Attendance Button** - Now works!
- ❌ **Bulk Attendance Marking** - Backend has `/bulk` endpoint, not used
- ✅ **Student Name Display** - Now shows names
- ✅ **Center Name Display** - Now shows center names
- ❌ **Attendance Rate Stats** - Backend has stats endpoint not used
- ✅ **Edit Attendance** - Now has inline status update
- ✅ **Filter by Status** - Now can filter by PRESENT/ABSENT/LATE
- ❌ **Date Range Selection** - Still only single date
- ❌ **Export Report** - No export capability

---

### 3. **Invoices Page** (`/dashboard/finance/invoices/page.tsx`)

#### Missing Backend Fields:
| Backend Field | Type | Frontend Status |
|--------------|------|-----------------|
| `discountId` | UUID | ❌ Not linked to discount entity |
| `tenantId` | UUID | ❌ Multi-tenant not supported |
| `createdBy` | UUID | ❌ Not displayed |
| `updatedAt` | DateTime | ❌ Not displayed |

#### Missing Features:
- ❌ **Discount Selection** - Can't select from available discounts
- ❌ **Invoice PDF Download** - Important for business
- ❌ **Send Invoice Email** - No email integration
- ❌ **Recurring Invoice** - No support for recurring billing
- ❌ **Invoice Items Management** - Backend has InvoiceItem entity

---

### 4. **Payroll Page** (`/dashboard/payroll/page.tsx`)

#### Missing Backend Fields:
| Backend Field | Type | Frontend Status |
|--------------|------|-----------------|
| `hourlyRate` | BigDecimal | ⚠️ Not editable |
| `teachingAmount` | BigDecimal | ⚠️ Not editable |
| `centerId` | UUID | ✅ Has center filter |

#### Missing Features:
- ❌ **Individual Payroll Entry** - Can only generate bulk
- ❌ **Edit Payroll Record** - No edit modal
- ❌ **Deduction Details** - Backend has `Deduction` entity not used
- ❌ **Bonus Management** - Backend has `Bonus` entity not used
- ❌ **Tax Calculation** - Backend has `TaxSettings` not integrated
- ❌ **Overtime Management** - Backend has `TeacherOvertime` not used
- ❌ **Salary Config** - Backend has `TeacherSalaryConfig` not used
- ❌ **Export Payslips** - No PDF/Excel export

---

### 5. **CRM Leads Page** (`/dashboard/crm/leads/page.tsx`)

#### ~~Missing Backend Fields:~~ (MOST FIXED)
| Backend Field | Type | Frontend Status |
|--------------|------|-----------------|
| `centerId` | UUID | ✅ **NOW FILTERED!** |
| `sourceId` | UUID | ❌ Not linked to source entity |
| `interestedProgramId` | UUID | ❌ Not using program entity |
| `preferredSchedule` | Text | ✅ Now captured |
| `assignedTo` | UUID | ⚠️ Shows "Sales Team" hardcoded |
| `convertedStudentId` | UUID | ❌ Not displaying linked student |
| `conversionDate` | LocalDate | ❌ Not displayed |
| `utmSource/Medium/Campaign` | String | ✅ Now used properly |

#### ~~Missing Features:~~ (SOME FIXED)
- ✅ **CENTER FILTER** - Now implemented!
- ❌ **Lead Assignment** - Backend has `LeadAssignment` entity
- ❌ **Lead Activities** - Backend has `LeadActivity` entity
- ❌ **Lead Notes** - Backend has `LeadNote` entity
- ❌ **Lead Status History** - Backend has `LeadStatus` entity
- ❌ **Follow-up Scheduling** - No follow-up management
- ❌ **Bulk Import** - No CSV/Excel import
- ❌ **Lead Scoring** - No scoring system
- ❌ **Email Templates** - No email automation

---

### 6. **Students Page** (`/dashboard/superadmin/students/page.tsx`)

#### Recently Fixed ✅:
- ✅ Center filter count now correct
- ✅ Center edit now saves properly
- ✅ Added more columns (DOB, Gender, School, Grade, Emergency Contact)

#### Still Missing:
| Backend Field | Type | Frontend Status |
|--------------|------|-----------------|
| `parentId` | UUID | ⚠️ Added but no parent display |
| `teacherId` | - | ❌ No teacher assignment field |
| `enrollmentDate` | Date | ⚠️ In table but not editable |

#### Missing Features:
- ❌ **Parent Link** - Should show linked parent info
- ❌ **Class Assignments** - Which classes student is in
- ❌ **Attendance Summary** - Quick attendance stats
- ❌ **Payment History** - Quick payment overview
- ❌ **Progress Overview** - Academic progress summary
- ❌ **Bulk Import** - No CSV import

---

## 🟡 MODERATE GAPS

### 7. **Teachers Page**

#### Likely Missing (based on patterns):
- ❌ Salary configuration link
- ❌ Teaching hours summary
- ❌ Class assignments view
- ❌ Attendance/leave summary
- ❌ Performance metrics

---

### 8. **Classes/Courses Page**

#### Likely Missing:
- ❌ Session scheduling
- ❌ Enrollment management
- ❌ Attendance by class
- ❌ Progress tracking per class

---

### 9. **Finance Dashboard**

#### Missing Entities Not Integrated:
- ❌ `Discount` entity - Backend has discounts
- ❌ `StudentPlan` - Enrollment/payment plans
- ❌ `Refund` - Refund management

---

## 🟢 COMMON PATTERNS TO FIX

### 1. **Center Filtering Not Applied:**
Pages that need center filtering for CENTER_MANAGER:
- ❌ `/dashboard/crm/leads/page.tsx` - **CRITICAL**
- ❌ `/dashboard/crm/followups/page.tsx`
- ❌ `/dashboard/crm/registrations/page.tsx`
- ⚠️ Verify all finance sub-pages

### 2. **Missing Name Resolution:**
Pages showing IDs instead of names:
- Attendance: studentId, classId → should show names
- Payments: processedBy → should show processor name
- Invoices: createdBy → should show creator name
- Leads: assignedTo → should show assignee name

### 3. **Missing Export Functionality:**
All data tables should have:
- ❌ Export to Excel
- ❌ Export to PDF
- ❌ Print view

### 4. **Missing Bulk Operations:**
- ❌ Bulk delete
- ❌ Bulk status change
- ❌ Bulk import (CSV)

---

## 📋 PRIORITY FIX ORDER (UPDATED)

### Priority 1 (Critical Business Impact): ✅ ALL DONE
1. ~~**CRM Leads - Add Center Filter**~~ ✅ FIXED
2. ~~**Attendance - Add Mark Attendance functionality**~~ ✅ FIXED
3. ~~**Payments - Add Edit Modal and Transaction ID display**~~ ✅ FIXED

### Priority 2 (Feature Completeness): 
4. ~~**Attendance - Student/Class name resolution**~~ ✅ FIXED
5. **Payroll - Add edit and individual entry** ❌ TODO
6. **Invoice - PDF download** ❌ TODO

### Priority 3 (Nice to Have):
7. Export functionality across all pages ❌ TODO
8. Bulk operations ❌ TODO
9. Advanced filters ❌ TODO

---

## 🛠️ RECOMMENDED FIXES

### Fix 1: CRM Leads Center Filter (CRITICAL)
```tsx
// In /dashboard/crm/leads/page.tsx
import { useUserCenter, buildCenterFilterUrl } from "../../hooks/useUserCenter";

// In component:
const { centerId: userCenterId, shouldFilterByCenter, loading: userLoading } = useUserCenter();

// In fetchLeads:
const leadsUrl = shouldFilterByCenter 
  ? buildCenterFilterUrl("/api/leads", userCenterId)
  : "/api/leads";
```

### Fix 2: Attendance Name Resolution
```tsx
// Fetch students and map names
const [students, setStudents] = useState<{[key: string]: string}>({});

// In fetchAttendance - also fetch students
const studentsData = await apiFetch("/api/students");
const studentsMap: {[key: string]: string} = {};
studentsData.forEach((s: any) => {
  studentsMap[s.id] = s.fullname || s.name || s.email;
});
setStudents(studentsMap);

// In table:
<td>{students[record.studentId] || record.studentId}</td>
```

### Fix 3: Payments Edit Modal
Add similar edit functionality as Students page with all editable fields.

---

## 📊 GAP SUMMARY (UPDATED)

| Area | Critical | Moderate | Minor | Fixed | Total |
|------|----------|----------|-------|-------|-------|
| Payments | ~~3~~ 1 | 4 | 2 | 5 | 12 |
| Attendance | ~~4~~ 0 | ~~3~~ 1 | 2 | 6 | 9 |
| Invoices | 2 | 3 | 2 | 0 | 7 |
| Payroll | 3 | 5 | 2 | 0 | 10 |
| CRM Leads | ~~5~~ 1 | 4 | 3 | 4 | 12 |
| Students | 1 | 4 | 2 | 0 | 7 |
| **TOTAL** | **8** | **21** | **13** | **15** | **57** |

---

*Document generated: January 2026*
*Session fixes: CRM Leads center filter, Attendance improvements, Payments edit modal*
*Next review: After implementing Priority 2 fixes*
