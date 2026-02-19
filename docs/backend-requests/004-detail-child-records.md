# 004 — Generic Detail/Child Records Procedure (Detail Tabs)

**Date:** 2026-02-19
**Status:** 📋 Requested
**Priority:** 🔴 High
**Assigned to:** Theo

---

## What I Need

When a user selects a row in the main data grid (e.g. selects a Stakeholder), the bottom half of the screen needs to show **detail tabs** with child/related records — exactly like the old IPS system.

From the screenshot (old system), selecting a Stakeholder shows tabs like:
> **Addresses** · Related Parties · ShareRegister · Documents · Accounts · Share Allocation · Sub-Products Detail · Master Documents · Beneficiaries · Equipment

Each tab displays a table with its own columns and data, all linked to the selected parent record.

### What exists today

There is **no generic procedure** for this. The existing procedures (`ReadAccount`, `ReadDocuments`, `ReadShareRegister`, etc.) are **hardcoded, form-specific** — each one queries a fixed `ObjTypeNo` with hardcoded column mappings. They don't accept a parent record ID, so they can't filter to show only the children of a selected row.

### What we discovered in the database

The parent→child relationship is through `HiLev`:

```
Parent stakeholder: ObjNo=35 (ObjTypeNo=803)
Child addresses:    HiLev=35 AND ObjTypeNo=4744  → 3 address records
```

Under stakeholder records (ObjTypeNo=803), these child types exist:

| Child ObjTypeNo | Type Name | Record Count |
|---|---|---|
| 4744 | Addresses | 32,820 |
| 3000637 | Related Parties | 23,046 |
| 4767 | Bank Accounts | 10,977 |
| 803 | Stakeholder (sub-stakeholders) | 1,147 |
| 4860 | ID Numbers | 1,132 |
| 5713 | Member Shares | 392 |
| 3002929 | Documents | 27 |
| 4757 | Contacts | 29 |

The detail tab definitions are likely tied to form definitions (ObjTypeNo=826). Each detail form has:
- **L4** → Column definition set (what columns to display)
- **L5** → Child ObjTypeNo (what records to query)

For example the Addresses form (ObjNo=3000650): L4=10267 (column defs), L5=4744 (address records).

### What we need — TWO things

#### 1. Detail Tab List — Which tabs appear for a given parent form?

When the user opens FormID 3002443 (Stakeholder), we need to know which detail tabs to show. This could be:
- A config in the form definition
- A lookup based on the parent's ObjTypeNo
- A new mapping table

#### 2. Detail Tab Data — Load child records for a selected parent row

When the user selects a row (e.g. ObjNo=35) and clicks the "Addresses" tab, we need the actual child records with proper columns.

---

## Proposed Endpoints

### Endpoint A: Get detail tabs for a form

`GET /api/form-data/detail-tabs?formId=3002443`

Returns the list of available detail tabs for a given parent form.

### Endpoint B: Get detail data for a selected parent + tab

`GET /api/form-data/details?parentObjNo=35&detailFormId=3000650&page=1&pageSize=50`

Returns the child records for the selected parent, shaped by the detail form's column definitions.

---

## Proposed Procedure Names

### Procedure A: `ReadDetailTabs`

```
CALL ReadDetailTabs(@FormID);
```

Returns available detail tabs for a parent form (tab name, detail FormID, icon, sort order).

### Procedure B: `ReadDetailData`

```
CALL ReadDetailData(@DetailFormID, @ParentObjNo, @PageNumber, @PageSize);
```

Returns detail records filtered by parent, with proper columns defined by the detail form.

---

## Expected Responses

### ReadDetailTabs Response

```
| TabName          | DetailFormID | SortOrder | Icon |
|------------------|-------------|-----------|------|
| Addresses        | 3000650     | 1         | NULL |
| Related Parties  | (FormID)    | 2         | NULL |
| ShareRegister    | (FormID)    | 3         | NULL |
| Documents        | (FormID)    | 4         | NULL |
| Accounts         | (FormID)    | 5         | NULL |
| Share Allocation | (FormID)    | 6         | NULL |
| Equipment        | (FormID)    | 7         | NULL |
```

### ReadDetailData Response

**Result Set 1 — Data rows** (for Addresses tab, parent ObjNo=35):
```
| No         | Seq | Type     | Address                    | Street Name    | Suburb     | City/Town | Postal Code | Province     | Country      | Phone       | Fax | Email            | Last Updated     | Status  |
|-----------|-----|----------|----------------------------|----------------|------------|-----------|-------------|--------------|--------------|-------------|-----|------------------|------------------|---------|
| 10000006  | 0   | Postal   |                            | 401 Main Street| Waterkloof |           | 0181        |              | South Africa |             |     |                  | 07/09/16 00:00   | 02 - WIP|
| 10000007  | 0   | Work     | 202, 2nd Floor, Clock Tower| ...            | V&W Water..| Cape Town | 8001        | Western Cape | South Africa |             |     | jannie@medi.coop | 07/09/16 17:16   | 02 - WIP|
```

