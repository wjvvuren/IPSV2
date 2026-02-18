# IPSV2 — Database Architecture & AI Guide

> **For any AI agent or developer working on this project.**
> Read this BEFORE writing any SQL, creating any procedure, or building any API endpoint.

---

## 1. The "Everything is an Obj" Architecture

This system is built on a **single master table called `obj`**. It is NOT a traditional normalized relational database. Instead, it follows a **generic object pattern** where one table stores all entity types (stakeholders, accounts, tasks, products, etc.) distinguished by a `ObjTypeNo` column.

### Think of it this way:
- The `obj` table is like a **universal record** — every row is "something" in the system.
- What that "something" IS depends on `ObjTypeNo`.
- The same columns (`L1` through `L102`, `ObjQty1` through `ObjQty3`) mean **different things** depending on the `ObjTypeNo`.

### This means:
- A Stakeholder (ObjTypeNo = 803) uses `L7` for "SA Residence"
- An Account (ObjTypeNo = 7660) might use `L7` for something completely different
- **You cannot assume what a column means without knowing the ObjTypeNo**

---

## 2. Core Tables

### 2.1 — `obj` (The Master Table)

This is where ~95% of all data lives. Every entity in the system is a row here.

| Column | Type | Purpose |
|--------|------|---------|
| `ObjNo` | int (PK) | Unique record ID |
| `ObjCode` | varchar(40) | Short code / identifier |
| `ObjDescr` | varchar(254) | Description / name |
| `ObjTypeNo` | int | **What kind of record this is** (FK to another obj row) |
| `ObjStatusNo` | int | Status (FK to another obj row) |
| `ObjEntityNo` | int | Entity reference (FK to another obj row) |
| `ObjComments` | varchar(254) | Free-text comments |
| `ObjGenCode` | varchar(40) | General-purpose code (e.g., ID number) |
| `ObjDateTimeActual` | datetime | Last updated / actual date |
| `ObjDateTimeReq` | datetime | Requested date (e.g., date of birth) |
| `ObjDateTimeTo` | datetime | End date |
| `ObjDateTime` | datetime | Created date |
| `L1` - `L9` | int | **Lookup fields** — point to other `obj.ObjNo` values |
| `L100` - `L102` | int | **More lookup fields** |
| `ObjQty1` - `ObjQty3` | decimal(14,3) | Quantity/amount fields (sometimes used as lookups!) |
| `HiLev` | int | Parent/owner record (FK to another obj row) |

**Critical understanding:** The `L1`-`L102` columns and `ObjQty1`-`ObjQty3` columns are **generic**. Their meaning changes per `ObjTypeNo`. For a Stakeholder (803):
- `L1` = Individual/Business type
- `L2` = Gender
- `L4` = Title
- `L7` = SA Residence
- `ObjQty3` = User ID (stored as decimal, but actually an ObjNo lookup!)

### 2.2 — `obj2` (Extended Record Table)

Mirror structure of `obj` with `2` suffix on all columns. Used for additional data on the same record. Same generic pattern applies.

### 2.3 — `answer` (Free-Form Field Data)

For data that doesn't fit into the fixed `obj` columns, the `answer` table provides unlimited key-value storage per record.

| Column | Type | Purpose |
|--------|------|---------|
| `ObjNo` | int (PK part) | Which obj record this belongs to |
| `AnswerNo` | int (PK part) | The field identifier (e.g., 317 = Initials, 318 = Full Names) |
| `AnswerValue` | decimal(13,2) | Numeric value |
| `AnswerComment` | varchar(2048) | Text value (most commonly used) |

**Known AnswerNo values for Stakeholder (803):**
| AnswerNo | Meaning |
|----------|---------|
| 317 | Initials |
| 318 | Full Names |
| 319 | Surname |
| 320 | Nickname / Trade As |
| 321 | Cell / Phone |
| 605 | Finch Reference No |

### 2.4 — `linkfile` (Relationships Between Records)

