# 002 — Generic Form Data Procedure (Fixes & Pagination)

**Date:** 2026-02-18
**Updated:** 2026-02-19
**Status:** 📋 Requested — blocking 5 forms, no pagination
**Priority:** 🔴 High
**Assigned to:** Theo

---

## What I Need

We need **one stored procedure that works for ALL forms** — not just ERM forms. The frontend has a single generic `FormViewComponent` that renders any form by `FormID`. The procedure must accept any valid `FormID` and return its columns + rows.

Currently we're using `ReadNewERM`, which works for most FormIDs but has the name "ERM" baked in. The goal is a **generic data procedure** (either rename it, wrap it, or create a new one) that:

1. Works for **every FormID** (ERM and non-ERM)
2. Handles NULL parameters without crashing
3. Supports server-side pagination

### Issue 1: 500 Internal Server Error on certain FormIDs

5 out of 20 tested FormIDs cause a **500 Internal Server Error** because `ReadNewERM` generates invalid dynamic SQL containing a bare `NULL` that causes a MySQL syntax error.

**Error message:** `You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'NULL' at line 1`

**Failing FormIDs:**

| FormID | Form Name | Error |
|--------|-----------|-------|
| 3000825 | Resource | `syntax near 'NULL'` |
| 3000275 | (Stakeholder Master variant) | `syntax near 'NULL'` |
| 3000152 | Bank Transaction | `syntax near 'NULL'` |
| 3000214 | Journals | `syntax near 'NULL'` |
| 3000908 | Equipment | `syntax near 'NULL'` |

**Working FormIDs (for comparison):**

| FormID | Form Name | Rows Returned |
|--------|-----------|---------------|
| 3002443 | Stakeholder | 10,986 |
| 3000743 | Account | 10,979 |
| 3003751 | Product | 0 |
| 3004196 | Business Process | 0 |
| 3001603 | Look-ups | 0 |
| 3003752 | Related Party | 0 |
| 3003754 | Share Register | 0 |
| 3000650 | Addresses | 0 |
| 3001488 | Documents | 0 |
| 3003725 | Account Setup | 0 |
| 3004095 | Specific Fees | 0 |
| 3003744 | General Ledgers | 0 |
| 3003756 | Sub-Product | 0 |
| 3004120 | Sub-Product Detail | 0 |
| 3003745 | Global Fees | 0 |
| 3001231 | Master Tasks | 0 |

The procedure is called as: `CALL ReadNewERM(FormID, '', NULL)` — the third param (`RequiredDate`) is NULL. The procedure's internal dynamic SQL appears to embed `NULL` incorrectly for certain form configurations, producing an invalid query.

### Issue 2: Pagination Support

Some forms return very large datasets (Stakeholder = 10,986 rows, Account = 10,979 rows). Currently the API loads **all rows** into memory and the frontend paginates client-side. This won't scale.

The procedure should support server-side pagination so only the needed page of data is returned.

---

## Proposed Endpoint

`GET /api/form-data?formId=3000825&page=1&pageSize=50`

*(Generic endpoint — works for any form, not just ERM)*

## Proposed Procedure Changes

The ideal outcome is **one procedure** that serves any form. Options:

### Option A (preferred): Create a generic `ReadFormData` procedure

```
CALL ReadFormData(@FormID, @ObjTypeList, @RequiredDate, @PageNumber, @PageSize);
```

This would replace `ReadNewERM` as the single data procedure for all form types. Internally it can use the same L4 logic that `ReadNewERM` uses.

### Option B: Modify `ReadNewERM` to accept pagination + rename

Keep the same code, add pagination params, and optionally rename to something generic:

```
CALL ReadNewERM(@FormID, @ObjTypeList, @RequiredDate, @PageNumber, @PageSize);
```

### Option C: Wrap `ReadNewERM` in a paginated wrapper

```
CALL ReadFormDataPaged(@FormID, @ObjTypeList, @RequiredDate, @PageNumber, @PageSize);
```

Any option works. The response must include the total row count so the frontend can render pagination controls.

## Expected Request

```
GET /api/form-data?formId=3002443&page=1&pageSize=50

-- Procedure call:
CALL ReadFormData(3002443, '', NULL, 1, 50);
-- OR if keeping existing name:
CALL ReadNewERM(3002443, '', NULL, 1, 50);
```

