# IPSV2 — Project Rules & Architecture Bible

> **Every agent, developer, or AI assistant MUST read this file before making any changes to this project.**

---

## 1. Project Overview

IPSV2 is an Angular frontend application that communicates with a .NET API backend. The backend is a **thin pass-through layer** that calls MySQL stored procedures written and maintained by a separate SQL developer.

```
┌─────────────────────┐         ┌─────────────────────┐         ┌──────────────┐
│   Angular Frontend  │  ←───→  │   .NET API Backend   │  ←───→  │    MySQL     │
│   (This project)    │  HTTP   │   (Pass-through)     │  SQL    │   (Stored    │
│                     │         │                      │  Procs  │  Procedures) │
└─────────────────────┘         └─────────────────────┘         └──────────────┘
```

### Roles

| Role | Responsibility |
|------|---------------|
| **Frontend (Angular)** | Display data, render forms, send user input to API. **No data manipulation.** |
| **Backend (.NET API)** | Expose endpoints that call stored procedures. No business logic. |
| **SQL Developer** | Write all stored procedures. All business logic and data shaping lives here. |

### Database

| Key | Value |
|-----|-------|
| Host | `192.168.36.35` |
| Port | `3306` |
| Database | `Bank01` |
| Engine | MySQL |
| Auth | See `.env` file (NEVER commit to git) |

### API

| Key | Value |
|-----|-------|
| Backend Port | `8003` |
| Frontend Port | `4200` |
| Backend URL | `http://localhost:8003` |
| Swagger | `http://localhost:8003/swagger` |

---

## 2. Golden Rules

### 2.1 — NO Data Manipulation in Angular
- Angular **displays** what the API returns and **sends** what the user inputs.
- If data needs transformation, filtering, calculation, or validation beyond basic UI validation — **that is the SQL developer's job**.
- If you find yourself writing logic to reshape data: **STOP**. Document what you need in `docs/backend-requests.md` and advise the backend/SQL developer to change their procedure.

#### Formatting Exception
While Angular must not **change the value** of data (business logic), it **is responsible** for display formatting based on metadata column types.

| | Example | Allowed? |
|---|---|---|
| ✅ Correct | API sends `2026-02-19T00:00:00`, Angular uses `DatePipe` to show "Feb 19, 2026" | Yes — display formatting |
| ✅ Correct | API sends `1500.5`, Angular uses `CurrencyPipe` to show "R 1,500.50" | Yes — display formatting |
| ❌ Incorrect | Angular calculates "Days Overdue" by subtracting the date from today | No — this is a calculated value; must be a column from SQL |
| ❌ Incorrect | Angular filters, groups, or aggregates rows to derive new data | No — this is data manipulation; must be done in the procedure |

### 2.2 — Dynamic, Standalone Components Only
- Every component MUST be a **standalone Angular component**.
- Components MUST be **generic and reusable**. Build once, work for all.
- Do NOT create one component per form. Create ONE form renderer that handles all forms dynamically.
- If a component cannot be reused for a similar use case, justify why in a comment.

### 2.3 — Transparency First
- Every API call MUST be visible in the **Dev Panel** (see Section 5).
- Every endpoint MUST be documented in the **API Contract** (`docs/api-contract.md`).
- Never call an API endpoint without it being registered in the contract.

### 2.4 — Advise, Don't Fix
- If the API returns data in a shape that doesn't work for the UI, **do not reshape it in Angular**.
- Instead, create an entry in `docs/backend-requests.md` describing:
  - What endpoint you're calling
  - What you currently receive
  - What you need instead
  - Why you need it

### 2.6 — API Metadata Standard

All endpoints feeding `FormViewComponent` must return a **standard wrapper structure** — not just a raw array. The backend must dictate the UI structure.

```typescript
interface ApiResponse<T> {
  meta: {
    title: string;              // Page title
    columns: ColumnDef[];       // Column headers, visible flags, types (date/text/currency)
    pagination: {
      totalRows: number;
      page: number;
      pageSize: number;
    };
    actions: ActionDef[];       // Allowed buttons (e.g., "Create", "Delete")
  };
  data: T[];
}
```

**Rules:**
- The `meta.columns` array defines what columns to render and their display types (text, date, currency, etc.). Angular uses this to apply the correct `Pipe` (see Formatting Exception in 2.1).
- The `meta.pagination` object tells the grid how many total rows exist and which page is currently loaded.
- The `meta.actions` array tells the UI which CRUD buttons to show. The frontend never decides this — the backend controls it.
- If an endpoint does not yet return this shape, **document a backend request** to migrate it.

---

