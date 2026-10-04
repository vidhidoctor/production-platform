# Production Platform — Material Calculation System

## Setup
```bash
npm install                       # from the repo root: installs client + server + shared
cp server/.env.example server/.env   # set DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD
# no local Postgres? docker compose up -d
npm test                          # engine vs MATRIAL.xlsx — should pass 4/4
npm run db:migrate
npm run db:seed                   # Excel data, order 26-49, roles, permissions, departments, first Admin
npm run test:api                  # auth + permission tests against the DB — should pass 14/14
npm run dev                       # API on http://localhost:4000
npm run dev:client                # (second terminal) app on http://localhost:5173
```

Open http://localhost:5173 and log in with ADMIN_EMAIL / ADMIN_PASSWORD from `server/.env`.

## Access model
Every API except `/api/auth/*` needs `Authorization: Bearer <token>` (from login) and checks a
**permission**, never a role name. Roles are just named bundles of permissions (see
`shared/constants/roles.ts`), and Admin can change them at runtime.

| Role | Permissions |
|---|---|
| Admin | all |
| Punching Employee | PUNCHING_VIEW / CREATE / UPDATE |
| Production Employee | PRODUCTION_VIEW / CREATE / UPDATE, MATERIAL_REQUIREMENT_VIEW, PURCHASE_REQUIREMENT_VIEW, PRODUCTION / MATERIAL / PURCHASE_REPORT_VIEW |

Sign-ups start **inactive with no role**; Admin assigns department + role and activates them.
401 = not logged in / session expired, 403 = logged in but missing the permission.

## API
| Method & path | Permission |
|---|---|
| POST /api/auth/signup `{ name, email, password }` | — |
| POST /api/auth/login `{ email, password }` → `{ token, user }` | — |
| POST /api/auth/logout | logged in |
| GET  /api/auth/me → user, role, department, permissions | logged in |
| POST /api/auth/forgot-password `{ email }` | — |
| POST /api/auth/reset-password `{ token, password }` | — |
| GET /api/punching/designs · GET /api/punching/designs/:designNo (design + all component rows) | PUNCHING_VIEW |
| POST /api/punching/designs `{ designNo, productName }` — the design is the parent record | PUNCHING_CREATE |
| PUT /api/punching/designs/:designNo `{ productName }` | PUNCHING_UPDATE |
| PUT /api/punching/designs/:designNo/components/:component `{ rows: [{ size, stitch, laser?, consumption }] }` — add a component or replace its sizes (sizes used by an order can't be removed) | PUNCHING_CREATE + PUNCHING_UPDATE |
| DELETE /api/punching/designs/:designNo/components/:component (refused if an order uses it) | PUNCHING_UPDATE |
| GET /api/punching/master (flat list of every row) | PUNCHING_VIEW |
| POST /api/punching/master `{ designNo, component, size, stitch, laser?, consumption: { "SEQ-3MM": 975, "CORD": 30 } }` — one row; the design must exist; unique per Design + Component + Size; no negative values | PUNCHING_CREATE |
| PUT /api/punching/master/:id | PUNCHING_UPDATE |
| GET /api/production/designs?q= (search; ignores case, spaces and dashes) | PRODUCTION_VIEW |
| GET /api/production/designs/:designNo — Punching details + previous orders | PRODUCTION_VIEW |
| GET /api/production/orders, /orders/:id, /catalog (Design + Component + Size list) | PRODUCTION_VIEW |
| POST /api/production/orders `{ designNo, party, orderDate?, quantity }` (same quantity for every Component + Size) **or** `{ designNo, party, orderDate?, lines: [{ component, size, quantity }] }` (per row; order quantity stored as null) — item = product name, date = today | PRODUCTION_CREATE |
| PUT /api/production/orders/:id `{ party, designNo, item, orderDate, quantity?, lines }` (full replace) | PRODUCTION_UPDATE |
| PATCH /api/production/orders/:id/status `{ status: PENDING | IN_PROGRESS | COMPLETED | CANCELLED }` | PRODUCTION_UPDATE |
| GET /api/production/orders/:id/summary (per-row requirement) | PRODUCTION_VIEW |
| GET /api/material/requirements[?orderId=&components=KALI,GALISH] (all orders except cancelled / all components if omitted) | MATERIAL_REQUIREMENT_VIEW |
| GET /api/material/master | MATERIAL_MASTER_VIEW |
| POST /api/material/master `{ code, name, category, sortOrder?, seqPerCd, cdPerRoll, cdPerRound?, pcsPerKg, denier }` (rules needed depend on category) | MATERIAL_MASTER_MANAGE |
| PUT /api/material/master/:id (same, without code) · DELETE /api/material/master/:id (only if no Punching row uses it) | MATERIAL_MASTER_MANAGE |
| GET /api/purchase/requirements[?orderId=&components=KALI,GALISH] | PURCHASE_REQUIREMENT_VIEW |
| GET /api/reports/production \| material \| purchase [?format=csv] | *_REPORT_VIEW |
| GET /api/admin/users, POST /api/admin/users | USER_VIEW, USER_CREATE |
| PATCH /api/admin/users/:id `{ name?, roleId?, departmentId?, isActive?, password? }` | USER_UPDATE |
| DELETE /api/admin/users/:id | USER_DELETE |
| GET /api/admin/roles, GET /api/admin/departments | USER_VIEW |
| POST /api/admin/roles `{ name, permissions: [...] }` | ROLE_MANAGE |
| PUT /api/admin/roles/:id/permissions `{ permissions: [...] }` | PERMISSION_MANAGE |
| GET /api/admin/permissions | PERMISSION_MANAGE |
| POST /api/admin/departments `{ name }` | DEPARTMENT_MANAGE |

Safety rules: nobody can grant a role or permission they don't hold themselves; Admin cannot
deactivate/delete themselves or remove PERMISSION_MANAGE from their own role.

Password reset has no email service yet: the reset token is printed in the server log and, when
`NODE_ENV` is not `production`, returned as `devResetToken`.

## Structure and layer rules
See [CLAUDE.md](CLAUDE.md).
