# Platform Console Design System

Platform Console is an operational administration product. Its visual source of
truth is the existing dashboard—not the public Wahb client. New Console work
must feel native beside these three reference surfaces:

- **Content** — monitoring hierarchy, KPI density, responsive analytical grids,
  refresh/error behavior, and domain drill-down cards.
- **Media Library** — management hierarchy, configuration cards, filter bars,
  gallery/table views, selection, pagination, and confirmation dialogs.
- **Media Circulation** — operational cockpit hierarchy, scoped domain accent,
  decision queue, selected-item inspector, URL-backed state, and responsive
  sheets.

When this document and a generic design convention disagree, follow these
reference pages and the shared primitives they use.

## 1. Product character

- Calm, compact, operational, and information-forward.
- Built from familiar dashboard patterns rather than consumer-app, editorial,
  cinematic, or chat-product styling.
- Strong hierarchy without excessive decoration: page header, summary, controls,
  cards, rows, inspector, and supporting details.
- Dense information remains readable through grouping, labels, whitespace,
  tabular numbers, muted text, and progressive disclosure.
- Color communicates domain or state; it does not repaint the whole application.

## 2. Foundations

Use the tokens in `src/app/globals.css` and primitives in `src/components/ui/`.
Do not duplicate them as page-local hex values.

| Role | Required Console pattern |
| --- | --- |
| Canvas | `bg-background text-foreground` from `DashboardShell` |
| Primary surface | `Card`, `bg-card`, `border-border`, `rounded-lg` or `rounded-xl` |
| Quiet surface | `bg-muted`, `bg-muted/40`, `bg-background` inside a card |
| Primary action | Default `Button`; use a scoped domain accent only when the reference domain already does |
| Secondary action | `Button variant="outline"` |
| Tertiary action | `Button variant="ghost"` or a `DropdownMenu` item |
| Destructive action | `Button variant="destructive"` inside an explicit confirmation flow |
| Status | `Badge` with semantic variant plus readable text |
| Focus | Existing `ring-ring` behavior from shared controls |
| Typography | Inter and the existing dashboard type utilities |
| Numeric data | `tabular-nums`; `font-mono` only for IDs, hashes, and code-like values |

### Domain accents

The dashboard has restrained, scoped accent use:

- `gold` identifies Pods/Media Library controls and small highlights.
- `news` identifies Media Circulation decisions and News surfaces.
- `info`, `success`, `warning`, and `destructive` communicate operational state.

An accent may appear in an overline, icon, 2px rail, active tab underline,
selected row tint, compact chart, or primary domain action. It must not replace
the standard background, text, card, border, input, or focus tokens.

Media Circulation's dark cockpit hero is an intentional exception for the
top-level operational summary. It remains one contained `rounded-xl` surface;
the queue, inspector, forms, and sheets return to standard Console cards.

Never import the public client’s Newsprint & Red identity, consumer typography,
full-page paper treatment, red evidence spines, or consumer navigation patterns
into Platform Console.

## 3. Dashboard shell and page frame

- Preserve `DashboardShell`: desktop sidebar, 56px header, scrollable page,
  `p-4 sm:p-6 lg:p-8`, and `max-w-7xl` content frame.
- Do not use negative margins, fixed full-viewport canvases, or a second app
  shell inside a page.
- Use `space-y-6` for monitoring and management pages. A dense cockpit may use
  `space-y-4`, as Media Circulation does.
- Typical page headers use:
  - `flex items-start justify-between gap-4`;
  - `text-3xl font-bold tracking-tight` for broad monitoring pages;
  - `text-2xl font-semibold` for focused management pages;
  - one short `text-sm` or `text-muted-foreground` description;
  - page actions aligned to the end and allowed to wrap on narrow screens.
- Avoid a large marketing hero. A cockpit hero is allowed only when it contains
  live status, metrics, controls, and filtering—not decorative copy.

## 4. Reference archetypes

### A. Content monitoring pattern

Use this pattern when the page answers “What is happening across the system?”

1. Header with title, concise scope, last-updated state, and an icon refresh
   button.
2. Responsive KPI band:
   `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`, `gap-3`.
3. KPI cards use `CardContent p-4`, a `text-2xl font-semibold tabular-nums`
   value, `text-xs text-muted-foreground` label, and a 16px semantic icon.
4. Primary analysis uses `lg:grid-cols-[2fr_1fr]` with `gap-5`.
5. Parallel domains use `xl:grid-cols-2`; each card may have a 2px scoped
   accent rail, overline, small sparkline, and `Manage` outline button.
