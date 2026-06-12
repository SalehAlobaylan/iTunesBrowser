# Platform Console — Comprehensive Refactoring Plan

> **Note (March 2026):** The old CRM module has been removed from the monorepo. All CRM references in this plan are outdated and no longer applicable.

**Version:** 1.0
**Created:** January 24, 2026  
**Project:** iTunesBrowser → Platform Console  
**Target:** Admin Dashboard for Wahb Platform + CRM Frontend

---

## 📋 Executive Summary

This document outlines a complete plan to refactor the current **iTunesBrowser** Next.js application into the **Platform Console** — an internal admin dashboard that:

1. **Operates the Wahb Platform** (content sources, ingestion monitoring, content status)
2. **Serves as CRM Frontend** (customers, contacts, deals, activities, notes, tags, reports)

The Platform Console will integrate with two backend services:
- **CMS Service (Go)** — Platform operations via `/admin/*` endpoints
- **CRM Service (Go)** — CRM workflows via `/admin/*` endpoints

---

## 🎯 Goals & Objectives

### Primary Goals (v1)
- [ ] Single admin login (SSO-like) for Platform + CRM
- [ ] Source management (CRUD) and ingestion triggers
- [ ] Content visibility with status, type, and artifact details
- [ ] Full CRM operations (customers, contacts, deals, activities, notes, tags, reports)
- [ ] Role-based access control (Admin, Manager, Agent)

### Non-Goals (v1)
- End-user/customer portal
- Advanced marketing automation
- Queue internals UI (BullMQ/Redis)
- Audit logging UI
- Multi-tenant SaaS billing

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Platform Console (Next.js)                  │
│                         Vercel Deployment                       │
├─────────────────────────────────────────────────────────────────┤
│  Auth Context │ Platform Module │ CRM Module │ Shared UI        │
└───────┬───────────────┬─────────────────┬───────────────────────┘
        │               │                 │
        │ JWT Bearer    │ HTTPS           │ HTTPS
        │               │                 │
        ▼               ▼                 ▼
