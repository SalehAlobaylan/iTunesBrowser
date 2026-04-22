![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)

# Platform Console

Admin dashboard for the Wahb platform. Manages content sources, ingested content, and the ranking algorithm.

**Production:** https://wahb-console.salehspace.dev

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI:** shadcn/ui + TailwindCSS
- **State / Data fetching:** Zustand + TanStack Query (React Query)
- **Charts:** Recharts 2.13

## Quick Start

```bash
npm install
npm run dev
```

Runs on `http://localhost:3005`

## Environment Variables

```env
NEXT_PUBLIC_CMS_URL=http://localhost:8080
NEXT_PUBLIC_AGGREGATION_URL=http://localhost:5002
```

## Dev Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server on :3005 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm run test` | Jest unit tests |

## Navigation

| Section | Route | Description |
|---------|-------|-------------|
| Dashboard | `/` | Overview cards |
| Sources | `/platform/sources` | Manage RSS/YouTube/X/Telegram sources |
| Content | `/platform/content` | Browse and moderate ingested content items |
| **Intelligence** | `/platform/intelligence` | Ranking engine, content flags, analytics |
| Users | `/admin/users` | Admin user management |

---

## Intelligence Tab

The Intelligence tab gives full control over how content is ranked and distributed across feeds.

### Pages

#### Dashboard — `/platform/intelligence`

Overview of the ranking system:
- **Algorithm Status** card — Active / Inactive, toggle lives in Ranking Config
- **Embedding Coverage** — % of READY items with embeddings
- **Flagged Items** — count of active editorial overrides
- **Currently Trending** — count of items above the spike threshold
- **Signal Health Radar** — coverage % for all 7 signals (Recharts RadarChart)
- **Score Distribution** — histogram of ranking scores across all READY content (BarChart)

#### Ranking Config — `/platform/intelligence/ranking`

Configure and activate the 7-signal ranking engine:

| Section | Controls |
|---------|----------|
| Algorithm Flow | Visual diagram: Signals → Weighted Sum → Flags → Diversity → Final Feed |
| Weight Radar Chart | Live preview of the 7 weights as a radar polygon |
| Weight Sliders | Per-signal sliders that **auto-normalize** to 1.0 as you drag |
| Decay Settings | Freshness decay hours, velocity window hours, trending threshold multiplier |
| Recirculation | Toggle + max age (days) for re-surfacing older content |
| Activate / Deactivate | Master switch — feeds are chronological when inactive |

> Weights are validated server-side (must sum to 1.0 ± 0.01). The sliders auto-normalize on the client so you never need to do mental arithmetic.

#### Content Flags — `/platform/intelligence/flags`

Per-item editorial overrides stored in a separate `content_flags` table:

| Flag | Effect |
|------|--------|
| Boost | Multiply final score by `boost_multiplier` (default ×1.5) |
| Suppress | Reduce score to near zero (item still in DB, just buried) |
| Pin to Top | Force item to position 0 regardless of score |
| Exclude from Feed | Remove item from all ranked feeds entirely |

- Search flags by content title
- Flag distribution pie chart (breakdown by flag type)
- Add/edit/remove flags inline with a notes field and `set_by` attribution

#### Analytics — `/platform/intelligence/analytics`

Four sub-sections of charts:

| Chart | Type | What it shows |
|-------|------|---------------|
| Source Performance | Grouped BarChart | Avg likes / views / shares per source |
| Velocity Leaderboard | Horizontal BarChart | Top 10 items by interaction rate (rolling window) |
| Trending Items | Grouped BarChart | Recent rate vs. average rate for trending items |
| Topic Clusters | ScatterChart (bubble) | Topics plotted by avg engagement, sized by item count |

Plus an **Embedding Coverage** stats panel and a **Similar Content** lookup (enter a content ID to fetch pgvector cosine neighbors).

#### Feed Preview — `/platform/intelligence/preview`

Test the ranking engine without touching production:

- Toggle between **For You** and **News** previews
- Override individual signal weights inline (temporary — not saved)
- **Ranked feed list** — each item shows its total score + signal breakdown tooltip
- **Score Waterfall** stacked bar chart — visualizes how each signal contributes to each item's score
- Position change arrows (↑ / ↓ / —) vs. chronological order
- **Apply to Production** button — saves the weight overrides to the active `RankingConfig`

---

## Data Flow

```
Platform Console
      │
      ▼
CMS Admin API (/admin/intelligence/*)
      │
      ├── RankingConfig (per-tenant, PostgreSQL)
      ├── ContentFlags (per-item, separate table)
      └── Analytics queries (pgvector, user_interactions)
```

Auth: JWT issued by CMS on `/admin/login`, stored in Zustand, attached as `Authorization: Bearer <token>` on every request via `cmsClient`.