## Desired JSON Response (REQUIRED)

> **This is the contract.** The .NET API must return this exact shape so `FormViewComponent` and `DataGridComponent` can render it generically.

```json
{
  "success": true,
  "data": {
    "meta": {
      "title": "Stakeholder",
      "columns": [
        { "key": "No", "label": "No", "type": "text", "visible": true },
        { "key": "Function", "label": "Function", "type": "text", "visible": true },
        { "key": "Description", "label": "Description", "type": "text", "visible": true },
        { "key": "Roles", "label": "Roles", "type": "text", "visible": true },
        { "key": "Seq", "label": "Seq", "type": "number", "visible": true },
        { "key": "Duration", "label": "Duration", "type": "number", "visible": true },
        { "key": "ManHrs", "label": "Man Hrs", "type": "number", "visible": true }
      ],
      "pagination": {
        "totalRows": 10986,
        "page": 1,
        "pageSize": 50
      },
      "actions": []
    },
    "rows": [
      {
        "No": "2300036",
        "Function": "Access Management",
        "Description": "Access Management",
        "Roles": "COO",
        "Seq": "100033.000",
        "Duration": "0.000",
        "ManHrs": "0.000"
      }
    ]
  },
  "error": null,
  "timestamp": "2026-02-18T10:30:00Z"
}
```

### How Angular Will Use This

| Field | Angular Component | What It Does |
|-------|------------------|-------------|
| `meta.title` | `FormViewComponent` | Displays as the page heading |
| `meta.columns` | `DataGridComponent` | Renders table headers dynamically; `type` determines which Pipe to apply (DatePipe, CurrencyPipe, etc.) |
| `meta.pagination` | `DataGridComponent` | Shows "1-50 of 10,986" and enables page navigation |
| `meta.actions` | `FormViewComponent` | Renders action buttons (Create, Edit, Delete) — empty array = read-only |
| `rows` | `DataGridComponent` | Rendered as table rows, one column per `meta.columns` entry |

## Legacy Expected Response (for reference)

Two result sets (or a total count column):

**Result Set 1 — Data rows** (only the requested page):
```
| No | Function | Description | Roles | Seq | Duration | Man Hrs |
|----|----------|-------------|-------|-----|----------|---------|
| 1  | ...      | ...         | ...   | ... | ...      | ...     |
| 2  | ...      | ...         | ...   | ... | ...      | ...     |
...50 rows...
```

**Result Set 2 — Metadata** (or add to result set 1):
```
| TotalRows |
|-----------|
| 10986     |
```

## Why

1. **500 errors break the UI** — 5 of 20 tested forms are completely unusable. Users clicking Resource, Bank Transaction, Journals, or Equipment get a blank error page.

2. **One procedure for all forms** — The frontend uses a single `FormViewComponent` for every form type. It passes a `FormID` and expects columns + rows back. The backend procedure must be equally generic — it should handle any valid `FormID`, regardless of whether it's an ERM form or something else.

3. **Performance** — Loading 10,000+ rows into memory for every page view is inefficient. With pagination, the API only fetches 50 rows at a time, reducing load on the database and the API server.

4. **User experience** — The old IPS system showed "1-50 of 10986" pagination. We need the same in IPSV2.

## Example Procedure (for reference)

```sql
DELIMITER $$

-- Option A: Modify existing ReadNewERM
-- Add two optional params at the end (defaults for backward compatibility):

-- At the end of the dynamic SQL generation in ReadNewERM,
-- before executing the statement, append:
--
--   IF @PageSize IS NOT NULL AND @PageSize > 0 THEN
--       SET @sql = CONCAT(@sql, ' LIMIT ', @PageSize, ' OFFSET ', (@PageNumber - 1) * @PageSize);
--   END IF;
--
-- And add a second SELECT for total count:
--   SET @countSql = CONCAT('SELECT COUNT(*) AS TotalRows FROM (', @originalSql, ') AS countQuery');
--   PREPARE countStmt FROM @countSql;
--   EXECUTE countStmt;
--   DEALLOCATE PREPARE countStmt;

-- Option B: Wrapper (simpler, no risk to existing procedure)
CREATE PROCEDURE `ReadNewERMPaged`(
    IN FormID INT,
    IN ObjTypeList VARCHAR(255),
    IN RequiredDate DATE,
    IN PageNumber INT,
    IN PageSize INT
)
BEGIN
    -- Call the original procedure into a temp table, then paginate
    -- This depends on the dynamic SQL structure of ReadNewERM
    -- Adjust as needed based on the actual implementation

    SET @offset = (IFNULL(PageNumber, 1) - 1) * IFNULL(PageSize, 50);
    SET @limit = IFNULL(PageSize, 50);

    -- Ideally modify ReadNewERM's dynamic SQL to append:
    -- LIMIT @limit OFFSET @offset
END$$

DELIMITER ;
```

