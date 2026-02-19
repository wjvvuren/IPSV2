# 003 — Procedure for Application Navigation / Module Menu (with children)

**Date:** 2026-02-18
**Status:** ⚠️ Created — needs FormID fix from Theo
**Priority:** 🔴 High
**Assigned to:** Theo

---

## What I Need

A stored procedure that returns the **entire navigation tree** — the top-level modules (Home, Strategy, Planning, Stakeholders, etc.) **and their children** (sub-menu items) — so the frontend can build the navigation dynamically from the database.

There is currently **no procedure** that does this. The existing `ReadObj` is a general-purpose reader — not designed for a menu (it returns JSON blobs, no hierarchy awareness, no ordering by display sequence).

**Important:** This procedure must **also include the ERM children** (the forms under the ERM module). That way we don't need a separate procedure for the ERM form list — everything comes through in one call. This replaces the need for request 001 (which has been merged into this one).

### What the old system shows (from screenshot)

The top nav bar has these modules in order:
> Home · Strategy · Planning · Stakeholders · Members · Operations · Stock · Assets · HR · Banking · Savings · Loans · Accounting · Compliance · Reports · Documents · Setup · System · ERM

Each module has dropdown sub-menu items (e.g. Stakeholders → All Stakeholders, Entities, Employees, Groups, Customers, Company, Suppliers, Partners, Associations & Bodies).

The **ERM** module has its own children — these are the ERM forms (Stakeholder, Product, Business Process, Resource, etc.) that each have a `FormID` used to call `ReadNewERM`.

---

## Database Structure (already discovered)

### Top-level modules (Level 1)

All stored in the `obj` table with `HiLev = 3000000` and `ObjTypeNo = 153`:

| ObjNo | ObjCode | ObjComments | ObjQty3 (Sort) | ObjStatusNo | ObjGenCode (Icon) |
|-------|---------|-------------|-----------------|-------------|-------------------|
| 3002338 | Strategy | Strategy Management | 100 | 17 (Active) | `fa fa-cubes` |
| 3000542 | Planning | Product Management | 150 | 17 | `fa-solid fa-list` |
| 3000269 | Stakeholders | Stakeholder Management | 200 | 17 | `fa-solid fa-list` |
| 3002633 | Technology | Technology Management | 200 | **16 (Inactive)** | |
| 3002631 | Resource Requirements | Business Plan | 250 | **16 (Inactive)** | |
| 3000294 | Operations | Process Management | 250 | 17 | `fa-solid fa-list` |
| 3000781 | Setup | SetupMaster | 300 | 17 | |
| 3000782 | Stock | Logistic Management | 310 | 17 | |
| 3002632 | Members | Market/Customer Management | 350 | 17 | `fa-solid fa-list` |
| 3000551 | Documents | Document Management | 450 | 17 | |
| 3002639 | Assets | Maintenance management | 500 | 17 | |
| 3000546 | Banking | Banking Management | 500 | 17 | |
| 3002636 | HR | HR/Training Management | 550 | 17 | |
| 3003623 | Savings | | 620 | 17 | `fa-solid fa-list` |
| 3003624 | Loans | | 630 | 17 | |
| 3000121 | Accounting | Financial Management | 650 | 17 | |
| 3002635 | Debtor/Creditor | Debtor/Creditor Management | 670 | **16 (Inactive)** | |
| 3002638 | Compliance | Quality management | 700 | 17 | |
| 3002634 | Reports | Management Reporting | 750 | **16 (Inactive)** | |
| 3002637 | Communication | Communication Management | 800 | **16 (Inactive)** | |
| 3000763 | User Banking | UserBanking | 850 | **16 (Inactive)** | |
| 3000002 | System | System Management | 970 | 17 | |
| 3003721 | ERM | | 980 | 17 | |

**Sorting:** `ObjQty3` is the display order (100 → Strategy first, 980 → ERM last).
**Active/Inactive:** `ObjStatusNo = 17` = active (visible), `16` = inactive/hidden.

### Sub-menu items (Level 2) — Regular modules

Children are found via `HiLev = <parent ObjNo>`. Example for Stakeholders (`ObjNo = 3000269`):

| ObjNo | ObjCode | ObjTypeNo | HiLev |
|-------|---------|-----------|-------|
| 3000270 | All Stakeholders | 2139 | 3000269 |
| 3000536 | Entities | 2139 | 3000269 |
| 3000537 | Employees | 2139 | 3000269 |
| 3000539 | Groups | 2139 | 3000269 |
| 3000722 | Customers | 2139 | 3000269 |
| 3000735 | Company | 2139 | 3000269 |
| 3000736 | Suppliers | 2139 | 3000269 |
| 3001323 | Partners | 2139 | 3000269 |
| 3001615 | Associations & Bodies | 2139 | 3000269 |

