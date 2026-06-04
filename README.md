# Student Progress Tracking System

A workflow-based academic progress review system built with Next.js App Router,
TypeScript, Prisma, Auth.js v5, SQLite, Tailwind CSS, and shadcn/ui.

Students create and submit progress reports. Assigned supervisors review them,
provide feedback, request revisions, approve, or reject. Every important action
is recorded in an audit trail.

## Demo accounts

All demo accounts use the password `Demo123!`.

| Role | Email |
| --- | --- |
| Student | `student@example.com` |
| Supervisor | `supervisor@example.com` |
| Admin | `admin@example.com` |

An additional seeded student account is available at `student2@example.com`.

## Features

- Auth.js v5 credentials authentication with JWT sessions
- Role-based student, supervisor, and admin dashboards
- Draft creation and editing
- Submit, review, revision, resubmit, approve, reject, and archive workflow
- Centralized workflow transition and authorization enforcement
- Supervisor decision feedback and report comments
- Full report audit history
- Optional durable attachment links
- Status badges, metrics, empty states, and responsive shadcn/ui interface
- Idempotent demo seed data

## Workflow architecture

Workflow rules are intentionally kept out of page components:

- `src/lib/workflow-policy.ts` defines valid state transitions and role rules.
- `src/lib/report-workflow.ts` owns report mutations, authorization checks,
  comments, attachments, and audit entries.
- `src/app/actions.ts` validates form input, resolves the authenticated user,
  calls the workflow service, and revalidates affected pages.

Supported statuses:

`DRAFT` -> `SUBMITTED` -> `UNDER_REVIEW` -> `APPROVED` / `REJECTED`

When a supervisor requests a revision:

`UNDER_REVIEW` -> `REVISION_REQUESTED` -> `RESUBMITTED` -> `UNDER_REVIEW`

Administrators can archive approved or rejected reports.

## Local development

Requirements: Node.js 20+ and npm.

```bash
cp .env.example .env
npm install
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

Useful commands:

```bash
npm run lint
npm run test
npm run build
npm run check
npm run db:studio
```

## Persistence and Vercel deployment

The requested local implementation uses Prisma with SQLite:

- Local schema: `prisma/schema.prisma`
- Local database: `prisma/dev.db` (ignored by Git)
- Local migrations: `prisma/migrations`

SQLite files on Vercel's serverless filesystem are ephemeral and cannot safely
store workflow records across deployments or function instances. The deployed
demo therefore uses the equivalent production Prisma schema backed by managed
Postgres:

- Production schema: `prisma/schema.postgres.prisma`
- Local environment variables: `SQLITE_DATABASE_URL`, `AUTH_SECRET`
- Required production environment variables: `POSTGRES_URL`, `AUTH_SECRET`
- `vercel-build` generates the Postgres client, applies the schema, seeds demo
  accounts idempotently, and builds Next.js.

This preserves SQLite for local use while making the deployed demo durable.
For a longer-lived production system, replace build-time `prisma db push` with
reviewed Postgres migrations in a dedicated deployment step.

Attachment support is implemented as durable external links. A production
installation that needs binary uploads should add private object storage such as
Vercel Blob and retain attachment metadata in Prisma.

## Security notes

- No secrets are committed.
- Passwords are stored as bcrypt hashes.
- Report mutations re-check the authenticated user, role, ownership or
  assignment, and current report status on the server.
- The demo password is public by design and must not be reused in production.