**Result Set 2 — Metadata:**
```
| TotalRows |
|-----------|
| 3         |
```

---

## Why

1. **This is the second half of every form page.** The main grid (top) shows the master records. The detail grid (bottom) shows child records for the selected row. Without this, the detail area is empty.

2. **It must be generic.** The frontend has ONE `DetailGridComponent` — it renders any detail tab for any form. The procedure must accept a FormID and parent ObjNo and return the appropriate columns and rows dynamically, just like `ReadNewERM` does for the main grid.

3. **Every parent form has different detail tabs.** Stakeholders have Addresses, Documents, Accounts, etc. Products might have Sub-Products, Fees, etc. The tab list must come from the database — not be hardcoded in the frontend.

4. **The data exists.** There are 32,820 address records, 23,046 related party records, etc. all linked via `HiLev`. We just need a procedure to serve them with proper columns.

5. **The old system does this already.** The screenshot shows the exact behavior we need to replicate. The data and relationships are all in the `obj` table — we just need a clean procedure to expose them.

---

## Example Procedures (for reference)

Theo, here's one possible approach. You know the DB structure better — adjust as needed.

### ReadDetailTabs

```sql
DELIMITER $$
CREATE PROCEDURE `ReadDetailTabs`(
    IN ParentFormID INT
)
BEGIN
    -- Returns which detail tabs apply to a parent form.
    -- This might be based on:
    --   1. A config stored somewhere (form-to-detail mapping)
    --   2. Looking up which child ObjTypeNos exist under the parent's ObjTypeNo
    --   3. A new mapping if no config exists
    --
    -- For now, return all 826-type forms whose L5 (child type) 
    -- matches something found under the parent form's L4 (main type)
    
    DECLARE parentType INT;
    SELECT L4 INTO parentType FROM obj WHERE ObjNo = ParentFormID AND ObjTypeNo = 826;
    
    -- Find detail forms that serve children of this parent type
    -- Theo: adjust this logic based on how the old system determines available tabs
    SELECT 
        df.ObjNo AS DetailFormID,
        df.ObjDescr AS TabName,
        df.ObjCode AS Code,
        df.ObjQty3 AS SortOrder
    FROM obj df
    WHERE df.ObjTypeNo = 826
      AND df.L5 != parentType   -- Not the same type as parent
      AND EXISTS (
          SELECT 1 FROM obj child 
          WHERE child.ObjTypeNo = df.L5 
          AND child.HiLev IN (
              SELECT ObjNo FROM obj WHERE ObjTypeNo = parentType LIMIT 1
          )
      )
    ORDER BY df.ObjQty3, df.ObjNo;
END$$
DELIMITER ;
```

### ReadDetailData

```sql
DELIMITER $$
CREATE PROCEDURE `ReadDetailData`(
    IN DetailFormID INT,
    IN ParentObjNo INT,
    IN PageNumber INT,
    IN PageSize INT
)
BEGIN
    -- Uses the same L4 column-definition logic as ReadNewERM
    -- but filters by HiLev = ParentObjNo
    -- 
    -- DetailFormID tells us:
    --   L4 = column definition set → what columns to display
    --   L5 = child ObjTypeNo → what records to query
    --
    -- Then: SELECT <dynamic columns> FROM obj 
    --        WHERE HiLev = ParentObjNo AND ObjTypeNo = <L5>
    --        LIMIT PageSize OFFSET (PageNumber-1)*PageSize
    
    -- Theo: this should work similarly to ReadNewERM's dynamic SQL,
    -- but with the added HiLev filter.
    -- Consider reusing ReadNewERM's column-building logic.
    
    SET @offset = (IFNULL(PageNumber, 1) - 1) * IFNULL(PageSize, 50);
    SET @limit = IFNULL(PageSize, 50);
    
    -- Placeholder: Theo to implement the dynamic column logic here
END$$
DELIMITER ;
```

---

## Notes

- The key principle is `HiLev = ParentObjNo` — that's how parent→child relationships work in the `obj` table.
- Each detail form (ObjTypeNo=826) has L4 (column defs) and L5 (child record type) which together define what to query and how to display it.
- The column-building logic should reuse whatever `ReadNewERM` does with L4 — no need to reinvent that.
- Pagination is important here too — some parents have hundreds of child records.
- The detail tab list might need to be configurable per form. If there's no existing config in the DB, we may need to create one (even a simple mapping table).
- This procedure should be **generic** — one call works for any parent form, any detail tab. No hardcoded tab lists in the frontend.
- The existing specific procedures (`ReadAccount`, `ReadDocuments`, etc.) may become obsolete once this is done — or they could be kept as fallbacks.