### 2.5 — Environment Configuration
- API base URL and all environment-specific config lives in `src/environments/` (Angular) and `.env` / `appsettings.json` (backend).
- The `.env` file overrides `appsettings.json` values — it is the source of truth for local dev.
- Database connection details are available via the VS Code database plugin — use it to verify procedure names and parameters.
- **NEVER** hardcode URLs, ports, or credentials anywhere in source code.

---

## 3. Authentication

- For now: POC-level authentication (hardcoded users, no JWT).
- Auth pattern follows the same approach as IPSAngular — signal-based `AuthService` with `StorageService` for session persistence.
- Auth interceptor MUST attach credentials to every outgoing API request when real auth is implemented.
- Auth state MUST be available globally via a service.

---

## 4. Folder Structure

```
src/app/
│
├── core/                            # Singleton services, guards, interceptors
│   ├── auth/
│   │   ├── auth.service.ts          # Authentication state & methods
│   │   ├── auth.guard.ts            # Route protection
│   │   └── auth.models.ts           # User, role, credential types
│   ├── services/
│   │   ├── api.service.ts           # Central HTTP service (ALL calls go through here)
│   │   └── api-logger.service.ts    # Logs every request/response for Dev Panel
│   ├── interceptors/
│   │   └── api-debug.interceptor.ts # Feeds data to Dev Panel
│   └── models/
│       ├── api-request-log.model.ts # Shape of a logged API call
│       └── api-response.model.ts    # Standard API response wrapper
│
├── features/                        # Feature modules (lazy loaded)
│   ├── forms/
│   │   ├── form-renderer/           # THE generic dynamic form component
│   │   ├── form-schema.model.ts     # Defines what a form looks like
│   │   └── form.service.ts          # Fetches form schemas & submits data
│   └── [other-features]/
│
├── shared/                          # Shared components, pipes, directives
│   ├── dev-panel/                   # Debug/transparency panel (see Section 5)
│   │   ├── dev-panel.component.ts
│   │   └── dev-panel.service.ts
│   └── components/                  # Generic UI components (tables, modals, etc.)
│
├── layouts/                         # Page layouts (shell, sidebar, etc.)
│
└── app.config.ts                    # App-level providers, interceptors
```