Links two `obj` records together with a relationship type, dates, and quantities.

| Column | Type | Purpose |
|--------|------|---------|
| `LinkObjNo` | int (PK) | The link record ID |
| `LinkObjTypeNo` | int | What type of relationship this is |
| `LinkObjFromNo` | int | Source obj record |
| `LinkObjToNo` | int | Target obj record |
| `LinkObjDateFrom` | date | Relationship start date |
| `LinkObjDateTo` | date | Relationship end date |
| `LinkObjStatusNo` | int | Link status |
| `LinkObjQty` | decimal(14,4) | Primary quantity (e.g., share count) |
| `LinkObjectCode` | varchar(40) | Link code |

### 2.5 — `objvar` (Variable Fields)

Extra field data per record, identified by field type number.

| Column | Type | Purpose |
|--------|------|---------|
| `ObjVarNo` | int (PK part) | Which obj record |
| `ObjVarFieldTypeNo` | int (PK part) | Which field type |
| `ObjVarData` | varchar(254) | The value |

### 2.6 — `wwp_form*` Tables (Web Forms System)

A separate form definition system:
- `wwp_form` — Form definitions (ID, title, version)
- `wwp_formelement` — Fields within a form (type, order, metadata)
- `wwp_forminstance` — A filled-in form (who filled it, when)
- `wwp_forminstanceelement` — Individual field values in an instance

---

## 3. Key Entity Types (ObjTypeNo)

| ObjTypeNo | Name | Record Count | Description |
|-----------|------|-------------|-------------|
| 803 | StakeHolder | ~11,000 | People and businesses — the central entity |
| 4767 | BankAccNew | ~11,000 | Bank accounts |
| 7660 | AccountsBank | ~377 | Account types/groupings |
| 4699 | BankTransExt | ~146,000 | Bank transactions (external) |
| 7332 | BankTrVirtual | ~19,000 | Virtual bank transactions |
| 14504 | ShareAllocation | ~940 | Share allocations |
| 5713 | MemberShares | ~886 | Member share holdings |
| 20257 | Activities | ~13,000 | Activity records |
| 4744 | AddressBank | ~33,000 | Addresses |
| 826 | Forms | ~652 | Form definitions (the ERM system) |
| 840 | FormFields | ~1,187 | Field definitions for forms |
| 130 | Fields | ~6,865 | System field definitions |
| 53 | New Member | ~532 | Member onboarding records |
| 4860 | IdNos | ~1,133 | Identity numbers |
| 4866 | Qualification | ~547 | Qualifications |

---

## 4. How the "Self-Referencing" Lookup Works

Almost every integer column in `obj` is a **foreign key back to `obj` itself**. When a stored procedure needs to show readable data, it does:

```sql
-- Instead of showing L7 = 400052 (meaningless number)
-- It resolves the lookup:
(SELECT ObjCode FROM bank01.obj WHERE ObjNo = o.L7) AS "SA Residence"
-- This returns "Yes" or "No" or whatever the code record says
```

This pattern is EVERYWHERE. The system is entirely self-referencing.

### The Resolution Display Options
When resolving a lookup, there are three possible display fields:
1. `ObjCode` — Short code (e.g., "Mr", "Yes", "Active")
2. `ObjGenCode` — Alternative code
3. `ObjDescr` — Full description (e.g., "Mister", "South African Resident")

The `ReadERM` procedure uses magic numbers to determine which to show:
- `1834` = show ObjCode
- `4023` = show ObjGenCode
- `1835` = show ObjDescr

---

## 5. The ERM (Entity Relationship Model) System

The ERM system is the most important concept. It is a **metadata-driven dynamic form system** that lives inside the `obj` table itself.

### How it works:
1. A "Form" record (ObjTypeNo = 826) defines a form by its ObjNo (the `FormID`)
2. Child records under that form (where `HiLev = FormID`) define the **field labels** and **display rules**
3. Each child record's `L7` column indicates which `obj` column it configures (using magic numbers like 400224 = ObjNo, 400225 = ObjCode, etc.)
4. The child record's `ObjDescr` becomes the **column/field label** shown in the UI
5. The child record's `L1` and `L5` control how lookup values are resolved

