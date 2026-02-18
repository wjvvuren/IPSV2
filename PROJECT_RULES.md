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

### Central API Service
ALL HTTP calls go through `ApiService`. No component or feature service calls `HttpClient` directly.

```typescript
// Correct
this.apiService.get<T>(endpoint, params);
this.apiService.post<T>(endpoint, body);

// WRONG — never do this
this.http.get<T>(url);
```

### Every API call MUST:
1. Go through `ApiService`
2. Be logged by `ApiLoggerService`
3. Be documented in the API Contract
4. Handle errors via a centralized error handler
5. Show loading state in the UI

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

### When You Need a New Procedure

Create an entry in `docs/backend-requests.md`:

```markdown
## Request: [Description]
**Date:** YYYY-MM-DD
**Status:** 📋 Requested / 🔨 In Progress / ✅ Done

### What I Need
[Describe the endpoint and what it should return]

### Proposed Endpoint
`GET /api/[controller]/[action]`

### Expected Request
json { ... }

### Expected Response
json { ... }

### Notes
[Any additional context]
```

### When a Procedure Returns Wrong Data

Do NOT fix it in Angular. Add to `docs/backend-requests.md`:

```markdown
## Fix Request: [Procedure Name]
**Date:** YYYY-MM-DD
**Status:** 📋 Requested

### Current Response
json { what it currently returns }

### What I Need Instead
json { what I need it to return }

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
- [ ] API call goes through `ApiService`
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

*Last updated: 2026-02-18*
*If this file conflicts with any other documentation, THIS FILE WINS.*
