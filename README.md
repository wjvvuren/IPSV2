# IPSV2

Full-stack application with an Angular frontend and .NET Web API backend.

## Structure

```
IPSV2/
  backend-dotnet/   # .NET 10 Web API
  frontend/         # Angular 18 SPA
  .vscode/          # Shared VS Code config (launch, tasks, peacock)
```

## Quick Start

### Backend (.NET)
```bash
cd backend-dotnet/IpsApi
dotnet watch run
```
API runs at **http://localhost:5224** (Swagger at `/swagger`).

### Frontend (Angular)
```bash
cd frontend
npm start
```
App runs at **http://localhost:4200**.

## VS Code

- Open the root folder or use one of the `.code-workspace` files.
- **F5** or use the launch configurations to start either stack.
- Chrome launch configs are included for debugging both frontend and backend Swagger.

### Workspace files
| File | Peacock Color | Purpose |
|------|--------------|---------|
| `IPSV2.code-workspace` | Orange-Red | Full stack |
| `IPSV2-backend.code-workspace` | Green | Backend only |
| `IPSV2-frontend.code-workspace` | Purple | Frontend only |