### Column Mapping (L7 values in form field definitions):

| L7 Value | Maps to `obj` Column | Example Label |
|----------|---------------------|---------------|
| 400224 | ObjNo | "No" |
| 400225 | ObjCode | "Code" |
| 400226 | ObjDescr | "Name" |
| 400227 | ObjTypeNo | "Type" |
| 400228 | ObjStatusNo | "Status" |
| 400229 | ObjEntityNo | "Entity" |
| 400230 | ObjComments | "Comments" |
| 400370 | ObjGenCode | "ID Number" |
| 400401 | L1 | (varies per form) |
| 400402 | L2 | (varies per form) |
| 400403 | L3 | (varies per form) |
| ... | ... | ... |
| 400412 | L102 | (varies per form) |
| 400413 | ObjQty1 | (varies per form) |
| 400414 | ObjQty2 | (varies per form) |
| 400415 | ObjQty3 | (varies per form) |
| 400416 | ObjDateTime | "Date Created" |
| 400417 | HiLev | "Owner" |
| 400427 | ObjDateTimeReq | "Date of Birth" |
| 400428 | ObjDateTimeActual | "Last Updated" |
| 400429 | ObjDateTimeTo | "Date To" |
| 317 | Answer 317 | "Initials" |
| 318 | Answer 318 | "Full Names" |
| 319 | Answer 319 | "Surname" |
| 320 | Answer 320 | "Nickname" |
| 321 | Answer 321 | "Cell" |

### Example: Stakeholder Form
The `ReadStakeholder` procedure builds this specific view of `obj` records where `ObjTypeNo = 803`:

```
No | Code | Identity Type | ID Number | SA Residence | Membership Type |
Individual/Business | Business Type | Name | Nickname | Title | Initials |
Full Names | Surname | Date of Birth | Send Type | Cell | Marital Status |
Gender | Race | Area | Language | Discipline | Owner No | Last Updated |
User ID | Status | Manager | Finch Ref | Date Created | Date To
```

Every one of these "columns" is either a direct `obj` field or a resolved lookup through another `obj` record or an `answer` table value.

---

## 6. Existing Stored Procedures

| Procedure | Parameters | What It Does |
|-----------|-----------|--------------|
| `ReadStakeholder()` | none | Returns all stakeholders (ObjTypeNo=803) with resolved lookups |
| `ReadSingleStakeholder(StakeholderNo)` | int | Returns one stakeholder by ObjNo |
| `ReadERM(FormID, ObjTypeList, RequiredDate)` | int, varchar, date | **Dynamic form reader** — builds SQL dynamically based on form definition |
| `ReadNewERM(FormID, ObjTypeList, RequiredDate)` | int, varchar, date | Updated version of ReadERM |
| `ReadAccount()` | none | Returns all accounts |
| `ReadMember()` | none | Returns all members (ObjTypeNo=53) |
| `ReadSingleMember(MemberNo)` | int | Returns one member |
| `ReadShareRegister()` | none | Returns share register |
| `ReadTask()` | none | Returns tasks (ObjNo 100M-400M range) |
| `ReadTaskResources()` | none | Returns task resources |
| `ReadLinkFile(ObjFrom, ObjTo, ObjToNo, ObjType)` | int, int, int, varchar | Returns linked records with filters |
| `ReadLinkedAccounts()` | none | Returns linked account info |
| `ReadHierarchy(ObjTypeNo, HiLevel)` | int, int | Returns hierarchical data |
| `ReadProfiles()` | none | Returns profiles |
| `ReadProfileSetup()` | none | Returns profile configuration |
| `ReadBankTransaction()` | none | Returns bank transactions |
| `ReadDocuments()` | none | Returns documents |
| `ReadFolders()` | none | Returns folders |
| `ReadEnterpriseArchitecture()` | none | Returns EA data |
| `ReadEquipment()` | none | Returns equipment |
| `ReadSubProduct()` | none | Returns sub-products |
| `ReadSubProductDetail()` | none | Returns sub-product detail |
| `SaveDynamicRecord(ObjNo, ObjTypeNo, Values)` | int, int, JSON | **Saves/updates** an obj record with JSON key-value pairs |
| `CreateUpdateObjAnswer()` | (check params) | Creates or updates answer records |
| `DynamicFieldValues(...)` | (check params) | Returns dropdown/lookup values for form fields |
| `UpdateCounter()` | (check params) | Updates counter records |