┌───────────────┐  ┌────────────────┐  ┌────────────────┐
│  CMS Service  │  │  CMS Service   │  │  CRM Service   │
│   (Go/Gin)    │  │    /admin/*    │  │    /admin/*    │
│  JWT Issuer   │  │  Platform APIs │  │  CRM APIs      │
└───────────────┘  └────────────────┘  └────────────────┘
```

---

## 📁 Target Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (public)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/              # Protected routes
│   │   ├── layout.tsx            # Dashboard shell
│   │   ├── page.tsx              # Dashboard home/overview
│   │   ├── platform/             # Platform module
│   │   │   ├── sources/
│   │   │   │   ├── page.tsx      # Sources list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx  # Create source
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Source detail
│   │   │   └── content/
│   │   │       ├── page.tsx      # Content list
│   │   │       └── [id]/
│   │   │           └── page.tsx  # Content detail
│   │   └── crm/                  # CRM module
│   │       ├── customers/
│   │       │   ├── page.tsx      # Customers list
│   │       │   ├── new/
│   │       │   │   └── page.tsx  # Create customer
│   │       │   └── [id]/
│   │       │       └── page.tsx  # Customer detail (tabs)
│   │       ├── deals/
│   │       │   ├── page.tsx      # Deals pipeline/list
│   │       │   └── [id]/
│   │       │       └── page.tsx  # Deal detail
│   │       ├── activities/
│   │       │   └── page.tsx      # All activities
│   │       ├── my-tasks/
│   │       │   └── page.tsx      # Current user tasks
│   │       ├── tags/
│   │       │   └── page.tsx      # Tags management
│   │       └── reports/
│   │           └── overview/
│   │               └── page.tsx  # Reports dashboard
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
│
├── components/
│   ├── ui/                       # Shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   ├── badge.tsx
│   │   ├── skeleton.tsx
│   │   ├── pagination.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── sidebar.tsx           # Main navigation
│   │   ├── header.tsx            # Top bar with user menu
│   │   ├── breadcrumb.tsx
│   │   └── dashboard-shell.tsx   # Dashboard wrapper
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── auth-guard.tsx        # Route protection
│   │   └── user-menu.tsx
│   ├── platform/
│   │   ├── sources/
│   │   │   ├── sources-table.tsx
│   │   │   ├── source-form.tsx
│   │   │   ├── source-card.tsx
│   │   │   └── source-status-badge.tsx
│   │   └── content/
│   │       ├── content-table.tsx
│   │       ├── content-filters.tsx
│   │       ├── content-detail-card.tsx
│   │       └── content-status-badge.tsx
│   ├── crm/
│   │   ├── customers/
│   │   │   ├── customers-table.tsx
│   │   │   ├── customer-form.tsx
│   │   │   ├── customer-detail-tabs.tsx
│   │   │   └── customer-card.tsx
│   │   ├── contacts/
│   │   │   ├── contacts-list.tsx
│   │   │   └── contact-form.tsx
│   │   ├── deals/
│   │   │   ├── deals-pipeline.tsx
│   │   │   ├── deals-table.tsx
│   │   │   ├── deal-form.tsx
│   │   │   └── deal-stage-badge.tsx
│   │   ├── activities/
│   │   │   ├── activities-table.tsx
│   │   │   ├── activity-form.tsx
│   │   │   └── activity-type-icon.tsx
│   │   ├── notes/
│   │   │   ├── notes-list.tsx
│   │   │   └── note-form.tsx
│   │   ├── tags/
│   │   │   ├── tags-table.tsx
│   │   │   └── tag-form.tsx
│   │   └── reports/
│   │       ├── overview-cards.tsx
│   │       ├── deals-chart.tsx
│   │       └── activities-chart.tsx
│   └── shared/
│       ├── data-table.tsx        # Reusable table component
│       ├── search-input.tsx
│       ├── date-range-picker.tsx
│       ├── confirm-dialog.tsx
│       ├── empty-state.tsx
│       ├── loading-state.tsx
│       └── error-state.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts             # Base API client with auth
│   │   ├── cms/
│   │   │   ├── sources.ts        # Content sources API
│   │   │   ├── content.ts        # Content items API
│   │   │   └── auth.ts           # CMS auth (login)
│   │   └── crm/
│   │       ├── customers.ts
│   │       ├── contacts.ts
│   │       ├── deals.ts
│   │       ├── activities.ts
│   │       ├── notes.ts
│   │       ├── tags.ts
│   │       └── reports.ts
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-sources.ts
│   │   ├── use-content.ts
│   │   ├── use-customers.ts
│   │   ├── use-deals.ts
│   │   ├── use-activities.ts
│   │   └── use-pagination.ts
│   ├── stores/
│   │   ├── auth-store.ts         # Zustand auth state
│   │   └── ui-store.ts           # Sidebar state, theme
│   ├── utils/
│   │   ├── auth.ts               # JWT helpers
│   │   ├── format.ts             # Date, currency formatters
│   │   ├── validation.ts         # Form validation schemas
│   │   └── cn.ts                 # Class name utility
│   └── constants/
│       ├── routes.ts             # Route definitions
│       ├── api-endpoints.ts      # API endpoint constants
│       └── roles.ts              # RBAC constants
│
├── types/
│   ├── auth.ts                   # User, JWT types
│   ├── api.ts                    # API response types
│   ├── platform/
│   │   ├── source.ts
│   │   └── content.ts
│   └── crm/
│       ├── customer.ts
│       ├── contact.ts
│       ├── deal.ts
│       ├── activity.ts
│       ├── note.ts
│       └── tag.ts
│
├── middleware.ts                 # Auth middleware for routes
│
└── providers/
    ├── auth-provider.tsx
    ├── query-provider.tsx
    └── theme-provider.tsx
```

---

## 🔐 Authentication & Authorization

### Auth Flow (SSO-like)

```
┌─────────┐     POST /admin/login      ┌─────────────┐
│ Console │ ────────────────────────▶  │ CMS Service │
│  Login  │                            │ (JWT Issuer)│
└─────────┘     { email, password }    └─────────────┘
     │                                        │
     │         JWT Token (HS256)              │
     ◀────────────────────────────────────────┘
     │
     │  Store in localStorage
     │
     ▼
┌─────────────────────────────────────────────────────┐
│           All subsequent requests                    │
│   Authorization: Bearer <token>                      │
│                                                      │
│   CMS /admin/*  ─────▶ Validates JWT                │
│   CRM /admin/*  ─────▶ Validates JWT (verifier only)│
└─────────────────────────────────────────────────────┘
```

### JWT Token Structure
```typescript
interface JWTPayload {
  sub: string;        // user_id
  email: string;
  role: 'admin' | 'manager' | 'agent';
  exp: number;        // expiry timestamp
  iat: number;        // issued at
}
```

### Role-Based Access Control (RBAC)

| Role    | Platform Access | CRM Access |
|---------|-----------------|------------|
| Admin   | Full CRUD, trigger ingestion | Full access, manage pipelines |
| Manager | View sources, content | Manage team, deals, customers |
| Agent   | View content only | Own customers, deals, activities |

### Implementation Tasks
1. [ ] Create `AuthProvider` with JWT storage/refresh
2. [ ] Implement `useAuth` hook for auth state
3. [ ] Create login page with form validation
4. [ ] Implement `middleware.ts` for route protection
5. [ ] Create `AuthGuard` component for client-side protection
6. [ ] Handle 401/403 responses globally
7. [ ] Implement role-based UI rendering

---

## 📊 Phase 1: Foundation & Infrastructure (Week 1-2)

### 1.1 Project Cleanup & Setup

**Tasks:**
- [ ] Remove all iTunes/Podcast related code
  - Delete `src/pages/index.tsx` content
  - Delete `src/components/SearchBar.tsx`
  - Delete `src/dbService/supabase.ts`
  - Delete `src/server/server.ts`
- [ ] Migrate from Pages Router to App Router
- [ ] Update `package.json` with new dependencies
- [ ] Configure TypeScript for strict mode
- [ ] Setup ESLint + Prettier

**New Dependencies:**
```json
{
  "dependencies": {
    "@hookform/resolvers": "^3.x",
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-dropdown-menu": "^2.x",
    "@radix-ui/react-label": "^2.x",
    "@radix-ui/react-select": "^2.x",
    "@radix-ui/react-tabs": "^1.x",
    "@radix-ui/react-toast": "^1.x",
    "@tanstack/react-query": "^5.x",
    "@tanstack/react-table": "^8.x",
    "axios": "^1.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "date-fns": "^3.x",
    "lucide-react": "^0.x",
    "next": "^14.x",
    "react-hook-form": "^7.x",
    "recharts": "^2.x",
    "tailwind-merge": "^2.x",
    "zod": "^3.x",
    "zustand": "^4.x"
  }
}
```

### 1.2 Design System & UI Components

**Tasks:**
- [ ] Install and configure shadcn/ui
- [ ] Create base UI components:
  - Button, Input, Label, Select
  - Card, Dialog, Toast
  - Table, Pagination
  - Tabs, Badge, Skeleton
- [ ] Setup Tailwind theme (dark mode support)
- [ ] Create color palette for status badges
- [ ] Setup icon library (Lucide React)

### 1.3 API Client Infrastructure

**Base API Client (`lib/api/client.ts`):**
```typescript
interface ApiClient {
  get<T>(url: string, params?: object): Promise<T>;
  post<T>(url: string, data?: object): Promise<T>;
  put<T>(url: string, data?: object): Promise<T>;
  patch<T>(url: string, data?: object): Promise<T>;
  delete<T>(url: string): Promise<T>;
}

// Features:
// - Automatic JWT token injection
// - Request/response interceptors
// - Error handling (401 redirect, 403 toast)
// - Base URL configuration per service (CMS vs CRM)
```

### 1.4 Layout Components

**Tasks:**
- [ ] Create `DashboardShell` with responsive sidebar
- [ ] Implement collapsible `Sidebar` with navigation
- [ ] Create `Header` with user menu and breadcrumbs
- [ ] Setup navigation structure:

```typescript
const navigation = [
  {
    title: 'Platform',
    items: [
      { name: 'Sources', href: '/platform/sources', icon: Database },
      { name: 'Content', href: '/platform/content', icon: FileText },
    ],
  },
  {
    title: 'CRM',
    items: [
      { name: 'Customers', href: '/crm/customers', icon: Users },
      { name: 'Deals', href: '/crm/deals', icon: TrendingUp },
      { name: 'Activities', href: '/crm/activities', icon: Calendar },
      { name: 'My Tasks', href: '/crm/my-tasks', icon: CheckSquare },
      { name: 'Tags', href: '/crm/tags', icon: Tag },
      { name: 'Reports', href: '/crm/reports/overview', icon: BarChart },
    ],
  },
];
```

---

## 📊 Phase 2: Authentication Module (Week 2-3)

### 2.1 Auth Store (Zustand)

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}
```

### 2.2 Auth Pages & Components

**Tasks:**
- [ ] Create `/login` page with form
- [ ] Implement form validation with Zod
- [ ] Create `AuthProvider` for context
- [ ] Implement `middleware.ts` for route protection
- [ ] Handle token expiration and refresh
- [ ] Create user dropdown menu with logout

### 2.3 API Integration

**CMS Auth Endpoints:**
```typescript
// POST /admin/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// GET /admin/me
interface MeResponse {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}
```

---

## 📊 Phase 3: Platform Module (Week 3-4)

### 3.1 Content Sources Management

**Routes:**
- `/platform/sources` — List all sources
- `/platform/sources/new` — Create new source
- `/platform/sources/[id]` — Source detail & edit

**Features:**
- [ ] Sources data table with pagination
- [ ] Filter by active/disabled status
- [ ] Search by name
- [ ] Create/edit source form
- [ ] Enable/disable toggle
- [ ] "Run Now" button to trigger ingestion
- [ ] Last fetched timestamp display

**Data Model:**
```typescript
interface ContentSource {
  id: string;
  name: string;
  type: 'RSS' | 'PODCAST' | 'YOUTUBE' | 'TWITTER' | 'REDDIT' | 'MANUAL';
  feed_url?: string;
  api_config?: Record<string, any>;
  is_active: boolean;
  fetch_interval_minutes: number;
  last_fetched_at?: string;
  created_at: string;
  updated_at: string;
}
```

**API Endpoints:**
```
GET    /admin/sources              List sources (pagination, filters)
POST   /admin/sources              Create source
GET    /admin/sources/:id          Get source detail
PUT    /admin/sources/:id          Update source
DELETE /admin/sources/:id          Delete source
POST   /admin/sources/:id/run      Trigger ingestion
```

### 3.2 Content Items Management

**Routes:**
- `/platform/content` — List all content
- `/platform/content/[id]` — Content detail

**Features:**
- [ ] Content data table with pagination
- [ ] Filter by status (PENDING, PROCESSING, READY, FAILED, ARCHIVED)
- [ ] Filter by type (ARTICLE, VIDEO, TWEET, COMMENT, PODCAST)
- [ ] Filter by source
- [ ] Filter by date range
- [ ] Search by title
- [ ] Content detail view with:
  - Media preview
  - Transcript snippet
  - Metadata display
  - Engagement counts
  - Artifact URLs

**Data Model:**
```typescript
interface ContentItem {
  id: string;
  type: 'ARTICLE' | 'VIDEO' | 'TWEET' | 'COMMENT' | 'PODCAST';
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | 'ARCHIVED';
  title: string;
  body_text?: string;
  excerpt?: string;
  author?: string;
  source_name?: string;
  media_url?: string;
  thumbnail_url?: string;
  original_url?: string;
  duration_sec?: number;
  topic_tags?: string[];
  published_at?: string;
  created_at: string;
  updated_at: string;
  // Engagement
  like_count: number;
  view_count: number;
  share_count: number;
}
```

**API Endpoints:**
```
GET    /admin/content              List content (pagination, filters)
GET    /admin/content/:id          Get content detail
PATCH  /admin/content/:id/status   Update status (archive)
```

---

## 📊 Phase 4: CRM Module (Week 4-6)

### 4.1 Customers Management

**Routes:**
- `/crm/customers` — Customers list
- `/crm/customers/new` — Create customer
- `/crm/customers/[id]` — Customer detail (tabbed)

**Features:**
- [ ] Customers data table with pagination
- [ ] Filter by status, owner
- [ ] Search by name, email, phone
- [ ] Create/edit customer form
- [ ] Soft delete with confirmation
- [ ] Customer detail tabs:
  - Overview (summary, info)
  - Contacts (nested list)
  - Deals (associated deals)
  - Activities (timeline)
  - Notes (notes list)
  - Attachments (optional v1)

**Data Model:**
```typescript
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: 'active' | 'inactive' | 'lead';
  owner_id?: string;
  assigned_to?: string;
  contact_preferences?: Record<string, any>;
  follow_up_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
```

**API Endpoints:**
```
GET    /admin/customers            List customers
POST   /admin/customers            Create customer
GET    /admin/customers/:id        Get customer detail
PUT    /admin/customers/:id        Update customer
DELETE /admin/customers/:id        Soft delete customer
```

### 4.2 Contacts Management

**Features:**
- [ ] Contacts list within customer detail
- [ ] Create/edit contact modal
- [ ] Set primary contact designation
- [ ] Delete contact with confirmation

**Data Model:**
```typescript
interface Contact {
  id: string;
  customer_id: string;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}
```

**API Endpoints:**
```
GET    /admin/customers/:id/contacts     List contacts
POST   /admin/customers/:id/contacts     Create contact
PUT    /admin/contacts/:id               Update contact
DELETE /admin/contacts/:id               Delete contact
PATCH  /admin/contacts/:id/primary       Set as primary
```

### 4.3 Deals Pipeline

**Routes:**
- `/crm/deals` — Deals list/pipeline view
- `/crm/deals/[id]` — Deal detail

**Features:**
- [ ] Deals Kanban/pipeline view (by stage)
- [ ] Deals table view (alternative)
- [ ] Filter by stage, owner, date
- [ ] Create/edit deal form
- [ ] Stage transition (drag & drop or dropdown)
- [ ] Deal detail with:
  - Customer link
  - Activities timeline
  - Notes

**Data Model:**
```typescript
interface Deal {
  id: string;
  name: string;
  customer_id: string;
  customer?: Customer;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  amount?: number;
  currency: string;
  probability?: number;
  expected_close_date?: string;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

const DEAL_STAGES = [
  { id: 'lead', label: 'Lead', color: 'gray' },
  { id: 'qualified', label: 'Qualified', color: 'blue' },
  { id: 'proposal', label: 'Proposal', color: 'yellow' },
  { id: 'negotiation', label: 'Negotiation', color: 'orange' },
  { id: 'won', label: 'Won', color: 'green' },
  { id: 'lost', label: 'Lost', color: 'red' },
];
```

**API Endpoints:**
```
GET    /admin/deals                List deals
POST   /admin/deals                Create deal
GET    /admin/deals/:id            Get deal detail
PUT    /admin/deals/:id            Update deal
DELETE /admin/deals/:id            Delete deal
PATCH  /admin/deals/:id/stage      Update stage
```

### 4.4 Activities & Tasks

**Routes:**
- `/crm/activities` — All activities
- `/crm/my-tasks` — Current user's activities

**Features:**
- [ ] Activities table with filters
- [ ] Filter by type (call, email, meeting, task)
- [ ] Filter by status (scheduled, completed, overdue)
- [ ] Filter by date range
- [ ] Create/edit activity form
- [ ] Mark as complete
- [ ] Due date highlighting

**Data Model:**
```typescript
interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  subject: string;
  description?: string;
  customer_id?: string;
  deal_id?: string;
  owner_id: string;
  due_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
```

**API Endpoints:**
```
GET    /admin/activities           List all activities
GET    /admin/me/activities        List my activities
POST   /admin/activities           Create activity
PUT    /admin/activities/:id       Update activity
DELETE /admin/activities/:id       Delete activity
PATCH  /admin/activities/:id/complete   Mark complete
```

### 4.5 Notes

**Features:**
- [ ] Notes list within customer/deal detail
- [ ] Create note with rich text (optional)
- [ ] Delete note with confirmation

**Data Model:**
```typescript
interface Note {
  id: string;
  content: string;
  customer_id?: string;
  deal_id?: string;
  author_id: string;
  author?: { name: string };
  created_at: string;
  updated_at: string;
}
```

**API Endpoints:**
```
GET    /admin/customers/:id/notes  List customer notes
GET    /admin/deals/:id/notes      List deal notes
POST   /admin/notes                Create note
DELETE /admin/notes/:id            Delete note
```

### 4.6 Tags Management

**Routes:**
- `/crm/tags` — Tags list

**Features:**
- [ ] Tags table with CRUD
- [ ] Color picker for tags
- [ ] Assign tags to customers (from customer detail)
- [ ] Tag usage count display

**Data Model:**
```typescript
interface Tag {
  id: string;
  name: string;
  color: string;
  customer_count?: number;
  created_at: string;
}
```

**API Endpoints:**
```
GET    /admin/tags                 List tags
POST   /admin/tags                 Create tag
PUT    /admin/tags/:id             Update tag
DELETE /admin/tags/:id             Delete tag
POST   /admin/customers/:id/tags   Assign tags
DELETE /admin/customers/:id/tags/:tagId  Remove tag
```

### 4.7 Reports & Overview

**Routes:**
- `/crm/reports/overview` — Reports dashboard

**Features:**
- [ ] Key metrics cards:
  - Total customers
  - Active deals
  - Pipeline value
  - Activities this week
- [ ] Deals by stage chart (bar/pie)
- [ ] Activities over time chart (line)
- [ ] Top performers table (optional)

**API Endpoints:**
```
GET    /admin/reports/overview     Get overview metrics
```

---

## 📊 Phase 5: Polish & Integration (Week 6-7)

### 5.1 Error Handling & UX

**Tasks:**
- [ ] Global error boundary
- [ ] Toast notifications for actions
- [ ] Loading states and skeletons
- [ ] Empty states with CTAs
- [ ] Form validation error display
- [ ] Confirmation dialogs for destructive actions

### 5.2 Responsive Design

**Tasks:**
- [ ] Mobile-friendly sidebar (collapsible)
- [ ] Responsive tables (scroll/card view)
- [ ] Touch-friendly interactions
- [ ] Test on various screen sizes

### 5.3 Performance Optimization

**Tasks:**
- [ ] Implement React Query caching
- [ ] Optimize bundle size (dynamic imports)
- [ ] Lazy load routes
- [ ] Image optimization
- [ ] Debounce search inputs

### 5.4 Testing

**Tasks:**
- [ ] Unit tests for utilities
- [ ] Component tests with React Testing Library
- [ ] Integration tests for API hooks
- [ ] E2E tests for critical flows (login, CRUD)

---

## 📊 Phase 6: Deployment & Documentation (Week 7-8)

### 6.1 Environment Configuration

**Environment Variables:**
```env
# API URLs
NEXT_PUBLIC_CMS_BASE_URL=https://cms.wahb.com
NEXT_PUBLIC_CRM_BASE_URL=https://crm.wahb.com

# App
NEXT_PUBLIC_APP_ENV=production

# Optional
NEXT_PUBLIC_ENABLE_MOCK=false
```

### 6.2 Deployment Setup

**Tasks:**
- [ ] Configure Vercel project
- [ ] Setup environment variables
- [ ] Configure CORS on CMS/CRM services
- [ ] Setup staging environment
- [ ] Configure domain/SSL

### 6.3 Documentation

**Tasks:**
- [ ] Update README.md
- [ ] API integration guide
- [ ] Component documentation
- [ ] Deployment guide
- [ ] User guide for admins

---

## 📅 Implementation Timeline

| Phase | Description | Duration | Target |
|-------|-------------|----------|--------|
| 1 | Foundation & Infrastructure | 1.5 weeks | Week 1-2 |
| 2 | Authentication Module | 1 week | Week 2-3 |
| 3 | Platform Module | 1.5 weeks | Week 3-4 |
| 4 | CRM Module | 2 weeks | Week 4-6 |
| 5 | Polish & Integration | 1 week | Week 6-7 |
| 6 | Deployment & Documentation | 1 week | Week 7-8 |

**Total Estimated Duration: 8 weeks**

---

## ✅ Acceptance Criteria (v1)

### Authentication
- [ ] Admin can login with email/password
- [ ] Same token works for both CMS and CRM APIs
- [ ] Unauthorized users redirected to login
- [ ] Token expiration handled gracefully
- [ ] Logout clears token and redirects

### Platform Module
- [ ] Sources CRUD functional
- [ ] "Run Now" triggers ingestion
- [ ] Content list filterable by status/type
- [ ] Content detail shows artifacts and metadata

### CRM Module
- [ ] Customers CRUD with pagination/filtering
- [ ] Contacts nested under customers
- [ ] Deals pipeline with stage transitions
- [ ] Activities CRUD with "My Tasks" view
- [ ] Tags CRUD with customer assignment
- [ ] Reports overview displays key metrics

### Security
- [ ] JWT verified on every API call
- [ ] 401 clears token and redirects to login
- [ ] 403 shows permission denied message
- [ ] RBAC enforced based on user role

### UX
- [ ] Responsive on desktop and tablet
- [ ] Loading states for all async operations
- [ ] Error states with retry options
- [ ] Toast notifications for actions

---

## 🚧 Known Gaps / Future Work

### CRM Service (Backend)
- Notes CRUD endpoints (partially implemented)
- Audit read endpoint (not implemented)
- Attachments/File upload (not started)

### Console (Frontend)
- Audit logs viewer
- File attachments UI
- Advanced search/filters
- Bulk actions
- Export functionality
- Real-time updates (WebSocket)
- Optional BFF for token security

---

## 📚 References

- [Platform Console Requirements](./context/Platform_Console_Context_Requirements.md)
- [CRM Service Requirements](./context/CRM_Context_Requirements.md)
- [CMS Context Requirements](./context/CMS_Context_Requirements.md)
- [Wahb Platform Context](./context/Wahb_Platform_Context_Requirements%20.md)
- [Wahb Overall Context](./context/Wahb_Overall_Project_Context_Requirements.md)
- [PRD](./context/PRD.md)

---

## 🛠️ Quick Start Commands

```bash
# Install dependencies (after package.json update)
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

---

**Document Status:** Ready for Review  
**Next Steps:** Approve plan → Begin Phase 1 implementation
