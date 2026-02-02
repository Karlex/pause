# Keiyaku Development Roadmap

Comprehensive roadmap for internal leave, time & task management platform.

## 🎯 Project Overview

Keiyaku is an internal tool for a service company with UK leadership and India contractors. Self-hosted with Apple-inspired design principles.

**Current State:** ~60% MVP complete (leave requests working, core API built)

---

## ✅ COMPLETED

### Foundation
- [x] Project setup with TanStack Start + React 19
- [x] Database schema (Drizzle ORM)
- [x] Authentication system (Better Auth)
  - [x] Email/password login
  - [x] Magic link login
  - [x] User sessions
  - [x] Protected routes
- [x] Design system implementation
  - [x] Tailwind CSS v4 with custom tokens
  - [x] Base UI components (Button, Input, Select, DatePicker)
  - [x] Animation system (Motion)

### Core UI
- [x] Dashboard layout with navigation
- [x] Dashboard page structure
  - [x] Header with greeting
  - [x] Balance cards (real data from API)
  - [x] Upcoming time off section (real data)
  - [x] Pending actions (UI stub)
  - [x] Today's schedule (UI stub)
- [x] People page
  - [x] Employee list view (real data)
  - [x] Add employee modal
  - [x] Employee avatars and roles

### Core Features (WORKING!)
- [x] **Leave Request Flow** (FULLY FUNCTIONAL)
  - [x] Click balance card → opens request modal
  - [x] Date picker with range selection
  - [x] Leave type selection (pre-filled from card)
  - [x] Half-day toggle
  - [x] Notes field
  - [x] Submit to API
  - [x] Balance validation (prevents overdrawn)
  - [x] Auto-approval for super admins
  - [x] Optimistic UI updates
- [x] Leave balances API (calculates from requests)
- [x] Employees API
- [x] Leave requests API (GET + POST)

### Admin Features
- [x] Approval API endpoints
- [x] Manager dashboard stub
- [x] Approvals page stub

### RBAC System (Phase 0 - COMPLETE)
- [x] Roles table with granular permissions
- [x] Departments table with manager assignment
- [x] User-roles junction (multiple roles per user)
- [x] Permission matrix: view, create, edit, delete, approve per resource
- [x] System roles (protected): Super Admin, Employee, Manager, HR Admin, Accountant
- [x] Role management UI (CRUD + permission assignment)
  - [x] Role list with icons (Crown, UsersThree, UserGear, Calculator, Briefcase)
  - [x] Permission matrix with legend (V, C, E, D, A)
  - [x] Create/edit role modal
  - [x] Delete confirmation for custom roles
- [x] Department management UI
- [x] Permission utilities (checkPermission, canAccessRecord, getUserPermissions)
- [x] Audit logging system
- [x] Field-level encryption utilities

---

## 📋 COMPLETE PRODUCT ROADMAP

### Phase 0: RBAC Foundation + Security ✅ COMPLETE
*Foundation established. Zero trust security for sensitive data.*

**Custom Roles & Permissions:** ✅
- [x] Roles table with granular permissions
- [x] Departments table with manager assignment
- [x] User-roles junction (multiple roles per user)
- [x] Permission matrix: view, create, edit, delete, approve per resource
- [x] System roles (protected): Super Admin (1 user only), Employee, Manager, HR Admin, Accountant
- [x] Role management UI (CRUD + permission assignment)
- [x] Department management UI

**Security Foundation:** ✅
- [x] Field-level encryption utilities (AES-256-GCM)
- [x] Audit logging (who accessed what sensitive data when)
- [x] Permission checking on all API routes
- [x] Frontend permission-based UI hiding

**Remaining Security (Before sensitive data):**
- [ ] HTTPS enforcement
- [ ] Database encryption at rest

**Security Foundation:**
- [ ] Field-level encryption for: bank details, ID numbers, salary info
- [ ] Audit logging (who accessed what sensitive data when)
- [ ] GDPR compliance framework
- [ ] Secure file storage (encrypted at rest)
- [ ] HTTPS enforcement