6. Internal card sections use `border-t pt-4`, `space-y-2.5`, and an uppercase
   `text-xs` muted section label.
7. Initial loading uses geometry-matched `Skeleton` blocks. A failed top-level
   read becomes a centered card with a semantic icon, plain explanation, and
   `Retry` outline button.

Do not turn monitoring data into chat bubbles, oversized banners, or a long
unstructured column.

### B. Media Library management pattern

Use this pattern when administrators browse, filter, select, and mutate records.

1. Focused header with optional domain overline, `text-2xl font-semibold` title,
   one-sentence `text-sm text-muted-foreground` description, and an outline link
   to an adjacent workflow.
2. Configuration is a normal `Card`: `CardHeader` for title/description/status,
   `CardContent` for fields, checkboxes, metrics, and a single save action.
3. Use compact mode toggles before the collection. Active domain modes may use
   the domain accent; inactive modes use outline buttons.
4. Filter toolbar:
   - `flex flex-wrap items-center gap-2`;
   - search is `min-w-[200px] flex-1` with a 16px leading icon;
   - selects use explicit stable widths around 140–180px;
   - view/group controls are compact and keep accessible labels;
   - active filters remain visible and removable.
5. Gallery uses `grid-cols-2 md:grid-cols-3 xl:grid-cols-4`, `gap-3`. Table view
   uses shared table primitives and stable column widths.
6. Selection produces a bounded bulk-action bar. Row and card overflow actions
   live in `DropdownMenu`; destructive actions are not permanently prominent.
7. Empty collections explain what the current filters produced. Loading holds
   the collection geometry. Pagination sits at the end with Previous, page
   status, and Next.
8. Mutations with cost, replacement, or deletion consequences use `Dialog` with
   a specific title, consequence description, Cancel, and the accurately named
   action. Destructive confirmation uses the destructive variant.

### C. Media Circulation cockpit pattern

Use this pattern when the page combines health, recommendation triage, and a
detailed proof inspector.

1. A contained cockpit hero may summarize identity, health badge, generated
   time, primary operational control, action menu, four compact vitals, and a
   small interactive visualization. Keep padding at `p-5 md:p-6` and internal
   gaps at 3–6.
2. Supporting proof/status panels are standard Console surfaces and follow the
   hero in priority order.
3. Main work area uses
   `xl:grid-cols-[minmax(0,1fr)_360px]`, `items-start`, and `gap-4`.
4. The primary queue is one `rounded-xl border bg-card`:
   - horizontally scrollable tab rail;
   - counts in compact badges;
   - active tab shown by text emphasis and a 2px domain underline;
   - search and contextual filters in a bordered `p-3` toolbar;
   - rows separated by `divide-y divide-border`;
   - selected row uses a light domain tint and a narrow lane rule;
   - row title is `text-sm font-medium`, proof is `text-xs muted`, and numeric
     priority is tabular.
5. Desktop inspector is `hidden xl:block`, sticky at `top-6`, and exactly 360px
   through the parent grid. It uses a standard bordered card and groups proof,
   score factors, evidence, and actions into sections.
6. Narrow screens open proof in a bottom `Sheet` with `max-h-[86vh]` and
   scrolling. Configuration opens in a right `Sheet`, full width on mobile and
   `sm:max-w-xl` on larger screens.
7. Selection, tab, query, filter, inspector, policy, and trace state should be
   URL-backed when users need refresh-safe or shareable operational context.
8. Skeletons match the hero and work-area geometry: a large rounded hero plus
   queue and desktop inspector blocks.

## 5. Shared component and sizing rules

- Use shared `Card`, `Button`, `Badge`, `Input`, `Select`, `Tabs`, `Sheet`,
  `Dialog`, `DropdownMenu`, `Skeleton`, `Checkbox`, `Switch`, and table
  primitives before creating custom equivalents.
- Standard control heights:
  - small buttons and dense rows: `h-8` or shared `size="sm"` (`h-9`);
  - normal inputs/buttons/selects: `h-10`;
  - large buttons: `h-11` only when genuinely prominent;
  - icon buttons: shared icon size, normally 40px; compact cockpit rows may use
    an explicit 32px control.
- Standard icon sizes:
  - 12–14px in badges, overlines, or dense row actions;
  - 16px in buttons, filters, and KPI cards;
  - 20–28px only in an empty/error state or page identity.