Sub-items use `ObjTypeNo = 2139` (different from the parent's 153).

### Sub-menu items (Level 2) — ERM Children (Special case)

The ERM module (`ObjNo = 3003721`) has 26 nav items under `HiLev = 3003721`. These nav items have `ObjCode` values like "Stakeholder", "Product", etc. Each one maps to a **FormID** — a separate `obj` row with `ObjTypeNo = 826` and the same `ObjCode`.

The mapping works like this:
```
nav item (HiLev=3003721)  →  ObjCode = "Stakeholder"
form definition (ObjTypeNo=826)  →  ObjCode = "Stakeholder"  →  ObjNo = 3002443 (= FormID)
```

The FormID is needed so the frontend knows which `ReadNewERM(FormID, ...)` to call.

**Known ERM form mappings:**

| Nav ObjCode | FormID (ObjNo where ObjTypeNo=826) | Rows in ReadNewERM |
|-------------|------------------------------------|--------------------|
| Stakeholder | 3002443 | 10,986 ✅ |
| Account | 3000743 | 10,979 ✅ |
| Product | 3003751 | 0 ✅ |
| Business Process | 3004196 | 0 ✅ |
| Resource | 3000825 | ❌ 500 error |
| Bank Transaction | 3000152 | ❌ 500 error |
| Journals | 3000214 | ❌ 500 error |
| Equipment | 3000908 | ❌ 500 error |
| Look-ups | 3001603 | 0 ✅ |
| Share Register | 3003754 | 0 ✅ |
| Related Party | 3003752 | 0 ✅ |
| Addresses | 3000650 | 0 ✅ |
| Documents | 3001488 | 0 ✅ |
| Account Setup | 3003725 | 0 ✅ |
| Specific Fees | 3004095 | 0 ✅ |
| General Ledgers | 3003744 | 0 ✅ |
| Sub-Product | 3003756 | 0 ✅ |
| Sub-Product Detail | 3004120 | 0 ✅ |
| Global Fees | 3003745 | 0 ✅ |
| Master Tasks | 3001231 | 0 ✅ |

*(The 500 errors are a separate issue — see request [002](002-readnewerm-fixes-pagination.md))*

---

## Proposed Endpoint

`GET /api/navigation`

## Proposed Procedure Name

`ReadNavigation`

## Expected Request

```
CALL ReadNavigation();
```

No parameters needed — it should return the entire tree in one call.

## Desired JSON Response (REQUIRED)

> **This is the contract.** The .NET API must return this exact shape so `NavigationService` can build the top nav bar dynamically.

```json
{
  "success": true,
  "data": {
    "modules": [
      {
        "ObjNo": "3002338",
        "Code": "Strategy",
        "Name": "Strategy",
        "Description": "Strategy Management",
        "Icon": "fa fa-cubes",
        "SortOrder": "100.000",
        "StatusNo": "17",
        "IsActive": "1"
      },
      {
        "ObjNo": "3000269",
        "Code": "Stakeholders",
        "Name": "Stakeholders",
        "Description": "Stakeholder Management",
        "Icon": "fa-solid fa-list",
        "SortOrder": "200.000",
        "StatusNo": "17",
        "IsActive": "1"
      },
      {
        "ObjNo": "3003721",
        "Code": "ERM",
        "Name": "Files ERM",
        "Description": "",
        "Icon": "",
        "SortOrder": "980.000",
        "StatusNo": "17",
        "IsActive": "1"
      }
    ],
    "children": [
      {
        "ObjNo": "3000270",
        "Code": "All Stakeholders",
        "Name": "All Stakeholders",
        "ParentObjNo": "3000269",
        "ObjTypeNo": "2139",
        "SortOrder": "10.000",
        "StatusNo": "17",
        "FormID": null
      },
      {
        "ObjNo": "3004191",
        "Code": "Stakeholder",
        "Name": "ERM",
        "ParentObjNo": "3003721",
        "ObjTypeNo": "2139",
        "SortOrder": "100.000",
        "StatusNo": "17",
        "FormID": "3002443"
      }
    ]
  },
  "error": null,
  "timestamp": "2026-02-19T10:00:00Z"
}
```

### How Angular Will Use This

| Field | Angular Component | What It Does |
|-------|------------------|-------------|
| `modules` | `NavBarComponent` | Renders top-level nav tabs, sorted by `SortOrder`, filtered by `IsActive` |
| `modules[].Icon` | `NavBarComponent` | Renders FontAwesome icon next to module name |
| `children` | `NavBarComponent` | Renders dropdown menus, grouped by `ParentObjNo` |
| `children[].FormID` | `NavBarComponent` | For ERM children: navigates to `/form/:FormID`. For regular children: `null` |

## Legacy Table Format (for reference)

Theo, ideally this returns **two result sets** in one call:

**Result Set 1 — Top-level modules:**
```
| ObjNo   | Code         | Name         | Description            | Icon            | SortOrder | IsActive |
|---------|--------------|--------------|------------------------|-----------------|-----------|----------|
| 3002338 | Strategy     | Strategy     | Strategy Management    | fa fa-cubes     | 100       | 1        |
| 3000542 | Planning     | Planning     | Product Management     | fa-solid fa-list| 150       | 1        |
| 3003721 | ERM          | Files ERM    |                        |                 | 980       | 1        |
```

**Result Set 2 — ALL children (for every module, including ERM with FormID):**
```
| ObjNo   | Code              | Name               | ParentObjNo | SortOrder | ObjTypeNo | FormID  |
|---------|-------------------|--------------------|-------------|-----------|-----------|---------|
| 3000270 | All Stakeholders  | All Stakeholders   | 3000269     | 1         | 2139      | NULL    |
| ...     | Stakeholder       | Stakeholder        | 3003721     | 1         | (nav type)| 3002443 |
```

The **FormID** column is only relevant for ERM children. For regular sub-items it will be `NULL`.

The frontend will use `ParentObjNo` to group children under their parent module, and the `FormID` to make `ReadNewERM` calls for ERM items.

---

## Why

1. **The navigation is the foundation of the app** — without it, we can't build the top-level module menu that the old system has.
2. **The data is already there** (`obj` table, `HiLev` hierarchy, `ObjQty3` for ordering) — it just needs a procedure to expose it cleanly.
3. **ERM forms are also children** of the navigation tree. By including them here, we don't need a separate procedure for the ERM form list. One call, get everything. More efficient and the frontend logic becomes simpler.
4. **Active/Inactive filtering** — some modules are marked as `ObjStatusNo = 16` (inactive). The procedure should include the status so the frontend can decide what to show.

## Example Procedure (for reference)

Theo, here's an example of how this could work. You know the database better, so feel free to adjust:

```sql
DELIMITER $$

CREATE PROCEDURE `ReadNavigation`()
BEGIN
    -- ==========================================
    -- Result Set 1: Top-level modules
    -- ==========================================
    SELECT
        ObjNo,
        ObjCode     AS Code,
        CASE
            WHEN ObjDescr != '' THEN ObjDescr
            ELSE ObjCode
        END         AS Name,
        ObjComments AS Description,
        ObjGenCode  AS Icon,
        ObjQty3     AS SortOrder,
        ObjStatusNo AS StatusNo,
        CASE WHEN ObjStatusNo = 17 THEN 1 ELSE 0 END AS IsActive
    FROM obj
    WHERE HiLev = 3000000
    ORDER BY ObjQty3, ObjNo;

    -- ==========================================
    -- Result Set 2: ALL children of ALL modules
    -- Including ERM forms with their FormID!
    -- ==========================================
    SELECT
        child.ObjNo,
        child.ObjCode   AS Code,
        CASE
            WHEN child.ObjDescr != '' THEN child.ObjDescr
            ELSE child.ObjCode
        END             AS Name,
        child.HiLev     AS ParentObjNo,
        child.ObjTypeNo,
        child.ObjQty3   AS SortOrder,
        child.ObjStatusNo AS StatusNo,
        -- For ERM children: join to the form definition to get the FormID
        -- For regular children: FormID will be NULL
        form.ObjNo      AS FormID
    FROM obj child
    INNER JOIN obj parent
        ON child.HiLev = parent.ObjNo
        AND parent.HiLev = 3000000
    LEFT JOIN obj form
        ON form.ObjCode = child.ObjCode
        AND form.ObjTypeNo = 826
        AND child.HiLev = 3003721   -- Only do the FormID lookup for ERM children
    ORDER BY child.HiLev, child.ObjQty3, child.ObjNo;
END$$

DELIMITER ;
```

**How it works:**
- Result Set 1 returns all top-level modules, sorted by `ObjQty3`.
- Result Set 2 returns **all** children of all modules, with a `ParentObjNo` so the frontend can group them.
- The `LEFT JOIN` to `form` does the FormID lookup, but **only** for ERM children (`child.HiLev = 3003721`). For all other modules' children, `FormID` will be `NULL`.
- The frontend groups children by `ParentObjNo` and uses the `FormID` for ERM items to call `ReadNewERM(FormID, ...)`.

## Notes

- Root parent `ObjNo = 3000000` does not exist as a row in `obj` — it's a virtual root.
- Top-level modules use `ObjTypeNo = 153`, regular sub-items use `ObjTypeNo = 2139`, ERM forms use `ObjTypeNo = 826`.
- `ObjQty3` is the display sort order. Items with `ObjQty3 = 0` should either use their `ObjNo` as a fallback or be given a sort value.
- `ObjStatusNo = 17` = active/visible, `ObjStatusNo = 16` = inactive/hidden. The old system shows 19 modules; the DB has 23 — the extras (Technology, Resource Requirements, Communication, User Banking, Debtor/Creditor, Reports) are `StatusNo = 16`.
- `ObjGenCode` stores FontAwesome icon classes (e.g. `fa fa-cubes`, `fa-solid fa-list`). Not all modules have icons.
- The ERM module (`ObjNo = 3003721`) has 26 nav items. The FormID mapping works via `ObjCode` match to `ObjTypeNo = 826` rows.
- **This procedure replaces the need for a separate `ReadERMForms` procedure** — everything comes through in one call.
- Thanks Theo! Let us know if you have questions. 🙏

---

## ⚠️ UPDATE — 2026-02-19: Procedure Created, but FormID mapping is WRONG

### What was done

The `ReadNavigation` procedure has been **created in the database** using the example SQL above. It works and returns data. The .NET API endpoint `GET /api/navigation` is live and the Angular frontend now renders the **top navbar** dynamically from database data. *(Sidebar was removed — the app uses a single top nav bar with dropdown menus.)*

### What works
- ✅ **Result Set 1 (modules)** — All 23 top-level modules return correctly with Code, Name, Description, Icon, SortOrder, StatusNo, IsActive
- ✅ **Result Set 2 (children)** — All regular module children return correctly with ParentObjNo for grouping
- ✅ **Sorting** — Both modules and children sort correctly by ObjQty3
- ✅ **Active/Inactive filtering** — Frontend filters `IsActive = 0` modules from the nav

### What is BROKEN — ERM FormID mapping

The `LEFT JOIN` that maps ERM children to their FormID is **producing wrong results**:

| ERM Child Code | Expected FormID | What the JOIN Returns | Problem |
|---|---|---|---|
| Stakeholder | 3002443 | 803, 3003755 | **Wrong values + duplicate row** |
| Resource | 3000825 | 11, 3003753 | **Wrong values + duplicate row** |
| Documents | 3001488 | 654, 3003742 | **Wrong values + duplicate row** |
| Account | 3000743 | 2082 | **Wrong value** |
| Journals | 3000214 | 3052, 100624, 3003747 | **Wrong values + 3 duplicate rows** |
| Equipment | 3000908 | 28, 3003743 | **Wrong values + duplicate row** |
| Business Process | 3004196 | NULL | **Missing** |
| Look-ups | 3001603 | NULL | **Missing** |
| Share Register | 3003754 | NULL | **Missing** |
| Related Party | 3003752 | NULL | **Missing** |

**Root cause:** The JOIN `form.ObjCode = child.ObjCode AND form.ObjTypeNo = 826` matches **multiple rows** because several `ObjTypeNo = 826` records share the same `ObjCode`. The correct FormIDs (3002443 for Stakeholder, 3000743 for Account, etc.) come from a different mapping — not just a simple ObjCode match.

### What the frontend does as a workaround

The Angular `NavigationService` currently has a **hardcoded FormID override map** to use the correct values until this is fixed:

```typescript
private readonly FORM_ID_OVERRIDES: Record<string, number> = {
  'Stakeholder': 3002443,
  'Account': 3000743,
  'Product': 3003751,
  // ... etc
};
```

### Theo: What we need

1. **Fix the FormID JOIN** in `ReadNavigation` so each ERM child returns exactly **one row** with the **correct FormID**
2. The correct FormIDs are the ones we've been using successfully with `ReadNewERM` — they are the `ObjNo` values from `obj` where the ERM form definition lives
3. Once fixed, we can remove the hardcoded override map from the frontend

**Hint:** The ERM nav items (HiLev=3003721) might be linked to their FormID through a relationship table or a specific ObjTypeNo that we haven't found yet. The current simple `ObjCode` match to `ObjTypeNo = 826` is not the right approach — it produces multiple matches and wrong values.