**Resources to protect:**
- users, departments, roles, permissions
- leave_requests, leave_policies, public_holidays
- tasks, documents, notifications

---

### Phase 1: Core Leave Management (1-2 weeks)
*Complete the leave system with regional support.*

**Team Calendar / "Who's Out":**
- [ ] Month view calendar with team members on leave
- [ ] Filter by department and location
- [ ] Dashboard "Who's Out" section (today, tomorrow, this week)
- [ ] Visual indicators for different leave types

**Approval Workflow:**
- [ ] Pending approvals queue with real data
- [ ] One-click approve/decline actions
- [ ] Decline with reason (inline, not modal)
- [ ] Manager dashboard with real approval counts
- [ ] Email notifications for approvals
- [ ] Uses new RBAC permission system

**Leave Policies:**
- [ ] Policy CRUD UI
- [ ] Assign policies to users
- [ ] Accrual rules (upfront, monthly, quarterly, annual)
- [ ] Carry-over settings
- [ ] Policy-based balance calculation

**Public Holidays:**
- [ ] Holiday management UI
- [ ] Import standard holidays (UK, India, US)
- [ ] Region assignment
- [ ] Holiday display in calendar picker

**Enhanced Leave Request:**
- [ ] Visual calendar selection (vs date picker)
- [ ] Public holiday warnings
- [ ] Team conflict detection
- [ ] Edit/cancel pending requests

---

### Phase 2: Timesheets + Invoicing (3-4 weeks)
*Contractor billing and client invoicing system.*

**Timesheet System:**
- [ ] Daily/weekly timesheet entry
- [ ] 8 hours/day default, editable
- [ ] Project/client tagging (contractors can work multiple clients)
- [ ] Leave integration:
  - Approved leave = paid hours at standard rate
  - Unapproved leave = unpaid (contractor must work it out)
- [ ] Submit for approval workflow
- [ ] Timesheet history and status tracking

**Invoice Generation:**
- [ ] Aggregate approved timesheet hours per client
- [ ] Format: "X hours @ £Rate/hour = £Total"
- [ ] Contractor review before submission
- [ ] Invoice status: Draft → Submitted → Approved → Paid
- [ ] PDF generation with company branding
- [ ] Invoice templates (customizable per client)
- [ ] Invoice history and search

**Accounts Team Dashboard:**
- [ ] New role: "Accountant" (view-only timesheets/invoices)
- [ ] View all contractor timesheets
- [ ] View all invoices with filters (contractor, client, date range)
- [ ] Export for accounting software (CSV, Excel)
- [ ] Auto-email weekly timesheet summaries
- [ ] Approval workflow for invoices

---

### Phase 3: Task Management (Kanban) (2-3 weeks)
*Team visibility and cross-department collaboration.*

**Kanban Board:**
- [ ] Kanban columns: To Do, In Progress, Done (customizable)
- [ ] Personal task boards (employees see own tasks)
- [ ] Manager view (all tasks for direct reports)
- [ ] Drag-and-drop interface

**Task Features:**
- [ ] Task fields: title, description, status, assignee, due date
- [ ] Department tagging
- [ ] Cross-department visibility flag (visible to other departments)
- [ ] Comments/activity on tasks
- [ ] Task templates

**Permissions:**
- [ ] Can view all tasks (role-based permission)
- [ ] Can create own tasks
- [ ] Managers can create and assign tasks
- [ ] Can view cross-department tasks (role-based)

---

### Phase 4: Document Management + Policies (3-4 weeks)
*Legal compliance and document workflows.*

**Document Storage:**
- [ ] Folder structure: Clients/, Employees/, Templates/
- [ ] Role-based access control (Legal, Manager, Employee levels)
- [ ] Version control with history
- [ ] Secure file upload (encrypted at rest)
- [ ] Document search and filtering
- [ ] Document expiration reminders

