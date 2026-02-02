## Approval Workflow Implementation Summary

### What Was Built

**Backend Changes:**

1. **Fixed Decline Endpoint** (`src/api/routes/approvals.ts`)
   - Now properly restores scheduled balance when declining a request
   - Updates `scheduled` field in `leave_balances` table

2. **Added Pending Count Endpoint** (`src/api/routes/approvals.ts`)
   - `GET /api/approvals/count` - Returns count of pending approvals
   - Respects RBAC permissions (managers see only direct reports)

3. **Updated Manager Team API** (`src/api/routes/manager.ts`)
   - Now returns `pendingRequests` array for each team member
   - Shows requests awaiting manager approval
   - Fixed TypeScript issues with relation handling

**Frontend Changes:**

1. **Enhanced ApprovalView Component** (`src/components/dashboard/ApprovalView.tsx`)
   - Full pending approvals queue with real data
   - One-click approve action
   - Decline with reason modal (inline, not navigating away)
   - Shows employee details, dates, leave type, and notes
   - Loading states and error handling
   - Auto-refreshes after approve/decline

2. **Manager Dashboard** (`src/components/dashboard/ManagerDashboard.tsx`)
   - Already existed but now pulls from updated API
   - Shows pending requests per team member

### Features

**Managers/Super Admins can:**
- View all pending leave requests awaiting their approval
- See who submitted the request, dates, leave type, and notes
- Approve requests with one click (updates balance automatically)
- Decline requests with a reason (restores scheduled balance)
- See real-time counts of pending approvals

**Balance Management:**
- **Approve**: Deducts from scheduled, adds to used
- **Decline**: Restores scheduled balance so employee can use those days elsewhere

### API Endpoints

- `GET /api/approvals/pending` - List all pending requests
- `GET /api/approvals/count` - Get count only (for badges)
- `POST /api/approvals/:id/approve` - Approve a request
- `POST /api/approvals/:id/decline` - Decline a request (with optional note)

### RBAC Permissions

Uses existing `leave_requests` resource with `approve` action:
- Super Admin/HR Admin: Can approve any request
- Manager: Can approve only direct reports' requests (with `direct_reports_only` condition)
- Employee: Cannot approve

### Next Steps (Email Notifications)

Email notifications can be added in the future:
- Notify manager when employee submits request
- Notify employee when request is approved/declined
- Daily digest of pending approvals for managers
