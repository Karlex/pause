# Keiyaku Project Skill

## Overview
This skill provides comprehensive knowledge about the Keiyaku leave management system, including architecture, implementation details, security considerations, and development patterns.

## When to Use This Skill
- When implementing new features
- When debugging issues
- When reviewing code
- When onboarding new developers
- When making architectural decisions

## Key Information

### Project Purpose
Internal leave and time management platform for UK leadership + India contractors. Self-hosted with Apple-inspired design.

### Current Status
- **Phase 0 (RBAC Foundation):** ✅ COMPLETE
- **Implemented:** Database schema, system roles (5), permissions (91), audit logging, encryption utilities, API routes, Role/Department management UI, permission-based UI hiding
- **Next Phase:** Phase 1 (Core Leave Management)

### Tech Stack
- **Runtime:** Bun
- **Frontend:** React 19 + TanStack Start + Tailwind CSS v4
- **Backend:** Elysia (Bun) + Better Auth
- **Database:** PostgreSQL + Drizzle ORM
- **Deployment:** Self-hosted (Hetzner VPS ~€5/month)

### Architecture
- Separate API (port 3001) and frontend (port 3000)
- File-based routing with TanStack Router
- Type-safe API with Eden Treaty
- Session-based authentication (Better Auth)

### Critical Business Logic

**Balance Formula:**
```
remaining = allowance + carriedOver + adjustment - used - scheduled
```

**Working Days:**
- Excludes weekends
- Excludes UK public holidays
- Half days = 4 hours

**RBAC System:**
- System roles: Super Admin, Employee, Manager, HR Admin, Accountant
- Granular permissions: view, create, edit, delete, approve per resource
- Permission conditions: own_records_only, direct_reports_only
- Multiple roles per user with department scoping

**Approval Hierarchy:**
- Super Admin: Can approve any
- HR Admin: Can approve any
- Manager: Only direct reports (via RBAC permissions)
- Employee: Cannot approve

### Security Status

**Implemented:**
- ✅ Password hashing (bcrypt)
- ✅ HTTP-only session cookies
- ✅ Authorization checks
- ✅ SQL injection prevention (Drizzle)
- ✅ XSS prevention
- ✅ Rate limiting (100 req/min)

**Implemented:**
- ✅ Password hashing (bcrypt)
- ✅ HTTP-only session cookies
- ✅ Authorization checks
- ✅ SQL injection prevention (Drizzle)
- ✅ XSS prevention
- ✅ Rate limiting (100 req/min)
- ✅ RBAC foundation (roles, permissions, audit logging)
- ✅ Field-level encryption utilities (AES-256-GCM)
- ✅ GDPR-compliant sensitive data access logging

**Required Before Production:**
- ⛔ HTTPS enforcement
- ⛔ Database encryption at rest

### Common Patterns

**API Route Pattern (with RBAC):**
```typescript
export const routes = new Elysia({ prefix: "/route" })
  .onBeforeHandle(async ({ request, set }) => {
    // Auth check
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) { set.status = 401; return { error: "Unauthorized" }; }
    
    // Permission check
    const result = await checkPermission({
      userId: session.user.id,
      resource: "leave_requests",
      action: "view"
    });
    if (!result.allowed) { set.status = 403; return { error: "Forbidden" }; }
  })
  .get("/", handler, { response: schema })
  .post("/", handler, { body: schema, response: schema });
```

**Database Transaction Pattern:**
```typescript
const client = await pool.connect();
try {
  await client.query("BEGIN");
  // SELECT ... FOR UPDATE (lock row)
  // Check balance
  // Create request
  // Update balance
  await client.query("COMMIT");
} catch {
  await client.query("ROLLBACK");
} finally {
  client.release();
}
```

**Frontend Data Fetching:**
```typescript
const { data } = useQuery({
  queryKey: ["key"],
  queryFn: async () => {
    const response = await api.api.endpoint.get();
    if (response.error) throw new Error(response.error);
    return response.data;
  },
});
```

