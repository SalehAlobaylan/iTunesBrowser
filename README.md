# Platform Console

Admin dashboard for Wahb platform operations and CRM workflows.

## Stack

- Next.js 15
- React 19
- TypeScript
- TanStack Query
- Radix UI + Tailwind

## Quick Start

```bash
npm install
npm run dev
```

Default local URL: `http://localhost:3005`

## Required Environment Variables

```bash
NEXT_PUBLIC_CMS_BASE_URL=http://localhost:8080
NEXT_PUBLIC_CRM_BASE_URL=http://localhost:4000
NEXT_PUBLIC_IAM_BASE_URL=http://localhost:4003
```

Optional:

```bash
NEXT_PUBLIC_AGGREGATION_BASE_URL=http://localhost:5002
NEXT_PUBLIC_GRAFANA_URL=http://localhost:3002
```

## Implemented Platform Features

### Source Management

- Content source CRUD
- Run-now trigger
- Feed discovery from website URL
- Source preview (fetch + normalize, no write)
- OPML bulk import
- Source-level filters
- WEBSITE source type with selector configuration
- Moderation v1 source settings

### Content Management

- Content list with status/type filters
- Content detail view
- Archive action
- Moderation actions for pending items:
  - Approve -> `READY`
  - Reject -> `ARCHIVED`

### Dashboard

- Wired platform + CRM stats cards
- Aggregation monitoring panel (queues, health, manual trigger)

## API Dependencies

- CMS admin API (`/admin/*`) for platform data and operations
- CRM admin API (`/admin/*`) for CRM data
- Aggregation admin/health endpoints (optional, for monitoring panel)
