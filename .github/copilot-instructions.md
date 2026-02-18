# Copilot Instructions

**Before doing anything, you MUST read and follow the rules in [PROJECT_RULES.md](../PROJECT_RULES.md).**

That file is the single source of truth for this project's architecture, conventions, and constraints. If anything conflicts, PROJECT_RULES.md wins.

## Key Reminders

- **No data manipulation in Angular** — Angular only displays and sends data.
- **All components must be standalone and generic/reusable.**
- **All HTTP calls go through `ApiService`** — never use `HttpClient` directly.
- **Every endpoint must be documented in `docs/api-contract.md` before use.**
- **If the API returns wrong data, do NOT fix it in Angular** — document a request in `docs/backend-requests.md`.
- **Never hardcode URLs, ports, or credentials.**
- **The Dev Panel must show every API call.**
- **Read `docs/api-contract.md` and `docs/backend-requests.md` before making changes.**
