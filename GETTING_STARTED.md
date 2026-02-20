# IPSV2 — Getting Started

> Quick setup guide for new developers or agents.

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| .NET SDK | 10.0+ | `dotnet --version` |
| Angular CLI | 18.x | `ng version` |
| Git | any | `git --version` |
| VS Code | latest | — |

### Recommended VS Code Extensions

- Angular Language Service (`angular.ng-template`)
- C# Dev Kit (`ms-dotnettools.csdevkit`)
- Peacock (`johnpapa.vscode-peacock`)
- Prettier (`esbenp.prettier-vscode`)
- ESLint (`dbaeumer.vscode-eslint`)

---

## First-Time Setup

### 1. Clone

```bash
git clone https://github.com/wjvvuren/IPSV2.git
cd IPSV2
```

### 2. Backend (.NET API)

```bash
cd backend-dotnet/IpsApi
```

Create the `.env` file (ask the team for credentials — never commit this):

```env
# Database Configuration
DB_HOST=192.168.36.35
DB_PORT=3306
DB_NAME=Bank01
DB_USER=root
DB_PASSWORD=<ask team>

# API Configuration
API_HOST=0.0.0.0
API_PORT=8003
```

Restore and run:

```bash
dotnet restore
dotnet watch run
```

The API will start at **http://localhost:8003**.
Swagger UI at **http://localhost:8003/swagger**.

### 3. Frontend (Angular)

```bash
cd frontend
npm install
npm start
```

The app will start at **http://localhost:4200**.

#### Key Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|--------|
| Angular | 18.x | Core framework |
| PrimeNG | 17.x | UI component library (data tables, dialogs, menus, etc.) |
| PrimeIcons | 7.x | Icon library for PrimeNG |
| RxJS | 7.x | Reactive extensions |

---

## Running the Full Stack

### Option A: VS Code Tasks
- Press `Ctrl+Shift+B` → select **restart: full stack**
- This kills any running servers, starts the backend, then the frontend

### Option B: VS Code Launch (F5)
- Open the Run & Debug panel
- Select **Full Stack + Chrome** to start everything including a Chrome debugger

### Option C: Manual
Terminal 1:
```bash
cd backend-dotnet/IpsApi
dotnet watch run
```

Terminal 2:
```bash
cd frontend
npm start
```

---

## Project Structure

```
IPSV2/
├── PROJECT_RULES.md                 # ← READ THIS FIRST (mandatory)
├── GETTING_STARTED.md               # ← You are here
├── README.md                        # Project overview
├── .gitignore
│
├── backend-dotnet/                  # .NET Backend
│   ├── IpsApi.slnx                  # Solution file
│   └── IpsApi/
│       ├── .env                     # Local config (NOT in git)
│       ├── appsettings.json         # Default config
│       ├── Program.cs               # App startup
│       └── ...
│
├── frontend/                        # Angular Frontend
│   ├── package.json
│   ├── angular.json
│   ├── src/
│   │   ├── environments/            # API URL config
│   │   └── app/                     # Application code
│   └── ...
│
├── docs/                            # Living documentation
│   ├── api-contract.md              # All API endpoints
│   └── backend-requests.md          # Requests for SQL developer
│
└── .vscode/                         # VS Code config
    ├── launch.json                  # Debug configs (incl. Chrome)
    ├── tasks.json                   # Build/run tasks
    ├── settings.json                # Peacock colors
    └── extensions.json              # Recommended extensions
```

---

## Database Access

| Key | Value |
|-----|-------|
| **Host** | `192.168.36.35` |
| **Port** | `3306` |
| **Database** | `Bank01` |
| **Engine** | MySQL |

Connect using the VS Code database plugin to browse tables and stored procedures.
The `.env` file in `backend-dotnet/IpsApi/` has the credentials.

**Important:** The Angular frontend NEVER talks to the database directly. All data flows through the .NET API which calls stored procedures.

---

## Key URLs (Development)

| Service | URL |
|---------|-----|
| Angular App | http://localhost:4200 |
| .NET API | http://localhost:8003 |
| Swagger UI | http://localhost:8003/swagger |
| Health Check | http://localhost:8003/health |

---

## Before You Code

1. Read `PROJECT_RULES.md` — it's mandatory
2. Check `docs/api-contract.md` for existing endpoints
3. Check `docs/backend-requests.md` for pending backend work
4. Make sure your `.env` is in place and the API starts cleanly

---

## Troubleshooting

### Backend won't start
- Check `.env` exists in `backend-dotnet/IpsApi/`
- Check database is reachable: `ping 192.168.36.35`
- Check port 8003 isn't in use: `netstat -ano | findstr :8003`

### Frontend won't start
- Run `npm install` in `frontend/`
- Check port 4200 isn't in use

### Can't connect to database
- Verify credentials in `.env`
- Check firewall/VPN access to `192.168.36.35:3306`
- Try connecting via the VS Code database plugin first

---

*Last updated: 2026-02-19*
