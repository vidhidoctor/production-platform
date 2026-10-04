# Production Platform — Material Calculation System

npm workspaces monorepo: `client/` (Vite + React + React Router 7 + TanStack Query), `server/`
(Express + Prisma + PostgreSQL), `shared/` (types + constants used by both sides).

## Commands (run from the repo root)
- `npm install` — installs every workspace
- `npm test` — calculation engine vs MATRIAL.xlsx (no DB needed)
- `npm run test:api` — end-to-end auth + RBAC tests against the DB (run `npm run db:seed` first)
- `npm run typecheck`
- `npm run db:migrate` / `npm run db:seed`
- `npm run dev` — API on http://localhost:4000
- `npm run dev:client` — app on http://localhost:5173 (Vite proxies /api to :4000)
- `npm run build` — type-checks and builds the client

## Structure
```
shared/                     "@pp/shared" — import as: import { MESSAGES } from "@pp/shared"
  types/                    DTOs: material, punching, production, report, auth, admin
  constants/                messages.ts (FRD validation messages), materials.ts (CORD_DIVISOR),
                            roles.ts (PERMISSIONS, ROLES, DEPARTMENTS)
server/
  prisma/                   schema.prisma, migrations/, seed.ts
  src/
    server.ts               only app.listen()
    app.ts                  express(), cors, json, /api routes, error handler
    routes.ts               mounts every module's router under /api
    config/env.ts           reads + validates .env (import `env`, never process.env)
    database/prisma.ts      the single PrismaClient
    middleware/             error-handler (AppError), async-handler, validate (Zod + schema
                            building blocks), auth (authenticate, requirePermission, guard)
    calculation/            PURE engine: engine.ts, types.ts, conversions/{sequence,bead,cord}
    modules/
      auth/                 signup, login, logout, me, forgot/reset password (+ auth.crypto.ts)
      users/                users, roles, permissions, departments (/api/admin/*)
      materials/            material master (= Punching Master consumption columns) + conversion rules; Admin-editable
      punching/             designs (parent record) and their components: Component + Size consumption
      production/           production orders + lines, per-order summary
      reports/              material + purchase requirements, reports (no repository)
  tests/
    api.test.ts             end-to-end API tests
    fixtures/sheet-fixture.ts   MATRIAL.xlsx data (engine test + seed)
client/src/
  main.tsx                  mounts <Providers><RouterProvider/></Providers>
  app/router.tsx            every page route + the permission it needs (same code the API checks)
  app/providers.tsx         TanStack Query client + AuthProvider
  app/layout/               AppLayout (sidebar from nav.ts, filtered by permissions), HomeRedirect
  api/client.ts             fetch wrapper: token header, ApiError, logout on 401, downloadFile
  lib/auth.tsx              AuthProvider, useAuth().can(...), RequireAuth, RequirePermission
  lib/format.ts             Intl.NumberFormat("en-IN"), dates (UTC)
  components/               DataGrid, Modal, ui.tsx (PageHeader, Field, ErrorAlert, QueryState, …)
  features/                 mirrors server modules: auth, punching, production, materials,
                            reports (also material + purchase requirement pages), users (admin)
  styles/global.css         design tokens (light + dark) and all styles
```

Every client feature has: `x.api.ts` (calls /api) → `x.hooks.ts` (useQuery / useMutation) →
`components/` → `XPage.tsx`.

Every server module has: `x.routes.ts` → `x.controller.ts` → `x.service.ts` → `x.repository.ts`,
plus `x.validation.ts` (Zod).

## Layer rules
```
routes → controller → service → repository → Prisma
                          ↓
                     calculation/
```
- **routes**: URL + `...guard("PERMISSION")` + `validate({ body/params/query })` + `asyncHandler(controller)`.
  Every route except `/api/auth/*` must have a `guard(...)`.
- **controller**: req/res only. No DB, no business logic.
- **service**: business rules. Never sees `req`/`res`. Throws `AppError(status, message)`.
- **repository**: the only place that imports `database/prisma.ts`.
- **calculation/**: never imports Prisma, Express or anything from `modules/`.
- **Modules** don't import each other's repositories — call the other module's service
  (e.g. reports → productionService, production → punchingService).
- **Types and messages** used by client and server live in `shared/`. Never copy them.
- **Client features** don't import from each other. Shared UI goes in `components/`, shared
  logic in `lib/` (e.g. `useAuth` lives in lib because every feature needs it).
- **Client access checks mirror the API**: a route uses `RequirePermission`, a button uses
  `can("CODE")`. These only hide things — the server is what actually enforces access.
- **Access is checked by permission code, never by role name.** New permissions go in
  `shared/constants/roles.ts`; the seed writes them to the DB.
- Money/quantity maths uses `decimal.js`; decimals travel over the API as strings.
- Create a folder only when its phase starts (e.g. `modules/purchases/` for rates and cost).

## Conventions
- TypeScript everywhere, ESM. Server + shared import specifiers end in `.js` (NodeNext);
  client imports have no extension (Vite / bundler resolution).
- Names and sizes are stored upper-case.
- New endpoint checklist: validation schema → route with guard → controller → service →
  repository (if it needs new queries) → a case in `tests/api.test.ts` → README API table.
