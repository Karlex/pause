# Keiyaku - AI Agent Guide

**Last Updated:** February 2026  
**Purpose:** Central hub for AI agents working on Keiyaku

---

## Quick Start for Agents

**ALWAYS CHECK FIRST:**
1. **Skill File:** `.claude/skills/keiyaku-project.md` - Current project state
2. **Deep Wiki:** `docs/deepwiki/` - Detailed technical documentation
3. **This File:** `AGENTS.md` - Commands and conventions

**When starting work:**
1. Read the skill file to understand current state
2. Check deep wiki for detailed docs on what you're working on
3. Update the skill file after completing work

---

## Project Overview

Keiyaku is a self-hosted leave and time management platform with Apple-inspired design.

**Current Status:** Phase 0 (RBAC Foundation) ~80% complete  
**Next Phase:** Complete Phase 0 UI, then Phase 1 (Core Leave Management)  
**Deployment:** Self-hosted on Hetzner VPS (~€5/month)

---

## Essential Commands

```bash
# Development
bun install          # Install dependencies
bun run dev          # Start dev server (port 3000)
bun run build        # Production build
bun run preview      # Preview production build

# Testing
bun run test         # Run all tests (Vitest)
bun run test:unit    # Run unit tests only
bun run test:integration # Run integration tests (requires server running)
bun run test:watch   # Run tests in watch mode

# Code Quality
bun run check        # Biome check (lint + format)
bun run lint         # Biome lint only
bun run format       # Biome format only

# Database
bun run db:generate  # Generate Drizzle migrations
bun run db:migrate   # Run migrations
bun run db:push      # Push schema (dev only)
bun run db:studio    # Open Drizzle Studio
bun run db:seed      # Seed database with test data
bun run db:reset     # Reset and reseed database
```

---

## Knowledge Resources

### 1. Skill File (ALWAYS READ FIRST)
**Location:** `.claude/skills/keiyaku-project.md`

**What's in it:**
- Current project status
- Architecture overview
- Critical business logic
- Security checklist
- Common patterns
- Feature roadmap

**When to read:**
- Before starting any work
- When returning to project after break
- When context seems unclear

**When to update:**
- After adding new features
- After changing architecture
- After modifying business logic
- After security changes
- After completing roadmap items

### 2. Deep Wiki (DETAILED DOCS)
**Location:** `docs/deepwiki/`

**Structure:**
```
docs/deepwiki/
├── README.md                    # Wiki overview
├── architecture/
│   ├── overview.md             # System architecture
│   └── project-structure.md    # Directory structure
├── data-flow/
│   ├── leave-request.md        # Leave request flow
│   └── approval-workflow.md    # Approval flow
├── api/
│   └── endpoints.md            # API documentation
├── components/
│   └── dashboard.md            # Component docs
├── business-logic/
│   └── balance-calculation.md  # Balance logic
└── [future sections]
```

**When to read:**
- Need to understand how something works
- Implementing new features
- Debugging issues
- Onboarding new developers

**When to update:**
- After adding new endpoints
- After changing data flows
- After modifying components
- After adding business logic

### 3. This File (QUICK REFERENCE)
**Location:** `AGENTS.md`

**What's in it:**
- Commands
- Tech stack
- Code conventions
- Design principles
- Testing strategy

**When to read:**
- Need a command reference
- Checking code conventions
- Understanding design principles

---

## Tech Stack

- **Runtime**: Bun
- **Framework**: TanStack Start + React 19
- **Routing**: TanStack Router (file-based in `src/routes/`)
- **Data**: TanStack Query + Drizzle ORM + PostgreSQL
- **API**: Elysia (in `src/api/`)
- **Auth**: Better Auth
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Components**: Base UI (unstyled, accessible)
- **Animation**: Motion (Framer)
- **Validation**: Zod
- **Icons**: Lucide React

---

## Project Structure

