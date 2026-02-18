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

## ERM — Read

| Field | Value |
|-------|-------|
| **Endpoint** | `GET /api/erm` |
| **Method** | GET |
| **Stored Procedure** | `ReadNewERM(FormID, ObjTypeList, RequiredDate)` |
| **Status** | 🔨 In Progress |

### Request Parameters (Query String)
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `formId` | int | Yes | — | The form configuration ID from the `obj` table |
| `objTypeList` | string | No | `""` | Comma-separated ObjTypeNo values to filter |
| `requiredDate` | string (date) | No | `null` | ISO date string for date filtering |

### Example Request
```
GET /api/erm?formId=3002971
GET /api/erm?formId=3002971&objTypeList=10563&requiredDate=2026-01-01
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "columns": ["No", "Function", "Description", "Roles", "Seq", "Duration", "Man Hrs"],
    "rows": [
      {
        "No": "2300036",
        "Function": "Access Management",
        "Description": "Access Management",
        "Roles": "COO",
        "Seq": "100033.000",
        "Duration": "0.000",
        "Man Hrs": "0.000"
      }
    ],
    "totalRows": 75,
    "formId": 3002971,
    "procedureName": "ReadNewERM"
  },
  "error": null,
  "timestamp": "2026-02-18T10:30:00Z"
}
```

### Notes
- Column names are dynamic — they change based on the form configuration in the `obj` table.
- The backend returns data as-is from the procedure; Angular renders the dynamic columns.
- Test form: `3002971` (Company Functions, 75 rows).

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
