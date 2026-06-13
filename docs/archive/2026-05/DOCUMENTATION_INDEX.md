# 📚 LERA Academy - Database Documentation Index

Welcome! This index will help you find exactly what you need for setting up and managing the LERA Academy database (107 tables on localhost).

---

## 🚀 **I Just Want to Get Started!**

Run this one command:
```bash
./setup-local-postgres.sh
```

That's it! Then verify with:
```bash
./verify-schema.sh
```

**Quick Reference:** [`QUICK_START_DATABASE.txt`](QUICK_START_DATABASE.txt)

---

## 📖 Documentation by Purpose

### **Setting Up the Database**

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [`VISUAL_SETUP_GUIDE.txt`](VISUAL_SETUP_GUIDE.txt) | Visual step-by-step guide with ASCII art | First time setup, want visual guidance |
| [`DATABASE_LOCALHOST_SETUP.md`](DATABASE_LOCALHOST_SETUP.md) | Complete setup guide with all details | Comprehensive reference, troubleshooting |
| [`DATABASE_SETUP_CHECKLIST.md`](DATABASE_SETUP_CHECKLIST.md) | Step-by-step verification checklist | Want to verify each step, systematic approach |
| [`QUICK_START_DATABASE.txt`](QUICK_START_DATABASE.txt) | One-page command reference | Quick lookup, already know what to do |

### **Understanding What Was Fixed**

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [`DATABASE_MIGRATION_FIX_SUMMARY.md`](DATABASE_MIGRATION_FIX_SUMMARY.md) | Technical details of all fixes | Want to know what changed and why |
| [`DATABASE_COMPLETE_SUMMARY.md`](DATABASE_COMPLETE_SUMMARY.md) | High-level overview of the solution | Executive summary, quick understanding |

### **Database Schema Reference**

| Resource | Purpose | When to Use |
|----------|---------|-------------|
| [`database/verify-107-tables.sql`](database/verify-107-tables.sql) | SQL queries to verify schema | Running SQL checks, debugging |
| All docs listed above | All contain table breakdowns | Need to see which tables exist in which module |

### **Tools & Scripts**

| Script | Purpose | How to Use |
|--------|---------|------------|
| [`setup-local-postgres.sh`](setup-local-postgres.sh) | Main setup script | `./setup-local-postgres.sh` |
| [`verify-schema.sh`](verify-schema.sh) | Verify 107 tables exist | `./verify-schema.sh` |
| [`database/init/init.sql`](database/init/init.sql) | Base schema (~41 tables) | Auto-run by setup script |
| [`database/migrations/V2__add_missing_66_tables.sql`](database/migrations/V2__add_missing_66_tables.sql) | Adds 66 missing tables | Auto-run by setup script |

---

## 🎯 Quick Navigation by Task

### **Task: First Time Setup**
1. Read: [`VISUAL_SETUP_GUIDE.txt`](VISUAL_SETUP_GUIDE.txt)
2. Run: `./setup-local-postgres.sh`
3. Verify: `./verify-schema.sh`
4. Follow: [`DATABASE_SETUP_CHECKLIST.md`](DATABASE_SETUP_CHECKLIST.md)

### **Task: Troubleshooting Connection Issues**
1. Check: [`DATABASE_LOCALHOST_SETUP.md`](DATABASE_LOCALHOST_SETUP.md) → Troubleshooting section
2. Check: [`DATABASE_SETUP_CHECKLIST.md`](DATABASE_SETUP_CHECKLIST.md) → Troubleshooting section
3. Quick commands: [`QUICK_START_DATABASE.txt`](QUICK_START_DATABASE.txt)

### **Task: Verify Schema is Correct**
1. Run: `./verify-schema.sh`
2. Or manually: `psql -h localhost -U lera -d lera -f database/verify-107-tables.sql`

### **Task: Update Spring Boot Services**
1. Follow: [`DATABASE_SETUP_CHECKLIST.md`](DATABASE_SETUP_CHECKLIST.md) → Step 4
2. Reference: [`DATABASE_LOCALHOST_SETUP.md`](DATABASE_LOCALHOST_SETUP.md) → Connection Details section

### **Task: Understand What Changed**
1. Read: [`DATABASE_COMPLETE_SUMMARY.md`](DATABASE_COMPLETE_SUMMARY.md) (high-level)
2. Deep dive: [`DATABASE_MIGRATION_FIX_SUMMARY.md`](DATABASE_MIGRATION_FIX_SUMMARY.md) (technical details)

### **Task: Find a Specific Table**
1. All docs have module breakdowns showing which tables are in each module
2. Or connect to database: `psql -h localhost -U lera -d lera -c '\dt'`
3. Or search in: [`DATABASE_LOCALHOST_SETUP.md`](DATABASE_LOCALHOST_SETUP.md) → Database Schema section

---

## 📊 The 107 Tables Summary

Quick overview of what you'll get:

| Module | Tables | Key Features |
|--------|--------|--------------|
| Multi-tenant + Auth | 9 | Tenants, roles, permissions, activity logs |
| Students & Parents | 5 | Student profiles, documents, skills |
| Teachers | 3 | Teacher profiles, documents, skills |
| Courses | 3 | Modules, lessons, materials |
| Classes & Attendance | 3 | Schedules, attendance tracking |
| Assignments & Exams | 2 | Assignments, submissions |
| Certificates | 2 | Templates, issued certificates |
| CRM Extensions | 14 | Leads, notes, tags, activities, campaigns |
| Payments | 6 | Methods, scholarships, invoices |
| Payroll | 7 | Cycles, salaries, payouts, taxes |
| AI Gateway | 6 | Exam generation, chat, embeddings |
| Website | 4 | CMS pages, sections, contacts |
| Sports/PlayCircle | 6 | Programs, teams, matches, stats |
| Notifications | 2 | Notifications, preferences |
| Storage/Media | 1 | File management |
| Transport & Bookstore | 4 | Routes, products, orders |
| Internal Ops | 5 | Templates, API keys, jobs |
| Base Schema | ~31 | Core tables from init.sql |
| **TOTAL** | **107** | ✅ |

---

## 🔧 Common Commands Reference

```bash
# Setup and Verification
./setup-local-postgres.sh              # Run setup
./verify-schema.sh                     # Verify schema

# PostgreSQL Management
brew services start postgresql@15      # Start
brew services stop postgresql@15       # Stop
brew services list                     # Check status

# Database Connection
psql -h localhost -U lera -d lera      # Connect via psql

# Inside psql
\dt                                    # List all tables
\d table_name                          # Describe table structure
\q                                     # Exit

# SQL Queries
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';  -- Count tables
```

---

## 🆘 Help! I'm Stuck!

### "I don't know where to start"
→ Read [`VISUAL_SETUP_GUIDE.txt`](VISUAL_SETUP_GUIDE.txt), then run `./setup-local-postgres.sh`

### "The setup script failed"
→ Check [`DATABASE_LOCALHOST_SETUP.md`](DATABASE_LOCALHOST_SETUP.md) → Troubleshooting section

### "I don't have 107 tables"
→ Re-run `./setup-local-postgres.sh` or follow [`DATABASE_SETUP_CHECKLIST.md`](DATABASE_SETUP_CHECKLIST.md)

### "My Spring Boot service won't connect"
→ Follow [`DATABASE_SETUP_CHECKLIST.md`](DATABASE_SETUP_CHECKLIST.md) → Step 4 (Update Services)

### "I want to understand what changed"
→ Read [`DATABASE_COMPLETE_SUMMARY.md`](DATABASE_COMPLETE_SUMMARY.md) first, then [`DATABASE_MIGRATION_FIX_SUMMARY.md`](DATABASE_MIGRATION_FIX_SUMMARY.md)

### "I need a quick command reference"
→ Open [`QUICK_START_DATABASE.txt`](QUICK_START_DATABASE.txt)

---

## 📞 Connection Details (After Setup)

```
Host:     localhost
Port:     5432
Database: lera
Username: lera
Password: lera123
```

**JDBC URL:** `jdbc:postgresql://localhost:5432/lera`

---

## ✅ Success Criteria

You've successfully completed setup when:

- [ ] `./verify-schema.sh` shows "Tables: 107/107"
- [ ] `psql -h localhost -U lera -d lera` connects successfully
- [ ] All Spring Boot services start without database errors
- [ ] You can perform CRUD operations via service APIs

---

## 📁 File Organization

```
LERA_Group/
├── setup-local-postgres.sh              # Main setup script ⭐
├── verify-schema.sh                     # Verification script ⭐
├── DOCUMENTATION_INDEX.md               # This file 📖
├── VISUAL_SETUP_GUIDE.txt              # Visual guide 🎨
├── QUICK_START_DATABASE.txt            # Quick reference 🚀
├── DATABASE_LOCALHOST_SETUP.md         # Complete guide 📚
├── DATABASE_SETUP_CHECKLIST.md         # Step-by-step ✅
├── DATABASE_MIGRATION_FIX_SUMMARY.md   # Technical details 🔧
├── DATABASE_COMPLETE_SUMMARY.md        # High-level overview 📊
└── database/
    ├── init/
    │   └── init.sql                    # Base schema (~41 tables)
    ├── migrations/
    │   └── V2__add_missing_66_tables.sql  # Migration (66 tables)
    └── verify-107-tables.sql           # SQL verification queries
```

---

## 🎉 You're Ready!

Everything you need is documented. Start with:

```bash
./setup-local-postgres.sh
```

Then verify:

```bash
./verify-schema.sh
```

**Happy coding!** 🚀

---

## 🔗 Quick Links

- **Visual Guide**: [`VISUAL_SETUP_GUIDE.txt`](VISUAL_SETUP_GUIDE.txt)
- **Quick Start**: [`QUICK_START_DATABASE.txt`](QUICK_START_DATABASE.txt)
- **Complete Guide**: [`DATABASE_LOCALHOST_SETUP.md`](DATABASE_LOCALHOST_SETUP.md)
- **Checklist**: [`DATABASE_SETUP_CHECKLIST.md`](DATABASE_SETUP_CHECKLIST.md)
- **Summary**: [`DATABASE_COMPLETE_SUMMARY.md`](DATABASE_COMPLETE_SUMMARY.md)
- **Technical Details**: [`DATABASE_MIGRATION_FIX_SUMMARY.md`](DATABASE_MIGRATION_FIX_SUMMARY.md)

---

**Last Updated:** December 23, 2025  
**Version:** 1.0 - Complete 107 Table Implementation