**Policy Management:**
- [ ] Upload policy documents (PDF, DOCX)
- [ ] Categorize policies (HR, Legal, Security, etc.)
- [ ] Require read acknowledgment
- [ ] Digital signature for policy acceptance
- [ ] Compliance tracking (who has/hasn't signed)
- [ ] Auto-reminders for pending acknowledgments
- [ ] Set renewal/review dates
- [ ] Compliance reports and dashboards

**Custom Document Signing:**
- [ ] Template-based contract generation
- [ ] Custom signing workflow (build with AI assistance)
- [ ] Signature tracking and audit trail
- [ ] Store signed documents securely
- [ ] Signature reminders
- [ ] Multiple signer support

---

### Phase 5: Extended Employee Data (2-3 weeks)
*Complete HR profiles with security.*

**Employee Profiles:**
- [ ] Contact info: phone, emergency contact, address, personal email
- [ ] Employment details: start date, contract type, work hours, location, timezone
- [ ] Sensitive data (encrypted): salary, bank details, tax/ID numbers, NI number, benefits
- [ ] Documents: contracts, P45, P60, tax forms, certifications, passport/ID

**Employee Self-Service:**
- [ ] Edit own contact details
- [ ] View own documents
- [ ] View sensitive data (bank details masked)
- [ ] Upload personal documents
- [ ] View leave balances and history
- [ ] View timesheet and invoice history

**Admin Features:**
- [ ] Complete employee record management
- [ ] Document upload for employees
- [ ] Salary and bank detail management (encrypted)
- [ ] Employment history tracking

---

### Phase 6: Performance Management (3-4 weeks)
*Lightweight but complete performance tracking.*

**1:1 Meeting Notes:**
- [ ] Schedule recurring 1:1s with managers
- [ ] Meeting notes and action items
- [ ] Meeting history and tracking
- [ ] Automated meeting reminders

**Goals/OKRs:**
- [ ] Quarterly goal setting
- [ ] Goal categories: individual, team, company
- [ ] Progress tracking with milestones
- [ ] Manager check-ins and feedback
- [ ] Mark goals complete with evidence/links
- [ ] Goal history and retrospectives

**Annual Reviews:**
- [ ] Review cycle management (annual, probation, etc.)
- [ ] Self-assessment forms
- [ ] Manager feedback and ratings
- [ ] 360 feedback (optional, lightweight)
- [ ] Final documentation storage
- [ ] Review scheduling and reminders

---

### Phase 7: AI Agent + Integrations (Future - 4-6 weeks)
*Automation and convenience features.*

**AI Agent (OpenRouter):**
- [ ] Chat interface in app (sidebar or modal)
- [ ] Privacy-first design:
  - Use internal IDs instead of PII (never send names to AI)
  - Context includes: user_id, department_id, abstract data only
  - Map responses back to real data internally
- [ ] Capabilities:
  - "Book leave for Friday" → creates leave request
  - "What's my leave balance?" → queries balances
  - "Schedule meeting with U-123 tomorrow" → creates calendar event
  - "Who's out this week?" → queries team calendar
- [ ] Start with OpenRouter free tier (50 req/day)
- [ ] Expand to paid tier as usage grows

**Integrations:**
- [ ] Slack integration:
  - Leave approval notifications in channel/DM
  - Daily "Who's Out" digest
  - Timesheet deadline reminders
  - Policy update announcements
- [ ] Calendar sync:
  - Google Calendar integration (two-way)
  - Outlook integration
  - Leave events appear in personal calendar
- [ ] Email (Resend):
  - Transactional emails for approvals
  - Weekly digest emails
  - Notification preferences

**Reports & Analytics:**
- [ ] Leave utilization reports (monthly/quarterly)
- [ ] Timesheet summaries for billing
- [ ] Policy compliance reports
- [ ] Team availability overview
- [ ] Financial summaries (revenue by client)
- [ ] Export to CSV/Excel

---

## 📊 Implementation Timeline

| Phase | Duration | Key Deliverable |
|-------|----------|----------------|
| 0 | 1-2 weeks | RBAC + Security foundation |
| 1 | 1-2 weeks | Complete leave system |
| 2 | 3-4 weeks | Timesheets + Invoicing (usable product) |
| 3 | 2-3 weeks | Kanban task management |
| 4 | 3-4 weeks | Documents + Policy compliance |
| 5 | 2-3 weeks | Employee profiles + secure data |
| 6 | 3-4 weeks | Performance management |
| 7 | Future | AI agent + Integrations |

**Total: 15-22 weeks to complete all phases**
**Usable product after Phase 2 (Timesheets + Invoicing)**

---

## 🎯 Current Sprint Focus

Based on current state (~75% complete), the **immediate priority** is:

### ✅ Phase 0 COMPLETE - Moving to Phase 1

**RBAC Foundation is now complete!** We have:
- ✅ Database schema with roles, departments, permissions
- ✅ System roles (Super Admin, Employee, Manager, HR Admin, Accountant)
- ✅ Role management UI with permission matrix
- ✅ Department management UI
- ✅ Permission utilities and audit logging
- ✅ Field-level encryption utilities

### Next: Phase 1 - Core Leave Management

Now that RBAC is complete, we can focus on:

1. **Team Calendar / "Who's Out"**
   - Month view calendar showing team on leave
   - Dashboard "Who's Out" section
   - Filter by department

2. **Approval Workflow (API ready, needs UI)**
   - Pending approvals queue with real data
   - One-click approve/decline
   - Manager dashboard with real counts

3. **Leave Policies**
   - Policy CRUD UI
   - Assign policies to users
   - Accrual rules

4. **Public Holidays**
   - Holiday management UI
   - Import standard holidays (UK, India)

---

## 📊 Completion Status

| Feature Area | Completion | Notes |
|--------------|------------|-------|
| Authentication | 95% | Email + magic link working |
| Dashboard UI | 70% | Real balances & requests, stubs for rest |
| Leave Request Flow | 85% | Fully functional! Just needs polish |
| People Management | 70% | List + add working |
| Team Calendar | 10% | Route exists, needs implementation |
| Approvals | 30% | API ready, UI stubbed |
| Leave Policies | 0% | Schema ready, no UI |
| Public Holidays | 0% | Schema ready, no UI |
| RBAC System | 95% | Phase 0 complete! UI done, needs HTTPS for prod |
| Timesheets | 0% | Not started - Phase 2 |
| Invoicing | 0% | Not started - Phase 2 |
| Task Management | 0% | Not started - Phase 3 |
| Document Management | 0% | Not started - Phase 4 |
| Policy Compliance | 0% | Not started - Phase 4 |
| Employee Data | 0% | Not started - Phase 5 |
| Performance Management | 0% | Not started - Phase 6 |
| AI Agent | 0% | Not started - Phase 7 |

**Overall Progress: ~35%** (of complete roadmap)

---

## 🚀 What Users Can Do Now

- ✅ Log in via email/password or magic link
- ✅ View dashboard with real leave balances
- ✅ View upcoming time off
- ✅ Click any balance card to request leave
- ✅ Pick dates, add notes, submit request
- ✅ See requests update in real-time
- ✅ View people/employee list
- ✅ Add new employees (admin)

---

## ❌ Features We Skipped

(Not relevant for internal tool with <10 people)

- Full recruitment/ATS system
- Benefits administration portal
- Complex multi-country payroll (use Deel/Remote for contractors)
- Learning management system (LMS)
- Advanced predictive analytics
- Enterprise workflow builders
- White-label branding

---

## 🎯 Success Criteria

- **Effortless**: Request leave in <20 seconds, submit timesheet in <2 minutes
- **Secure**: All sensitive data encrypted, full audit trail
- **Beautiful**: "This feels like an Apple app" feedback
- **Clear**: Zero ambiguity about balances, timesheets, or invoices
- **Configurable**: Custom roles and permissions adapt to any team structure
- **Compliant**: GDPR ready, policy signatures tracked, document retention
