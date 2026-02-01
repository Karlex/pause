# Pause - AI Agent Guide

## Project Overview

Pause is a self-hosted leave and time management platform with Apple-inspired design.

## Commands

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

## Project Structure

```
src/
├── api/              # Elysia API routes
├── components/       # Shared UI components
│   └── ui/           # Base UI primitives
├── db/               # Drizzle schema and connection
├── hooks/            # Custom React hooks
├── lib/              # Utilities and helpers
├── routes/           # TanStack Router file-based routes
└── styles.css        # Tailwind CSS with design tokens
```

## Design Principles

This project follows Apple/Jony Ive design philosophy:

1. **Reduction** — Remove until it breaks, add back only essentials
2. **Inevitability** — UI should feel like it couldn't be designed any other way
3. **Deference** — UI defers to content, minimal chrome
4. **Depth** — Subtle layers, shadows, translucency for hierarchy
5. **Precision** — Every pixel matters, mathematical spacing
6. **Tactility** — Interactions feel physical (Motion animations)

## Code Conventions

- Use TypeScript strict mode
- Prefer `@/` path aliases for imports
- Use Zod for all validation
- Follow existing component patterns in `src/components/`
- Use design tokens from `src/styles.css` (never hardcode colors/spacing)
- Animations use Motion with physics-based easing
- No comments unless code is complex
- Respect `prefers-reduced-motion`

**For detailed coding standards, see [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md)**

## Design Tokens

All colors, spacing, and typography are defined as CSS variables in `src/styles.css`. Use Tailwind classes that reference these tokens:

- Colors: `bg-primary`, `text-fg-primary`, `border-separator`, etc.
- Spacing: `space-xs`, `space-sm`, `space-md`, `space-lg`, `space-xl`
- Radius: `rounded-sm`, `rounded-md`, `rounded-lg`
- Shadows: `shadow-sm`, `shadow-md`, `shadow-lg`

## API Routes (Elysia)

API routes are defined in `src/api/` and mounted at `/api`. Use Elysia's type-safe approach with Zod schemas for validation.

## Testing Strategy

### Test Organization

```
src/__tests__/
├── unit/              # Unit tests (no external dependencies)
│   ├── services.test.ts
│   └── components.test.tsx
├── integration/       # Integration tests (with mocked DB)
│   └── api.test.ts
└── e2e/              # E2E tests (requires full stack)
    └── workflows.test.ts
```

### Writing Tests

**Unit Tests:** Test business logic in isolation
```typescript
import { describe, it, expect, vi } from "vitest";
import { calculateWorkingDays } from "@/lib/holidays";

describe("calculateWorkingDays", () => {
  it("excludes weekends", () => {
    const start = new Date("2026-06-13"); // Saturday
    const end = new Date("2026-06-19");   // Friday
    expect(calculateWorkingDays(start, end)).toBe(5);
  });
});
```

**Integration Tests:** Test API with mocked database
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db", () => ({
  db: {
    query: { /* mock implementations */ }
  }
}));

describe("Leave Requests API", () => {
  it("should create request with valid data", async () => {
    // Test implementation
  });
});
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

## Documentation

- **API Documentation:** See `docs/API.md`
- **Architecture:** See `docs/ARCHITECTURE.md`
- **Database Schema:** See `src/db/schema.ts`
