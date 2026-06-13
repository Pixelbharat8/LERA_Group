# 📊 LERA System - Real Data Status

## ✅ Current System Status (Verified Working)

### Backend Services Running:
| Port | Service | Status |
|------|---------|--------|
| 8081 | Identity Service | ✅ Running |
| 8082 | Academy Service | ✅ Running |
| 8083 | Payment Service | ✅ Running |
| 8084 | Payroll Service | ✅ Running |
| 8085 | Attendance Service | ✅ Running |
| 8086 | Connect Service | ✅ Running |
| 3000 | Frontend (Next.js) | ✅ Running |

### Database Tables with Real Data:

#### Users Table (9 records):
| Full Name | Email | Role |
|-----------|-------|------|
| Rahul Sharma | Chairman@Leraacademy.edu.vn | CHAIRMAN |
| Ledia Balliu | CEO@Leraacademy.edu.vn | CEO |
| Thanh Hai Dang | director@leraacademy.edu.vn | DIRECTOR |
| Truong Giang Nguyen | Manager@leraacademy.edu.vn | CENTER_MANAGER |
| Tạ Thị Thu Hiền | Marketing@leraacademy.edu.vn | ADMIN |
| Phuong Bui | academic@leraacademy.edu.vn | ACADEMIC_MANAGER |
| MO | Mo@gmail.com | TEACHER |
| R | TA@lera.com | TA |
| Super Administrator | admin@lera.com | SUPER_ADMIN |

#### Students Table (13 records):
| Student Code | Full Name | Status |
|--------------|-----------|--------|
| STUD001 | Rahul Sharma | ACTIVE |
| STU2026001 | Nguyễn Minh Anh | ACTIVE |
| STU2026002 | Trần Hoàng Nam | ACTIVE |
| STU2026003 | Lê Thị Mai | ACTIVE |
| STU2026004 | Phạm Văn Đức | ACTIVE |
| STU2026005 | Võ Thanh Hà | ACTIVE |
| STU2026006 | Hoàng Minh Tú | ACTIVE |
| STU2026007 | Đặng Thị Lan | ACTIVE |
| STU2026008 | Bùi Văn Hải | ACTIVE |
| STU2026009 | Ngô Thị Hồng | ACTIVE |
| STU2026010 | Trương Minh Khôi | ACTIVE |
| STU2026011 | Lý Thị Ngọc | ACTIVE |
| STU2026012 | Đinh Văn Phong | ACTIVE |

#### Teachers Table (3 records):
| Teacher Code | Specialization |
|--------------|----------------|
| TCH001 | English Communication |
| TCH002 | Grammar & Writing |
| TCH003 | Phonics & Reading |

#### Roles Table (12 records):
| Role Name | Users Count | Level |
|-----------|-------------|-------|
| SUPER_ADMIN | 1 | 100 |
| CHAIRMAN | 1 | 100 |
| CEO | 1 | 95 |
| DIRECTOR | 1 | 90 |
| ADMIN | 1 | 90 |
| CENTER_MANAGER | 1 | 80 |
| ACADEMIC_MANAGER | 1 | 70 |
| TEACHER | 1 | 50 |
| TA | 1 | 0 |
| PARENT | 0 | 20 |
| STUDENT | 0 | 10 |
| STAFF | 0 | 0 |

## 🔑 Unique ID System

All role-based entities have unique codes:

| Entity | Column | Format | Example |
|--------|--------|--------|---------|
| Students | student_code | STU{YEAR}{NNN} | STU2026001 |
| Teachers | teacher_code | TCH{NNN} | TCH001 |
| Staff | staff_code | STF{NNN} | STF001 |
| Parents | parent_code | PAR{NNN} | PAR001 |

## 🔗 API Endpoints (All Returning Real Data)

### Identity Service (8081):
- `GET /api/users` → 9 users
- `GET /api/roles` → 12 roles
- `GET /api/centers` → Centers list
- `GET /api/departments` → Departments list

### Academy Service (8082):
- `GET /api/students` → 13 students
- `GET /api/teachers` → 3 teachers
- `GET /api/classes` → Classes list
- `GET /api/courses` → Courses list

## 🌐 Frontend Access

Open in browser: **http://localhost:3000**

Dashboard URLs:
- Chairman Dashboard: `/dashboard/chairman`
- CEO Dashboard: `/dashboard/ceo`
- Admin Dashboard: `/dashboard/admin`
- Super Admin: `/dashboard/superadmin`

## ⚠️ Important: Clear Browser Cache

If you see 0 users or dummy data, please:
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear browser cache
3. Or open in incognito/private window

## ✅ Verification Commands

```bash
# Check users via API
curl http://localhost:3000/api/users | jq length
# Should return: 9

# Check students via API
curl http://localhost:3000/api/students | jq length
# Should return: 13

# Check teachers via API
curl http://localhost:8082/api/teachers | jq length
# Should return: 3
```
