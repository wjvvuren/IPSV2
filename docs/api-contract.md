# API Contract

> **Single source of truth** for all frontend-to-backend API communication.
>
> Update this file BEFORE writing any code that calls a new endpoint.

---

## Status Legend

| Icon | Meaning |
|------|---------|
| ✅ | Working and tested |
| 🔨 | In progress (backend or frontend) |
| ❌ | Not started |
| ⚠️ | Broken / needs fix |

---

## Base URL

- **Development:** `http://localhost:8003`
- **Production:** TBD

---

## Standard Response Wrapper

All API responses should follow this shape:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-02-18T10:30:00Z"
}
```

---

## Endpoints

*(Add new endpoints below as they are needed)*

---

## Health — Check

| Field | Value |
|-------|-------|
| **Endpoint** | `GET /health` |
| **Method** | GET |
| **Stored Procedure** | N/A |
| **Status** | ✅ Working |

### Request Parameters
None

### Expected Response
```json
{
  "status": "healthy"
}
```

---

<!-- TEMPLATE — Copy this block for each new endpoint:

## [Feature] — [Action]

| Field | Value |
|-------|-------|
| **Endpoint** | `METHOD /api/Controller/Action` |
| **Method** | GET / POST / PUT / DELETE |
| **Stored Procedure** | `sp_ProcedureName` |
| **Status** | ❌ Not Started |

### Request Parameters / Body
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| | | | |

### Expected Response
```json
{
}
```

### Notes
-

-->
