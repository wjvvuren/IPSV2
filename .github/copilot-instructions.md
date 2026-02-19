# Copilot Instructions

**Before doing anything, you MUST read and follow the rules in these files:**

1. **[PROJECT_RULES.md](../PROJECT_RULES.md)** — Architecture, conventions, and constraints.
2. **[GETTING_STARTED.md](../GETTING_STARTED.md)** — Environment setup, database access, project structure.
3. **[docs/api-contract.md](../docs/api-contract.md)** — All documented API endpoints.
4. **[docs/backend-requests.md](../docs/backend-requests.md)** — Pending requests for the backend/SQL developer.

These files are the single source of truth for this project. If anything conflicts, PROJECT_RULES.md wins.

## Key Reminders

- **No data manipulation in Angular** — Angular only displays and sends data.
- **All components must be standalone and generic/reusable.**
- **All HTTP calls go through `ApiService`** — never use `HttpClient` directly.
- **Every endpoint must be documented in `docs/api-contract.md` before use.**
- **If the API returns wrong data, do NOT fix it in Angular** — document a request in `docs/backend-requests/`.
- **Never hardcode URLs, ports, or credentials.**
- **The Dev Panel must show every API call.**
- **Read `docs/api-contract.md` and `docs/backend-requests.md` before making changes.**
- **Database:** MySQL at `192.168.36.35:3306`, database `Bank01`. Use the VS Code database plugin to browse procedures/tables. Angular NEVER talks to the database directly — all data flows through the .NET API calling stored procedures.

## Dynamic Standalone Components — CRITICAL

This project follows a **one-component-for-all** pattern. Never create a separate component per form or data type.

### Architecture

| Layer | Component | Purpose |
|-------|-----------|---------|
| **Shared** | `shared/components/data-grid/` | Generic, reusable data grid with pagination. Takes `columns`, `rows`, `totalRows`, `currentPage`, `pageSize` as inputs. Emits `pageChange`. No data fetching — purely presentational. |
| **Page** | `pages/form-view/` | THE single dynamic page for all forms. Reads `formId` from route params, calls the API, and passes data to `DataGridComponent`. Works for ERM forms, future parent/child forms, and any stored-procedure-backed data view. |

### Rules

1. **Never create a per-form page component.** All forms route to `FormViewComponent` via `/form/:formId`.
2. **Shared components are stateless.** They receive data via `input()` and emit events via `output()`. They never call `ApiService` directly.
3. **Page components are thin orchestrators.** They read route params, call `ApiService`, and feed data to shared components. Minimal logic.
4. **When adding new form types** (e.g. from navigation children), add them to the existing `FormViewComponent` — do not create a new page.
5. **If a form needs a different layout**, use a config/flag on `FormViewComponent`, not a new component.
6. **All new components must be standalone** (`standalone: true`). No NgModules.
7. **Use Angular signals** (`signal()`, `computed()`, `input()`, `output()`) — not decorators like `@Input()` / `@Output()`.

### Routing Pattern

```typescript
// All forms use the same component:
{ path: 'form/:formId', loadComponent: () => import('./pages/form-view/form-view.component').then(m => m.FormViewComponent) }

// Legacy aliases redirect to the generic route:
{ path: 'erm/:formId', redirectTo: 'form/:formId' }
```

### Adding a New Shared Component

When you need a new reusable UI piece (modal, card, filter bar, etc.):
1. Create it in `shared/components/<name>/`.
2. Make it **standalone**, **stateless**, and **generic**.
3. Use `input()` / `output()` signals for all data flow.
4. It must work for any data shape — no form-specific logic.

## Backend Requests

When you need a new stored procedure, a change to an existing one, or an endpoint isn't returning what the UI needs:

1. **Create a numbered file** in `docs/backend-requests/` using the naming convention `NNN-short-description.md` (e.g. `001-erm-form-list.md`, `002-pagination-support.md`).
2. **Copy the template** from `docs/backend-requests/_template.md`.
3. **Fill in all sections** — include an example SQL procedure when possible so the backend dev can see the intent.
4. **Add a row** to the Request Index table in `docs/backend-requests.md`.
5. **Never skip numbering** — always use the next sequential number.