```
src/
├── api/              # Elysia API routes
│   ├── index.ts
│   └── routes/
│       ├── approvals.ts
│       ├── employees.ts
│       ├── leave-balances.ts
│       ├── leave-requests.ts
│       └── manager.ts
├── components/       # Shared UI components
│   ├── ui/          # Base UI primitives
│   ├── dashboard/   # Dashboard components
│   └── people/      # People page components
├── db/              # Drizzle schema and connection
│   ├── index.ts
│   └── schema.ts
├── lib/             # Utilities and helpers
│   ├── api-client.ts
│   ├── auth.ts
│   ├── balances.ts
│   ├── encryption.ts
│   ├── holidays.ts
│   ├── logger.ts
│   └── utils.ts
├── routes/          # TanStack Router file-based routes
│   ├── _layout.tsx
│   ├── _layout/
│   ├── __root.tsx
│   └── index.tsx
└── styles.css       # Tailwind CSS with design tokens
```

---

## Critical Business Logic

### Balance Formula
```
remaining = allowance + carriedOver + adjustment - used - scheduled
```

### Working Days
- Excludes weekends
- Excludes UK public holidays
- Half days = 4 hours

### RBAC System
- **System Roles:** Super Admin, Employee, Manager, HR Admin, Accountant
- **Permissions:** view, create, edit, delete, approve per resource
- **Conditions:** own_records_only, direct_reports_only
- **Multiple Roles:** Users can have multiple roles with department scoping

### Approval Hierarchy
- **Super Admin:** Can approve any
- **HR Admin:** Can approve any
- **Manager:** Only direct reports (via RBAC permissions)
- **Employee:** Cannot approve

**For full details, see:**
- Skill file: "Critical Business Logic" section
- Deep wiki: `docs/deepwiki/business-logic/balance-calculation.md`
- Deep wiki: `docs/deepwiki/security/rbac-system.md`

---

## Design Principles

This project follows Apple/Jony Ive design philosophy:

1. **Reduction** — Remove until it breaks, add back only essentials
2. **Inevitability** — UI should feel like it couldn't be designed any other way
3. **Deference** — UI defers to content, minimal chrome
4. **Depth** — Subtle layers, shadows, translucency for hierarchy
5. **Precision** — Every pixel matters, mathematical spacing
6. **Tactility** — Interactions feel physical (Motion animations)

---

## Code Conventions

- Use TypeScript strict mode
- Prefer `@/` path aliases for imports
- Use Zod for all validation
- Follow existing component patterns in `src/components/`
- Use design tokens from `src/styles.css` (never hardcode colors/spacing)
- Animations use Motion with physics-based easing
- No comments unless code is complex
- Respect `prefers-reduced-motion`

**For detailed coding standards, see:**
- This file: "Code Conventions" section
- Deep wiki: `docs/deepwiki/architecture/project-structure.md`

---

## Design Tokens

All colors, spacing, and typography are defined as CSS variables in `src/styles.css`. Use Tailwind classes that reference these tokens:

- Colors: `bg-primary`, `text-fg-primary`, `border-separator`, etc.
- Spacing: `space-xs`, `space-sm`, `space-md`, `space-lg`, `space-xl`
- Radius: `rounded-sm`, `rounded-md`, `rounded-lg`
- Shadows: `shadow-sm`, `shadow-md`, `shadow-lg`

---

## API Patterns

**Route Structure (with RBAC):**
```typescript
import { checkPermission, canAccessRecord } from "@/lib/permissions";
import { logCreate, logUpdate } from "@/lib/audit";

export const routeNameRoutes = new Elysia({ prefix: "/route-name" })
  .onBeforeHandle(async ({ request, set }) => {
    // Auth check
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) { set.status = 401; return { error: "Unauthorized" }; }
    
    // Store user in context
    return { user: session.user };
  })
  .get("/", async ({ user }) => {
    // Permission check
    const result = await checkPermission({
      userId: user.id,
      resource: "leave_requests",
      action: "view"
    });
    
    if (!result.allowed) {
      return { error: "Forbidden", status: 403 };
    }
    
    // Apply conditions
    if (result.conditions?.own_records_only) {
      // Filter to user's own records
    }
    
    // Handler
  }, { response: { /* Zod schema */ } })
  .post("/", async ({ body, user }) => {
    // Check permission
    const result = await checkPermission({
      userId: user.id,
      resource: "leave_requests",
      action: "create"
    });
    
    if (!result.allowed) {
      return { error: "Forbidden", status: 403 };
    }
    
    // Create record
    const record = await db.insert(table).values(body).returning();
    
    // Audit log
    await logCreate("leave_requests", record[0].id, user.id, body);
    
    return record[0];
  }, { body: t.Object({ /* validation */ }), response: {} });
```

