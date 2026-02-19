# NNN — [Short Description]

**Date:** YYYY-MM-DD
**Status:** 📋 Requested
**Priority:** 🔴 High / 🟡 Medium / 🟢 Low

---

## What I Need

[Describe what you need — what the UI must display and why]

## Proposed Endpoint

`METHOD /api/Controller/Action`

## Proposed Procedure Name

`sp_ProcedureName`

## Expected Request

```
METHOD /api/Controller/Action?param1=value1&param2=value2
```

## Desired JSON Response (REQUIRED)

> **This is the most important section.** Provide a literal, copy-pasteable JSON example
> of exactly what the Angular component needs to receive. Use realistic sample data.

```json
{
  "success": true,
  "data": {
    "meta": {
      "title": "[Page Title]",
      "columns": [
        { "key": "fieldName", "label": "Display Label", "type": "text", "visible": true }
      ],
      "pagination": {
        "totalRows": 0,
        "page": 1,
        "pageSize": 50
      },
      "actions": []
    },
    "rows": []
  },
  "error": null,
  "timestamp": "2026-01-01T00:00:00Z"
}
```

### How Angular Will Use This

| Field | Angular Component | What It Does |
|-------|------------------|--------------|
| `meta.columns` | `DataGridComponent` | Renders table headers and applies formatting pipes |
| `meta.pagination` | `DataGridComponent` | Shows "1-50 of 500" and page controls |
| `rows` | `DataGridComponent` | Rendered as table rows |

## Why

[Explain the UI/UX requirement driving this]

## Example Procedure (optional, for reference)

```sql
-- Optional: provide a rough SQL example so the backend dev understands the intent.
-- The Desired JSON Response above is the real contract — this is just a hint.
```

## Notes

- [Any additional context, table names, object IDs, etc.]