---

## 7. Tips for the SQL Developer

### 7.1 — Procedure Naming Convention
Use this pattern for new procedures:
- `Read[EntityName]` — List all records of a type
- `ReadSingle[EntityName](ObjNo)` — Get one record by ObjNo
- `Save[EntityName](ObjNo, ObjTypeNo, Values)` — Create/update a record
- `Delete[EntityName](ObjNo)` — Soft-delete (set status)

### 7.2 — Always Return Human-Readable Columns
Don't return raw `L1 = 10319`.  Always resolve lookups:
```sql
-- BAD: Angular gets a meaningless number
SELECT L1 FROM obj WHERE ObjNo = 35;
-- Result: 10319

-- GOOD: Angular gets readable text
SELECT (SELECT ObjCode FROM obj WHERE ObjNo = o.L1) AS "Individual/Business"
FROM obj o WHERE o.ObjNo = 35;
-- Result: "Individual"
```

### 7.3 — Return Both Raw ID and Display Value When Editing
For forms that need to EDIT data, the procedure should return BOTH:
```sql
SELECT
  L1 AS "IndividualBusiness_Id",      -- Raw ObjNo for saving back
  (SELECT ObjCode FROM obj WHERE ObjNo = o.L1) AS "IndividualBusiness_Label"  -- Display text
FROM obj o WHERE o.ObjNo = 35;
```
This way Angular can show the label but send back the ID when saving.

### 7.4 — Dropdown/Lookup Values
When a field is a lookup (e.g., Title, Gender, Status), provide a procedure that returns the valid options:
```sql
-- Return all valid options for a lookup field
SELECT ObjNo AS value, ObjCode AS label
FROM obj
WHERE ObjTypeNo = [the-type-that-holds-options]
ORDER BY ObjCode;
```

### 7.5 — Use Consistent Column Aliases
Column aliases become JSON property names in the Angular app. Keep them:
- **PascalCase** or **camelCase** (no spaces, no special characters)
- Consistent across procedures
- Descriptive but not too long

**Recommended aliases:**
| Instead of | Use |
|------------|-----|
| `"Individual/ Business"` | `"IndividualBusiness"` or `"individualBusiness"` |
| `"ID/ Registration Number"` | `"idNumber"` |
| `"Dicipline / Speciality"` | `"discipline"` |
| `"Nickname/ Trade As"` | `"nickname"` |

### 7.6 — The SaveDynamicRecord Pattern
The existing `SaveDynamicRecord` procedure accepts a JSON object with field names as keys. Angular sends:
```json
{
  "ObjCode": "JLO",
  "ObjDescr": "Mr Johan Louw",
  "L1": 10319,
  "Answer_317": "J",
  "Answer_318": "Johan Stephanus",
  "Answer_319": "Louw"
}
```
Follow this pattern for all save operations. It handles both `obj` columns and `answer` table entries.

### 7.7 — Always Include ObjNo in Results
Every result set MUST include `ObjNo` — Angular needs it to:
- Navigate to detail views
- Build edit URLs
- Send back to save endpoints

### 7.8 — Date Handling
- `ObjDateTimeReq` = Contextual date (e.g., date of birth for stakeholders)
- `ObjDateTimeActual` = Last modified timestamp
- `ObjDateTime` = Created timestamp
- `ObjDateTimeTo` = Expiry/end date
- Watch for the sentinel value `1000-01-01 00:00:00` which means "not set"