- Cards normally use shared `rounded-lg` and `shadow-sm`. Cockpit and large
  operational panels may use `rounded-xl`. Avoid larger radii.
- Card padding follows the primitives (`p-6`) unless density requires the
  established compact forms: `p-3`, `p-4`, or `p-5`.
- Use `gap-2` for related controls, `gap-3` for compact cards/rows, `gap-4` for
  primary layout, `gap-5` for analytic panels, and `space-y-6` for page sections.
- Titles and values truncate before they break layout. Long explanatory text
  wraps. IDs, hashes, URLs, and timestamps use `bdi`, `dir="ltr"`, and
  `font-mono` where appropriate.

## 6. State and action hierarchy

- A region has one visually primary action. Put less-common actions in an
  overflow menu or use outline/ghost treatment.
- Color always has a text or icon label. Use semantic badge variants for
  success, warning, failure, info, and neutral states.
- Use a small pulse/spinner only for the live action being refreshed. Preserve
  previously loaded data during background refresh and label it as refreshing.
- Disabled controls explain the governing state nearby; they do not disappear
  when discovery is valuable.
- Empty states use a muted icon, `text-base font-semibold` title, short muted
  explanation, and at most one recovery action.
- Error states identify the failed read or action and provide Retry when safe.
- Confirmation copy names the exact object count and consequence. Never label a
  destructive or costly action merely “Confirm.”

## 7. Operator application

Operator must combine the three reference archetypes rather than create a new
visual language:

- Use the **Media Library header and toolbar pattern** for case search, case
  filters, locale, and New case.
- Use the **Media Circulation queue + 360px inspector pattern** for conversation
  history, active tasks, evidence, governance, and plan proof.
- Use the **Content KPI/status pattern** for compact task totals, lifecycle
  health, spend state, and control availability when summary metrics add value.
- Render questions and answers as compact `Card` sections or divided rows. Do
  not use oversized consumer chat bubbles, editorial typography, colored page
  backgrounds, or a separate full-screen shell.
- The active investigation is a standard lifecycle card with status badge,
  progress/events, cancellation when eligible, and a clear terminal outcome.
- CMS-derived eligible actions are queue/card rows with localized label, risk
  badge, target summary, and `Review plan` button. The raw tool key belongs in
  advanced details only.
- Plan review follows the Media Circulation inspector/sheet pattern and shows
  target, evidence freshness, expected effects, rollback, contingency,
  confirmation, execution state, and verified effects.
- Evidence citations open or focus the inspector. Technical evidence metadata
  is grouped like the Media Circulation evidence definition list.
- Desktop uses `xl:grid-cols-[minmax(0,1fr)_360px]`; below `xl`, the inspector is
  a standard bottom sheet. Case navigation may be a compact card/column on wide
  screens and a standard sheet on narrow screens.
- Governance remains discoverable in inspector tabs and must never be covered
  by a floating launcher.

## 8. Responsive, RTL, and accessibility requirements

- Begin with one column. Add analytical columns only at the same breakpoints as
  the references (`md`, `lg`, `xl`).
- At 320px, toolbars wrap and selects may become full width; no horizontal page
  overflow is allowed. Only tab rails and tables may scroll intentionally.
- Use shared `Sheet`/`Dialog` focus trapping and close behavior. Sheets close by
  Escape, close control, or backdrop.
- Every icon-only control has an accessible name. Hover-only row actions must
  also be reachable through keyboard focus or an overflow menu.
- Preserve visible shared focus rings and respect reduced motion.
- English and Arabic use identical information hierarchy and capabilities.
  Prefer logical properties and `text-left` only where a shared primitive
  requires it.
- Apply `dir="auto"` to user/model/evidence prose. Isolate IDs, hashes, URLs,
  metrics, and timestamps with `bdi` or explicit LTR direction.

## 9. Definition of done

A Platform Console screen is complete only when:

- it visually belongs beside Content, Media Library, and Media Circulation;
- it stays inside `DashboardShell` and uses the shared primitive library;
- domain accents are scoped and semantic rather than page-wide decoration;
- its loading, refreshing, empty, error, disabled, success, and stale states are
  designed—not incidental;
- primary, secondary, overflow, confirmation, and destructive actions have a
  clear hierarchy;
- desktop, tablet, mobile, keyboard, reduced-motion, English, and Arabic states
  preserve the same operational capability;
- it has no unintended horizontal overflow at 320px, 768px, 1024px, or 1440px.