## Notes

- The `NULL` syntax error happens inside the procedure's dynamic SQL generation — not in how we call it. The CALL statement itself is valid (`CALL ReadNewERM(3000825, '', NULL)`), but the procedure's internal `CONCAT`/`PREPARE` produces bad SQL for certain form configurations.
- The 5 failing FormIDs likely have a different `obj` configuration (different column setup in their L4/form definition) compared to the working ones.
- Working FormIDs that return 0 rows are fine — they execute successfully but just have no data yet.
- Backward compatibility: if modifying `ReadNewERM`, making the new params optional with defaults ensures existing callers aren't broken.
- Current call signature: `CALL ReadNewERM(FormID INT, ObjTypeList VARCHAR(255), RequiredDate DATE)`

---

## ⚠️ UPDATE — 2026-02-19: Stored Procedure Investigation Results

### What we investigated

We looked at three ERM-related stored procedures in the database to understand which is the correct one:

| Procedure | Uses Level | Status |
|---|---|---|
| **ReadNewERM** | L4 | ✅ **This is the correct one** — works for 15/20 FormIDs |
| **DynamicFieldValues** | L7 | ❌ Wrong — newest but buggy, returns wrong data structures |
| **ReadERM** | L7 | ❌ Wrong — oldest version, also uses L7 |

### Key finding: L4 vs L7

The ERM forms in the `obj` table have data at two "levels" — L4 and L7. The procedures that use **L4** (`ReadNewERM`) return correct column/row structures. The procedures that use **L7** (`DynamicFieldValues`, `ReadERM`) return mismatched or broken results.

**Theo — do NOT switch to DynamicFieldValues.** Stick with `ReadNewERM` (L4) as the foundation. It just needs the NULL fix for the 5 failing FormIDs. Ideally rename or wrap it into a generic procedure (e.g. `ReadFormData`) that works for all form types, not just ERM.

### Current workarounds in Angular

The frontend has two dev-note sets tracking this:

1. **`failingFormIds`** — The 5 FormIDs that crash with 500 error. These show a red "Known Issue" badge when opened.
2. **`emptyFormIds`** — 14 FormIDs that return 0 rows. These work fine but show "No data found." These are likely not populated in the test database.
3. **Client-side pagination** — Since there's no server-side pagination yet, the frontend slices all rows in memory. Works for now but won't scale when forms have 10k+ rows.

### What the frontend shows today

| FormID | Name | Status in UI |
|---|---|---|
| 3002443 | Stakeholder | ✅ Works — 10,986 rows, client-paginated |
| 3000743 | Account | ✅ Works — 10,979 rows, client-paginated |
| 3003751 | Product | ✅ Works — 0 rows |
| 3004196 | Business Process | ✅ Works — 0 rows |
| 3000825 | Resource | ❌ Red badge — 500 error |
| 3000275 | (Stakeholder variant) | ❌ Red badge — 500 error |
| 3000152 | Bank Transaction | ❌ Red badge — 500 error |
| 3000214 | Journals | ❌ Red badge — 500 error |
| 3000908 | Equipment | ❌ Red badge — 500 error |

### Priority actions for Theo

1. **Fix the NULL dynamic SQL bug** in `ReadNewERM` for the 5 failing FormIDs — this is the #1 blocker
2. **Make it generic** — the procedure should work for any `FormID`, not just ERM forms. If renaming `ReadNewERM` to `ReadFormData` is easier than creating a new one, that's fine.
3. **Add pagination** (LIMIT/OFFSET + total count) — nice to have now, essential before go-live
