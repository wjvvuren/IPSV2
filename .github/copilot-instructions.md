# Copilot Instructions

**Before doing anything, you MUST read and follow the rules in these files:**

1. **[PROJECT_RULES.md](../PROJECT_RULES.md)** — Architecture, conventions, and constraints.
2. **[GETTING_STARTED.md](../GETTING_STARTED.md)** — Environment setup, database access, project structure.
3. **[docs/api-contract.md](../docs/api-contract.md)** — All documented API endpoints.
4. **[docs/backend-requests.md](../docs/backend-requests.md)** — Pending requests for the backend/SQL developer.

These files are the single source of truth for this project. If anything conflicts, PROJECT_RULES.md wins.

## Key Reminders

- **No data manipulation in Angular** — Angular only displays and sends data.
- **All components must be standalone and generic/reusable.**
- **All HTTP calls go through `ApiService`** — never use `HttpClient` directly.
- **Every endpoint must be documented in `docs/api-contract.md` before use.**
- **If the API returns wrong data, do NOT fix it in Angular** — document a request in `docs/backend-requests.md`.
- **Never hardcode URLs, ports, or credentials.**
- **The Dev Panel must show every API call.**
- **Read `docs/api-contract.md` and `docs/backend-requests.md` before making changes.**
- **Database:** MySQL at `192.168.36.35:3306`, database `Bank01`. Use the VS Code database plugin to browse procedures/tables. Angular NEVER talks to the database directly — all data flows through the .NET API calling stored procedures.
