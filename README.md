# Keiyaku

An open-source, self-hosted leave and time management platform with an Apple-inspired design.

> *"Design is not just what it looks like and feels like. Design is how it works."* — Steve Jobs

## Features

- **Effortless Leave Requests** — Submit leave in under 20 seconds
- **Apple-Inspired Design** — Clean, minimal, beautiful interface
- **Team Calendar** — See who's out at a glance
- **Multi-Region Support** — Handle different public holidays by location
- **Flexible Policies** — Configure leave types, accrual rules, carry-over
- **Approval Workflows** — Automated or manual approval chains
- **Email Notifications** — Keep everyone informed
- **Self-Hosted** — Full control over your data

## Tech Stack

- **Runtime**: Bun
- **Framework**: TanStack Start + React 19
- **Database**: PostgreSQL 16 + Drizzle ORM
- **API**: Elysia
- **Authentication**: Better Auth (Email/Password + Magic Link)
- **Styling**: Tailwind CSS v4 + Base UI
- **Animation**: Motion (Framer)
- **Email**: Resend

## Quick Start

### Prerequisites

- Bun 1.0+
- PostgreSQL 16

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/keiyaku.git
cd keiyaku

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# - DATABASE_URL
# - BETTER_AUTH_SECRET
# - RESEND_API_KEY (optional)

# Run database migrations
bun run db:migrate

# Start development server
bun run dev
```

The app will be available at `http://localhost:3000`

## Development

```bash
# Start dev server
bun run dev

# Run tests
bun run test

# Lint and format
bun run check

# Database operations
bun run db:generate   # Generate migrations
bun run db:migrate    # Run migrations
bun run db:push       # Push schema (dev only)
bun run db:studio     # Open Drizzle Studio
```

## Documentation

See the `docs/` directory for detailed documentation:

- [Project Specification](docs/pause-specification.md) — Complete feature specification

## License

MIT License

---

*Keiyaku — Take time for what matters*
