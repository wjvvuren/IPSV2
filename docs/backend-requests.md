# Backend Developer Requests

> Use this file to communicate with the backend/SQL developer.
>
> Add entries here when you need a new stored procedure, a change to an existing one, or when an endpoint isn't returning what the UI needs.

---

## Status Legend

| Icon | Meaning |
|------|---------|
| 📋 | Requested — waiting for backend dev |
| 🔨 | In progress |
| ✅ | Done |
| ❌ | Rejected (see notes) |

---

## Requests

*(Add new requests below)*

---

## [Request]: Procedure to Fetch ERM Form List
**Date:** 2026-02-18
**Status:** 📋 Requested
**Priority:** 🟡 Medium

### What I Need
A stored procedure that returns the list of ERM forms (name, FormID, icon/code) so the sidebar navigation can be built dynamically from the database instead of being hardcoded in the API.

Currently, the ERM form list is hardcoded in `ErmController.cs` with 20 entries manually mapped to FormIDs. These were discovered by querying `obj` where `HiLev = 3003721` (parent "Files ERM") and cross-referencing with `ObjTypeNo = 826` forms. This mapping should come from a procedure.

### Proposed Endpoint
`GET /api/erm/forms`

### Proposed Procedure Name
`ReadERMForms`

### Expected Request
No parameters needed.

### Expected Response
```json
[
  { "id": 3002443, "name": "Stakeholder", "code": "Stakeholder" },
  { "id": 3003751, "name": "Product", "code": "Product" },
  { "id": 3004196, "name": "Business Process", "code": "BusinessProcess" }
]
```

### Why
The ERM sidebar forms are currently hardcoded. If forms are added/removed/renamed in the database, the frontend won't reflect those changes. A procedure ensures the navigation stays in sync with the database configuration.

### Notes
- Parent navigation object: `ObjNo = 3003721` ("Files ERM", `ObjTypeNo = 153`)
- Child items found via `HiLev = 3003721` in `obj` table (26 rows)
- FormIDs found by matching child `ObjCode` to `obj` rows with `ObjTypeNo = 826`
- Some forms may not have data yet (e.g., Product, Business Process return 0 rows from `ReadNewERM`)

---

<!-- TEMPLATE — Copy this block for each new request:

## [Request/Fix]: [Short Description]
**Date:** YYYY-MM-DD
**Status:** 📋 Requested
**Priority:** 🔴 High / 🟡 Medium / 🟢 Low

### What I Need
[Describe what you need]

### Proposed Endpoint
`METHOD /api/Controller/Action`

### Proposed Procedure Name
`sp_ProcedureName`

### Expected Request
```json
{
}
```

### Expected Response
```json
{
}
```

### Why
[Explain the UI/UX requirement driving this]

### Notes
-

-->