### Project Structure
```
src/
├── api/routes/         # Elysia endpoints
├── components/         # React components
│   ├── ui/            # Base UI
│   ├── dashboard/     # Dashboard
│   ├── people/        # People page
│   └── admin/         # Role/Department management
├── db/                # Database
│   ├── schema.ts      # Drizzle schema
│   └── index.ts       # Connection
├── lib/               # Utilities
│   ├── balances.ts    # Balance logic
│   ├── holidays.ts    # Working days
│   ├── auth.ts        # Auth config
│   ├── api-client.ts  # Eden Treaty
│   ├── permissions.ts # RBAC permission checking
│   ├── audit.ts       # Audit logging
│   └── encryption.ts  # Field-level encryption
└── routes/            # TanStack Router
```

### Environment Variables
```bash
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=...
ENCRYPTION_KEY=...
NODE_ENV=production
```

### Commands
```bash
# Dev
bun run dev

# Database
bun run db:generate
bun run db:migrate
bun run db:studio

# Test
bun test
bun run test:unit

# Production
bun run build
```

### Feature Roadmap

**Phase 0 (Complete):** RBAC Foundation + Security
- [x] Database schema (roles, departments, permissions)
- [x] System roles (Super Admin, Employee, Manager, HR Admin, Accountant)
- [x] Granular permissions (91 permissions across 12 resources)
- [x] Permission utilities (checkPermission, canAccessRecord, getUserPermissions)
- [x] Audit logging system (GDPR compliant)
- [x] Field-level encryption utilities
- [x] API routes for roles and departments (with RBAC checks)
- [x] Updated existing API routes with permission checks
- [x] Role management UI (CRUD + permissions)
- [x] Department management UI
- [x] Frontend permission-based UI hiding (usePermissions hook + PermissionGuard components)

**Phase 1:** Core Leave Management
- [ ] Team Calendar / "Who's Out"
- [ ] Approval workflow with RBAC
- [ ] Leave Policies UI
- [ ] Public Holidays management

**Phase 2:** Timesheets
- [ ] Time tracking
- [ ] Invoicing
- [ ] Accounts dashboard

**Phase 3:** Tasks
- [ ] Kanban board

**Phase 4:** Documents
- [ ] Document storage
- [ ] Signatures

**Phase 5:** Employee Data
- [ ] Extended profiles
- [ ] Encrypted fields

**Phase 6:** Performance
- [ ] 1:1s
- [ ] Goals

**Phase 7:** AI
- [ ] AI agent
- [ ] Integrations

## Deep Wiki References

**Architecture:**
- docs/deepwiki/architecture/overview.md
- docs/deepwiki/architecture/project-structure.md

**Data Flow:**
- docs/deepwiki/data-flow/leave-request.md
- docs/deepwiki/data-flow/approval-workflow.md

**Business Logic:**
- docs/deepwiki/business-logic/balance-calculation.md

**API:**
- docs/deepwiki/api/endpoints.md
- docs/deepwiki/api/rbac.md (NEW)

**Components:**
- docs/deepwiki/components/dashboard.md

**Security:**
- docs/deepwiki/security/rbac-system.md (NEW)
- docs/deepwiki/security/audit-logging.md (NEW)

## Important Notes

1. **Always use transactions** for balance updates
2. **Always check permissions** using `checkPermission()` or `canAccessRecord()`
3. **Log audit events** for all create/update/delete operations
4. **Log sensitive data access** for GDPR compliance
5. **Never trust client input** - validate server-side
6. **Update this skill** after every significant change
7. **Test thoroughly** - especially concurrent operations

## Troubleshooting

**Session issues:** Check BETTER_AUTH_SECRET
**Database:** Verify DATABASE_URL, check PostgreSQL running
**Build errors:** Run bun install, check TypeScript

## Updates

**Last Updated:** February 2026
**Update Frequency:** After every feature
**Maintained by:** Development team