### 7.9 — The ReadERM Approach vs. Hardcoded Procedures
There are two approaches in the database:
1. **Hardcoded procedures** like `ReadStakeholder` — fast, explicit, but you need one per entity
2. **Dynamic ERM procedures** like `ReadERM` — flexible, metadata-driven, handles any form

For new forms, prefer the ERM approach. Only create hardcoded procedures when performance demands it.

---

## 8. What Angular Expects from the API

### 8.1 — List View Response
```json
[
  {
    "No": 35,
    "Code": "JLO",
    "Name": "Mr Johan Stephanus Louw",
    "IdNumber": "4911145128082",
    "Gender": "Male",
    "Status": "Active",
    ...
  },
  ...
]
```

### 8.2 — Single Record Response (for editing)
```json
{
  "No": 35,
  "ObjCode": "JLO",
  "ObjDescr": "Mr Johan Stephanus Louw",
  "ObjGenCode": "4911145128082",
  "L1": 10319,
  "L1_Label": "Individual",
  "L2": 400079,
  "L2_Label": "Male",
  "Answer_317": "JS",
  "Answer_318": "Johan Stephanus",
  "Answer_319": "Louw",
  ...
}
```

### 8.3 — Dropdown Options Response
```json
[
  { "value": 310, "label": "Mr" },
  { "value": 311, "label": "Mrs" },
  { "value": 312, "label": "Ms" },
  { "value": 314, "label": "Dr" }
]
```

### 8.4 — Save Request (Angular sends this)
```json
{
  "ObjNo": 35,
  "ObjTypeNo": 803,
  "Values": {
    "ObjCode": "JLO",
    "ObjDescr": "Mr Johan Stephanus Louw",
    "L4": 310,
    "Answer_318": "Johan Stephanus"
  }
}
```

---

## 9. Common Pitfalls

### 9.1 — Don't Confuse L-columns Across Entity Types
`L7` means "SA Residence" for stakeholders but could mean something entirely different for accounts. Always check the form definition for the specific `ObjTypeNo`.

### 9.2 — Qty Fields Are Sometimes Lookups
`ObjQty1`, `ObjQty2`, `ObjQty3` are decimal fields, but the stakeholder form uses `ObjQty3` as a lookup to a User ID (another obj record). The value `10002938.000` is actually an ObjNo.

### 9.3 — The ObjTypeNo is Also an ObjNo
The type identifier (e.g., 803 for Stakeholder) is itself a record in the `obj` table. You can look it up:
```sql
SELECT ObjCode, ObjDescr FROM obj WHERE ObjNo = 803;
-- Returns: "StakeHolder", "Stake Holder"
```

### 9.4 — Watch for Sentinel Dates
`1000-01-01 00:00:00` means "no date set". Angular should treat this as null/empty.

### 9.5 — HiLev is Parent, Not "Level"
`HiLev` means "Higher Level" — it's the parent record's ObjNo. It creates hierarchies within the same table.

---

## 10. For the AI Agent: How to Build a New ERM Form

When asked to create a new form (e.g., "Suppliers", "Products", "Branches"):

1. **Ask:** What is the `ObjTypeNo` for this entity?
2. **Ask:** What fields should be shown? (which L-columns, which answers, dates, etc.)
3. **Check:** Does a procedure already exist? (see Section 6)
4. **If not, request one** via `docs/backend-requests.md` with:
   - The ObjTypeNo to filter by
   - Which obj columns to include
   - Which answer fields to include
   - What the column labels should be
   - What lookup fields need dropdown options
5. **Then build** the Angular component using the generic form renderer
6. **Document** the endpoint in `docs/api-contract.md`

### Never do in Angular:
- Write SQL or call the database directly
- Reshape/transform data from the procedure
- Hardcode lookup values (always fetch from API)
- Build form fields manually (use schema-driven approach)

---

*Last updated: 2026-02-18*