**Permission Checking:**
```typescript
// Simple check
const result = await checkPermission({ userId, resource: "users", action: "view" });

// Record-level check
const canView = await canAccessRecord({
  userId,
  resource: "leave_requests",
  action: "view",
  recordUserId: request.userId
});

// Get all user permissions
const permissions = await getUserPermissions(userId);
```

**Audit Logging:**
```typescript
import { logCreate, logUpdate, logDelete, logSensitiveDataAccess } from "@/lib/audit";

// Log creation
await logCreate("entity_type", entityId, userId, data);

// Log update with changes
await logUpdate("entity_type", entityId, userId, oldData, newData);

// Log deletion
await logDelete("entity_type", entityId, userId, data);

// Log sensitive data access (GDPR)
await logSensitiveDataAccess({
  userId: accessorId,
  accessedUserId: targetId,
  fieldName: "bank_details",
  action: "view",
  reason: "Processing payroll"
});
```

**For full API docs, see:**
- Deep wiki: `docs/deepwiki/api/endpoints.md`
- Deep wiki: `docs/deepwiki/security/rbac-system.md`
- Deep wiki: `docs/deepwiki/security/audit-logging.md`

---

## Database Patterns

**Always use transactions for balance updates:**
```typescript
const client = await pool.connect();
try {
  await client.query("BEGIN");
  // Lock row: SELECT ... FOR UPDATE
  // Check balance
  // Create request
  // Update balance
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
}
```

---

## Testing Strategy

### Test Organization

```
src/__tests__/
├── unit/              # Unit tests (no external dependencies)
│   └── services.test.ts
├── integration/       # Integration tests (with mocked DB)
│   └── api.test.ts
└── e2e/              # E2E tests (requires full stack)
    └── workflows.test.ts
```

### Test Coverage Goals

- **Business Logic:** 100% coverage (holidays, balances, validations)
- **API Routes:** 80%+ coverage (all endpoints tested)
- **Components:** 60%+ coverage (critical user flows)

### Running Tests

```bash
# Run all tests
bun run test

# Run specific test file
bun test src/__tests__/unit/services.test.ts

# Run with coverage
bun test --coverage

# Run in watch mode (during development)
bun test --watch
```

---

## Security Checklist

### Implemented ✅
- [x] Password hashing (bcrypt via Better Auth)
- [x] HTTP-only session cookies
- [x] Authorization checks on all routes
- [x] SQL injection prevention (Drizzle ORM)
- [x] XSS prevention (React escaping + input sanitization)
- [x] Rate limiting (100 req/min)
- [x] Security headers (CSP, HSTS, etc.)

### Required Before Sensitive Data ⛔
- [ ] HTTPS enforcement
- [ ] Database encryption at rest

**For security details, see:**
- Skill file: "Security Checklist" section
- Deep wiki: `docs/deepwiki/security/rbac-system.md`
- Deep wiki: `docs/deepwiki/security/audit-logging.md`

---

## Feature Roadmap

### Phase 0: RBAC Foundation + Security (Current)
- [x] Authentication (Better Auth)
- [x] Database schema (roles, departments, permissions)
- [x] System roles (5 roles: Super Admin, Employee, Manager, HR Admin, Accountant)
- [x] Granular permissions (91 permissions across 12 resources)
- [x] Permission utilities (checkPermission, canAccessRecord, getUserPermissions)
- [x] Audit logging system (GDPR compliant)
- [x] Field-level encryption utilities (AES-256-GCM)
- [ ] Role management UI
- [ ] Department management UI
- [ ] API route permission integration
- [ ] Frontend permission-based UI hiding

