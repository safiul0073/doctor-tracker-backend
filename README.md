# Doctor Tracker — Backend REST API

Standalone Node.js, Express, TypeScript, and MongoDB REST API powering the Doctor Tracker clinical administrative portal.

## Features

- **JWT Authentication & RBAC**: `bcryptjs` password hashing, signed Bearer/cookie JWTs, and `requireAuth` + `requireAdmin` route guards.
- **Doctors & Patients CRUD**: Indexed server-side search, multi-criteria filtering, date-range queries, and pagination.
- **Aggregated Analytics**: Parallel MongoDB `$facet` pipelines for KPIs, patients-per-doctor rankings, daily intake time-series, condition breakdowns, and departmental coverage.
- **Validation & Security**: Zod request validation (`body`, `query`, `params`), Helmet security headers, CORS allowlist, compression, and rate limiting.

## Local Setup

```bash
cp .env.example .env
npm install
npm run dev
```

API listens on `http://localhost:5001/api/v1` (health check: `GET /api/v1/health`).

## Testing & Build

```bash
npm run typecheck
npm test
npm run build
npm start
```
