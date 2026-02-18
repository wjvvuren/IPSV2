# 002 — ReadNewERM Fixes & Pagination Support

**Date:** 2026-02-18
**Status:** 📋 Requested
**Priority:** 🔴 High

---

## What I Need

The `ReadNewERM` stored procedure has two issues that need to be addressed:

### Issue 1: 500 Internal Server Error on certain FormIDs

5 out of 20 ERM forms cause a **500 Internal Server Error** because `ReadNewERM` generates invalid dynamic SQL containing a bare `NULL` that causes a MySQL syntax error.

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

`GET /api/erm?formId=3000825&page=1&pageSize=50`

*(Same endpoint, just adding pagination query params)*

## Proposed Procedure Changes

### Option A: Modify `ReadNewERM` to accept pagination params

```
CALL ReadNewERM(@FormID, @ObjTypeList, @RequiredDate, @PageNumber, @PageSize);
```

### Option B: Create a wrapper procedure

```
CALL ReadNewERMPaged(@FormID, @ObjTypeList, @RequiredDate, @PageNumber, @PageSize);
```

Either option works. The response should include the total row count so the frontend can render pagination controls.

## Expected Request

```
CALL ReadNewERM(3002443, '', NULL, 1, 50);
-- OR
CALL ReadNewERMPaged(3002443, '', NULL, 1, 50);
```

## Expected Response

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

1. **500 errors break the UI** — 5 of 20 ERM forms are completely unusable. Users clicking Resource, Bank Transaction, Journals, or Equipment in the sidebar get a blank error page.

2. **Performance** — Loading 10,000+ rows into memory for every page view is inefficient. With pagination, the API only fetches 50 rows at a time, reducing load on the database and the API server.

3. **User experience** — The old IPS system showed "1-50 of 10986" pagination. We need the same in IPSV2.

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