### Rules for Folder Structure
- **core/** — Only singleton services. Imported once at app level.
- **features/** — Each feature is lazy-loaded. Each feature folder is self-contained.
- **shared/** — Only reusable, stateless components/pipes/directives.
- **NEVER** put feature-specific logic in shared/.
- **NEVER** put shared components in features/.

---

## 5. Dev Panel

The Dev Panel is a **collapsible overlay** visible in the application that shows real-time API activity.

### What It Shows
| Field | Description |
|-------|-------------|
| **Endpoint** | Full URL called (e.g., `GET /api/Forms/GetClientDetails?id=123`) |
| **Request Payload** | JSON body sent (for POST/PUT) |
| **Response Data** | Raw JSON response received |
| **Status Code** | HTTP status (200, 400, 500, etc.) |
| **Duration** | Time taken in milliseconds |
| **Timestamp** | When the call was made |
| **Procedure Name** | The stored procedure this maps to (from API contract) |

### Behaviour
- **Toggle visibility** via a floating button (bottom-right corner).
- **Persists toggle state** in localStorage.
- **Available in production** behind a toggle (not removed in prod builds).
- Shows the **last 50 API calls** in reverse chronological order.
- Each entry is **expandable** to show full request/response.
- Has a **"Copy as Spec"** button that formats the call as a markdown spec block for sharing with the backend developer.

### Copy as Spec Format
```
## API Call: GetClientDetails
- **Endpoint:** GET /api/Forms/GetClientDetails?id=123
- **Called at:** 2026-02-18T10:30:00Z
- **Duration:** 45ms
- **Status:** 200

### Request
(none)

### Response
{json here}
```

---

## 6. API Contract

Every endpoint used in the application MUST be documented in `docs/api-contract.md`.

### Contract Entry Format

```markdown
## [FormName / FeatureName] — [Action]

| Field | Value |
|-------|-------|
| **Endpoint** | `GET /api/Forms/Schema/clientDetails` |
| **Method** | GET |
| **Stored Procedure** | `sp_GetClientDetailsSchema` |
| **Status** | ✅ Working / 🔨 In Progress / ❌ Not Started |

### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Client ID |

### Expected Response
json { "fields": [...], "data": {...} }
```

### Contract Rules
- **Before calling any new endpoint**, add it to the contract first.
- **Before changing how you call an endpoint**, update the contract first.
- The contract is the **single source of truth** for frontend-backend communication.

---

## 7. Dynamic Form System

### Philosophy
There is **ONE form renderer component**. It receives a schema and renders any form.

### Form Schema Structure
The form schema defines what fields to render. This comes from the API.

```typescript
interface FormSchema {
  formId: string;
  title: string;
  description?: string;
  procedure: string;          // Which stored procedure this maps to
  submitEndpoint: string;     // Where to POST the form data
  fields: FormField[];
}

interface FormField {
  name: string;               // Field identifier
  label: string;              // Display label
  type: FieldType;            // text, number, date, select, checkbox, textarea, etc.
  required: boolean;
  defaultValue?: any;
  options?: FieldOption[];    // For select/dropdown fields
  validations?: Validation[]; // Basic UI validations only
  order: number;              // Display order
  gridColumn?: number;        // Layout hint (1-12 grid)
}

type FieldType = 'text' | 'number' | 'date' | 'datetime' | 'select' |
                 'multiselect' | 'checkbox' | 'textarea' | 'hidden' |
                 'email' | 'phone' | 'currency';

interface FieldOption {
  value: any;
  label: string;
}

interface Validation {
  type: 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'custom';
  value: any;
  message: string;
}
```

### Rules
- The form renderer takes a `FormSchema` and renders it. Period.
- If a form needs "special" rendering, extend the schema — do NOT create a special component.
- All form submissions go through `FormService.submit(formId, data)`.
- The form renderer shows the procedure name and endpoint in dev mode.

---

## 8. API Service Rules

### Thin Base Service (`ApiService`)
The app provides a lightweight `ApiService` that exposes the base URL and generic HTTP helpers. Components and feature services MAY use `HttpClient` directly — there is no requirement to wrap every call in a named `ApiService` method.

**Why:** This app is heavily dynamic (runtime URLs built from `FormID`, `ObjTypeNo`, etc.). Forcing every call through a single wrapper creates a bloated file and adds pass-through boilerplate. Cross-cutting concerns (auth, logging) are already handled by **interceptors**.

```typescript
// Option A — Use ApiService helpers (preferred for common endpoints)
this.apiService.get<T>('/records/stakeholders');
this.apiService.post<T>('/storedproc/execute', body);

// Option B — Use HttpClient directly (fine for dynamic/one-off calls)
const url = `${environment.apiUrl}/dynamic/${formId}`;
this.http.get<T>(url, { params });
```

### Both approaches are valid. The rules are:
1. **Always use `environment.apiUrl`** as the base — never hardcode `localhost:8003`
2. **Never duplicate interceptor logic** (auth headers, error toasts) inside a component
3. All calls are automatically logged by `devModeInterceptor` — no manual logging needed
4. Be documented in the API Contract
5. Handle errors via the centralized interceptor (components only handle business-level errors)
6. Show loading state in the UI

---

## 9. Styling & UI

- Use a consistent UI framework (Angular Material or PrimeNG — decide once, stick with it).
- All theme variables in a single SCSS file.
- Responsive design required for all components.
- Peacock workspace colors:
  - **Full stack:** Orange-Red (`#e44d2a`)
  - **Backend only:** Green (`#00a86b`)
  - **Frontend only:** Purple (`#8b5cf6`)

---

## 10. Backend Developer Communication

### JSON-First Requests

When creating backend requests, **priority must be given to the Desired JSON Response**. Provide a literal JSON example of what the Angular component needs to receive. This is more helpful to the backend developer than a rough SQL query suggestion.

**Every backend request MUST include:**
1. A **literal JSON example** of the desired response (copy-pasteable, realistic data)
2. A description of **what the UI will do** with each field
3. Which **Angular component** will consume it (e.g., `DataGridComponent`, `DetailGridComponent`)

The example SQL procedure section is **optional and secondary** — the JSON response is the contract.

### When You Need a New Procedure

Create a numbered file in `docs/backend-requests/` using the template (`_template.md`):

```markdown
## Request: [Description]
**Date:** YYYY-MM-DD
**Status:** 📋 Requested / 🔨 In Progress / ✅ Done

### What I Need
[Describe the endpoint and what it should return]

### Proposed Endpoint
`GET /api/[controller]/[action]`

### Desired JSON Response (REQUIRED)
json
{
  "meta": {
    "title": "Stakeholders",
    "columns": [
      { "key": "No", "label": "No", "type": "text", "visible": true },
      { "key": "Name", "label": "Full Name", "type": "text", "visible": true },
      { "key": "CreatedDate", "label": "Created", "type": "date", "visible": true }
    ],
    "pagination": { "totalRows": 10986, "page": 1, "pageSize": 50 },
    "actions": ["create", "edit", "delete"]
  },
  "data": [
    { "No": "2300036", "Name": "John Doe", "CreatedDate": "2026-01-15T00:00:00" }
  ]
}

### Why
[Explain the UI/UX requirement driving this]

### Example Procedure (optional, for reference)
sql
-- Optional: provide a rough SQL example so the backend dev understands the intent
```

### When a Procedure Returns Wrong Data

Do NOT fix it in Angular. Create a backend request showing:

```markdown
### Current JSON Response
json { what it currently returns — paste actual response from Dev Panel }

### Desired JSON Response
json { what I need it to return — literal example }

### Why
[Explain the UI requirement]
```

---

## 11. Git & Workflow

- **Branch naming:** `feature/[description]`, `fix/[description]`, `docs/[description]`
- **Commit messages:** Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`)
- **Never commit** `.env`, `node_modules`, or build artifacts.
- **Always commit** updated API contract and backend request docs with related code changes.

---

## 12. Pre-Flight Checklist

Before ANY code change, verify:

- [ ] Read this file (`PROJECT_RULES.md`)
- [ ] Checked `.env` for current configuration
- [ ] Checked `docs/api-contract.md` for existing endpoints
- [ ] Component is standalone
- [ ] Component is generic/reusable
- [ ] No data manipulation in Angular
- [ ] API call uses `environment.apiUrl` (never hardcoded URLs)
- [ ] API call is documented in contract
- [ ] Dev Panel will show this call
- [ ] No hardcoded URLs or config values

---

## 13. File Reference

| File | Purpose |
|------|---------|
| `PROJECT_RULES.md` | This file. The law. |
| `GETTING_STARTED.md` | Environment setup and first-run guide |
| `.env` | Environment variables — lives in `backend-dotnet/IpsApi/.env` (NEVER commit) |
| `docs/api-contract.md` | All API endpoints documented |
| `docs/backend-requests.md` | Requests/issues for the backend developer |
| `frontend/src/environments/` | Angular environment configs |

---

*Last updated: 2026-02-19*
*If this file conflicts with any other documentation, THIS FILE WINS.*

---

## 14. Current Project Status

> **Last updated: 2026-02-19**

### What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| .NET API server | ✅ Running | Port 8003, Scalar docs at `/scalar` |
| Angular frontend | ✅ Running | Port 4200, standalone components, signals |
| Health endpoint | ✅ | `GET /api/health` |
| Navigation from DB | ✅ Working (with workaround) | `GET /api/navigation` → calls `ReadNavigation` |
| Top nav bar | ✅ | Modules with hover dropdowns, dev IDs visible |
| ERM form viewer | ✅ For 15/20 forms | `GET /api/erm?formId=X` → calls `ReadNewERM` |
| Data grid | ✅ | Generic, stateless, client-side pagination |
| Detail grid | ✅ Component ready | Split-screen below main grid, empty until backend-004 delivers |
| Dynamic routes | ✅ | `/form/:formId` → single `FormViewComponent` |
| Dev Panel logging | ✅ | All API calls intercepted and logged |

### What's Blocked on Backend (Theo)

| Issue | Backend Request | Impact | Workaround in place? |
|-------|----------------|--------|---------------------|
| **5 forms crash (500)** | [002](docs/backend-requests/002-readnewerm-fixes-pagination.md) | Resource, Bank Transaction, Journals, Equipment, Stakeholder variant unusable | ❌ No — shows error badge |
| **ReadNavigation FormID JOIN wrong** | [003](docs/backend-requests/003-application-navigation.md) | ERM children get wrong/duplicate FormIDs from the DB | ✅ Yes — hardcoded `FORM_ID_OVERRIDES` map in `NavigationService` |
| **No server-side pagination** | [002](docs/backend-requests/002-readnewerm-fixes-pagination.md) | Stakeholder (10k rows), Account (10k rows) load entirely into memory | ✅ Yes — client-side slicing |
| **Need generic form procedure** | [002](docs/backend-requests/002-readnewerm-fixes-pagination.md) | One procedure for all form types (not just ERM) | ✅ Partial — using `ReadNewERM` which works but is ERM-named |
| **No detail/child records procedure** | [004](docs/backend-requests/004-detail-child-records.md) | Detail tabs (Addresses, Related Parties, etc.) can't load — no procedure exists | ❌ No — detail grid shows empty state |

### TODO Tags in Code

All pending backend-dependent work is marked with searchable tags:

| Tag | Meaning | Files |
|-----|---------|-------|
| `TODO(backend-002)` | Blocked on ReadNewERM fixes & pagination | `ErmController.cs`, `form-view.component.ts` |
| `TODO(backend-003)` | Blocked on ReadNavigation FormID fix | `NavigationController.cs`, `navigation.service.ts` |
| `TODO(backend-004)` | Blocked on detail tabs + detail data procedures | `detail-grid.component.ts`, `form-view.component.ts`, `form-view.component.html` |

Search for `TODO(backend-` across the codebase to find all pending items.