### Phase 1: Core Complete
- [ ] Team calendar improvements
- [ ] Approval workflow UI polish
- [ ] Leave policies UI
- [ ] Public holidays management

### Phase 2: Timesheets + Invoicing
- [ ] Timesheet entry
- [ ] Project/client tagging
- [ ] Invoice generation
- [ ] Accounts team dashboard

### Phase 3: Task Management
- [ ] Kanban board
- [ ] Task assignments
- [ ] Cross-department visibility

### Phase 4: Documents
- [ ] Document storage
- [ ] Policy management
- [ ] Digital signatures

### Phase 5: Employee Data
- [ ] Extended profiles
- [ ] Bank details (encrypted)
- [ ] Contract management

### Phase 6: Performance
- [ ] 1:1 meeting notes
- [ ] Goals/OKRs
- [ ] Annual reviews

### Phase 7: AI + Integrations
- [ ] AI agent (OpenRouter)
- [ ] Slack integration
- [ ] Calendar sync

**For detailed roadmap, see:**
- Skill file: "Feature Roadmap" section
- Docs: `docs/ROADMAP.md`

---

## Documentation Index

### Quick Reference
- **This file:** `AGENTS.md` - Commands, conventions, quick reference
- **Skill file:** `.claude/skills/keiyaku-project.md` - Current state, patterns, roadmap
- **README:** `README.md` - User-facing setup and deployment

### Deep Wiki (Technical Docs)
- **Architecture:** `docs/deepwiki/architecture/`
- **Data Flow:** `docs/deepwiki/data-flow/`
- **API:** `docs/deepwiki/api/`
- **Components:** `docs/deepwiki/components/`
- **Business Logic:** `docs/deepwiki/business-logic/`

### Other Docs
- **Roadmap:** `docs/ROADMAP.md`
- **API Docs:** `docs/API.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Coding Standards:** `docs/CODING_STANDARDS.md`

---

## Agent Workflow

### When Starting Work

1. **Read skill file** (`.claude/skills/keiyaku-project.md`)
   - Understand current state
   - Check what's already implemented
   - Review security checklist

2. **Check deep wiki**
   - Read relevant sections for your task
   - Understand existing patterns
   - Note any documented edge cases

3. **Plan your work**
   - Create todo list if complex
   - Identify files to modify
   - Check for dependencies

### During Work

4. **Follow conventions**
   - Match existing code style
   - Use established patterns
   - Respect design principles

5. **Test as you go**
   - Run relevant tests
   - Check code quality
   - Verify functionality

### After Completing Work

6. **Update documentation**
   - **Update skill file** with new information
   - **Update deep wiki** if you changed:
     - API endpoints
     - Data flows
     - Business logic
     - Components
   - **Update this file** if you added:
     - New commands
     - New conventions
     - New patterns

7. **Final checks**
   - Run full test suite
   - Run lint and typecheck
   - Verify no secrets committed
   - Review changes

---

## Important Reminders

### ALWAYS DO:
- ✅ Read skill file before starting
- ✅ Update skill file after finishing
- ✅ Update deep wiki for significant changes
- ✅ Use transactions for balance updates
- ✅ Check authorization on sensitive operations
- ✅ Test thoroughly
- ✅ Run lint and typecheck

### NEVER DO:
- ❌ Commit secrets or API keys
- ❌ Skip authorization checks
- ❌ Store sensitive data unencrypted
- ❌ Break existing tests without fixing
- ❌ Forget to update documentation

---

## Troubleshooting

**Session issues:**
- Check `BETTER_AUTH_SECRET` is set
- Ensure cookies are being sent

**Database connection:**
- Verify `DATABASE_URL` format
- Check PostgreSQL is running

**Build errors:**
- Run `bun install`
- Check TypeScript: `bun run check`

**Test failures:**
- Check database is seeded
- Verify test environment variables

---

## Questions?

1. Check the **skill file** first
2. Check the **deep wiki** for details
3. Check this **AGENTS.md** for conventions
4. Ask in #dev channel

---

**Remember:** This is a living document. Update it, the skill file, and the deep wiki as the project evolves.
