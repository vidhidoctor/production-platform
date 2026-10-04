// End-to-end auth + RBAC tests against the real DB. Needs `npm run db:seed` first.
// Run: npm run test:api   (creates its own users/data and removes them afterwards)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { app } from "../src/app.js";
import { prisma } from "../src/database/prisma.js";

const RUN = Date.now();
const mail = (who: string) => `${who}.${RUN}@test.local`;
const PASSWORD = "Secret-pass-1";
let server: Server;
let base = "";
const tokens: Record<string, string> = {};

async function call(method: string, path: string, body?: unknown, who?: string) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(who ? { Authorization: `Bearer ${tokens[who]}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = text;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, body: json, type: res.headers.get("content-type") ?? "" };
}

async function login(who: string, email: string, password = PASSWORD) {
  const r = await call("POST", "/api/auth/login", { email, password });
  if (r.status === 200) tokens[who] = r.body.token;
  return r;
}

const ids = { rahul: 0, amit: 0, mgr: 0, prodRole: 0, punchRole: 0, adminRole: 0, prodDept: 0, punchDept: 0 };

before(async () => {
  server = app.listen(0);
  base = `http://localhost:${(server.address() as AddressInfo).port}`;
  const r = await login("admin", process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!);
  assert.equal(r.status, 200, "admin login (run npm run db:seed first)");

  const roles = (await call("GET", "/api/admin/roles", undefined, "admin")).body;
  ids.prodRole = roles.find((r: any) => r.name === "Production Employee").id;
  ids.punchRole = roles.find((r: any) => r.name === "Punching Employee").id;
  ids.adminRole = roles.find((r: any) => r.name === "Admin").id;
  const depts = (await call("GET", "/api/admin/departments", undefined, "admin")).body;
  ids.prodDept = depts.find((d: any) => d.name === "Production").id;
  ids.punchDept = depts.find((d: any) => d.name === "Punching").id;
});

after(async () => {
  await prisma.user.deleteMany({ where: { email: { endsWith: `.${RUN}@test.local` } } });
  await prisma.role.deleteMany({ where: { name: `User Manager ${RUN}` } });
  await prisma.productionOrder.deleteMany({ where: { party: `TEST-${RUN}` } });
  await prisma.punchingItem.deleteMany({ where: { designNo: { startsWith: `TEST${RUN}` } } });
  await prisma.design.deleteMany({ where: { designNo: { startsWith: `TEST${RUN}` } } });
  await prisma.material.deleteMany({ where: { code: `TEST-${RUN}` } });
  await prisma.$disconnect();
  server.close();
});

test("protected APIs reject requests without a login", async () => {
  assert.equal((await call("GET", "/api/production/orders")).status, 401);
  assert.equal((await call("GET", "/api/material/requirements")).status, 401);
  tokens.bogus = "not-a-real-token";
  assert.equal((await call("GET", "/api/production/orders", undefined, "bogus")).status, 401);
});

test("sign up -> blocked until Admin assigns department + role and activates", async () => {
  for (const [who, name] of [["rahul", "Rahul"], ["amit", "Amit"]] as const) {
    const r = await call("POST", "/api/auth/signup", { name, email: mail(who), password: PASSWORD });
    assert.equal(r.status, 201);
    ids[who] = r.body.id;
    assert.equal((await login(who, mail(who))).status, 403, "inactive account cannot log in");
  }
  assert.equal((await call("POST", "/api/auth/signup", { name: "X", email: mail("rahul"), password: PASSWORD })).status, 409);
  assert.equal((await call("POST", "/api/auth/signup", { name: "X", email: mail("short"), password: "123" })).status, 400);

  await call("PATCH", `/api/admin/users/${ids.rahul}`, { roleId: ids.prodRole, departmentId: ids.prodDept, isActive: true }, "admin");
  await call("PATCH", `/api/admin/users/${ids.amit}`, { roleId: ids.punchRole, departmentId: ids.punchDept, isActive: true }, "admin");

  assert.equal((await login("rahul", mail("rahul"))).status, 200);
  const me = await login("amit", mail("amit"));
  assert.equal(me.status, 200);
  assert.equal(me.body.user.department, "Punching");
  assert.deepEqual(me.body.user.permissions.sort(), ["PUNCHING_CREATE", "PUNCHING_UPDATE", "PUNCHING_VIEW"]);
  assert.equal((await call("POST", "/api/auth/login", { email: mail("rahul"), password: "wrong-password" })).status, 401);
});

test("spec §16-18: material requirements — Rahul 200, Amit 403, Admin 200", async () => {
  const r = await call("GET", "/api/material/requirements", undefined, "rahul");
  assert.equal(r.status, 200);
  assert.ok(r.body.totals.find((t: any) => t.code === "SEQ-3MM"));
  assert.equal((await call("GET", "/api/material/requirements", undefined, "amit")).status, 403);
  assert.equal((await call("GET", "/api/material/requirements", undefined, "admin")).status, 200);

  const one = await call("GET", "/api/material/requirements?orderId=1", undefined, "rahul");
  assert.equal(one.body.totals.find((t: any) => t.code === "SEQ-3MM").total, "8861475");
});

test("Production: orders, purchase requirements and reports; no Punching edits", async () => {
  const order = { party: `TEST-${RUN}`, designNo: "26-49", quantity: 10, lines: [{ component: "KALI", size: 18, quantity: 10 }] };
  const created = await call("POST", "/api/production/orders", order, "rahul");
  assert.equal(created.status, 201);
  const upd = await call(
    "PUT",
    `/api/production/orders/${created.body.id}`,
    { ...order, item: "CHOLI", orderDate: "2026-09-27", lines: [{ component: "kali", size: "20", quantity: 5 }] },
    "rahul",
  );
  assert.equal(upd.status, 200);
  assert.deepEqual(upd.body.lines, [{ component: "KALI", size: "20", quantity: 5 }]);
  // same component + size under a design with no Punching Master entry
  const wrongDesign = await call("PUT", `/api/production/orders/${created.body.id}`,
    { ...order, item: "CHOLI", orderDate: "2026-09-27", designNo: "NO-SUCH-DESIGN" }, "rahul");
  assert.equal(wrongDesign.status, 400);
  assert.deepEqual(wrongDesign.body.details.missing, ["NO-SUCH-DESIGN KALI 18"]);

  const sum = await call("GET", `/api/production/orders/${created.body.id}/summary`, undefined, "rahul");
  assert.equal(sum.body.lines[0].requirement["SEQ-3MM"], "5850");

  const catalog = await call("GET", "/api/production/catalog", undefined, "rahul");
  assert.ok(catalog.body.some((c: any) => c.designNo === "26-49" && c.productName === "CHOLI" && c.component === "KALI" && c.size === "18"));
  assert.equal(catalog.body[0].consumption, undefined, "catalog must not expose consumption");

  const p = await call("GET", "/api/purchase/requirements?orderId=1", undefined, "rahul");
  assert.equal(p.status, 200);
  assert.equal(Math.round(Number(p.body.totals.find((t: any) => t.code === "SEQ-3MM").purchase.cds)), 280);

  for (const rep of ["production", "material", "purchase"]) {
    assert.equal((await call("GET", `/api/reports/${rep}`, undefined, "rahul")).status, 200, rep);
  }
  const csv = await call("GET", "/api/reports/purchase?format=csv", undefined, "rahul");
  assert.match(csv.type, /text\/csv/);
  assert.match(csv.body, /^code,name,requirement,unit,cds,rolls,kg,error\n/);

  assert.equal((await call("POST", "/api/punching/master", { designNo: "X", productName: "X", component: "X", size: "1", stitch: 0 }, "rahul")).status, 403);
  assert.equal((await call("GET", "/api/material/master", undefined, "rahul")).status, 403);
});

test("Punching: maintains the master; no Production, Purchase, Reports or Admin", async () => {
  const list = await call("GET", "/api/punching/master", undefined, "amit");
  assert.equal(list.status, 200);
  assert.ok(list.body.materials.length > 0 && list.body.items.length > 0);

  // The design is created first (parent record), then its component rows.
  const item = { designNo: `test${RUN}`, component: "frock", size: "18", stitch: 1200 };
  assert.equal((await call("POST", "/api/punching/master", item, "amit")).status, 404, "design must exist first");
  const design = await call("POST", "/api/punching/designs", { designNo: `test${RUN}`, productName: "Lehenga Choli" }, "amit");
  assert.equal(design.status, 201);
  assert.equal(design.body.designNo, `TEST${RUN}`);
  assert.equal((await call("POST", "/api/punching/designs", { designNo: `TEST${RUN}`, productName: "X" }, "amit")).status, 409);

  const created = await call("POST", "/api/punching/master",
    { ...item, consumption: { "SEQ-3MM": 100, CORD: 2.5, "SEQ-4MM": 0 } }, "amit");
  assert.equal(created.status, 201);
  assert.equal(created.body.designNo, `TEST${RUN}`);
  assert.equal(created.body.component, "FROCK");
  assert.equal(created.body.laser, null, "laser is optional");
  assert.deepEqual(created.body.consumption, { "SEQ-3MM": "100", CORD: "2.5" });
  const upd = await call("PUT", `/api/punching/master/${created.body.id}`, { consumption: { CORD: 3 } }, "amit");
  assert.deepEqual(upd.body.consumption, { CORD: "3" });
  assert.equal((await call("POST", "/api/punching/master", { ...item, size: "1", consumption: { NOPE: 1 } }, "amit")).status, 400);
  assert.equal((await call("POST", "/api/punching/master", item, "amit")).status, 409, "duplicate design + component + size");
  // same component + size is fine under another design
  const other = await call("POST", "/api/punching/master", { ...item, designNo: `test${RUN}`, component: "kali" }, "amit");
  assert.equal(other.status, 201);

  // Negative values and a missing stitch are rejected; laser may be left out.
  const rejects = [
    [{ ...item, size: "20", stitch: -1 }, "stitch cannot be negative."],
    [{ ...item, size: "20", stitch: 5, laser: -3 }, "laser cannot be negative."],
    [{ ...item, size: "20", consumption: { CORD: -2 } }, "CORD: quantity cannot be negative."],
    [{ ...item, size: "20", stitch: undefined }, "stitch is required and must be a whole number."],
    [{ ...item, size: "20", component: "" }, "component is required."],
  ] as const;
  for (const [body, message] of rejects) {
    const r = await call("POST", "/api/punching/master", body, "amit");
    assert.equal(r.status, 400, message);
    assert.equal(r.body.error, message);
  }
  assert.equal((await call("PUT", `/api/punching/master/${created.body.id}`, { stitch: -5 }, "amit")).status, 400);

  for (const [m, path] of [
    ["POST", "/api/production/orders"], ["GET", "/api/production/orders"], ["GET", "/api/purchase/requirements"],
    ["GET", "/api/reports/production"], ["GET", "/api/admin/users"], ["GET", "/api/admin/permissions"],
  ]) {
    assert.equal((await call(m, path, m === "GET" ? undefined : {}, "amit")).status, 403, `${m} ${path}`);
  }
});

test("Punching: one design, several components, each with its sizes", async () => {
  const d = `test${RUN}-B`;
  const D = d.toUpperCase();
  assert.equal((await call("PUT", `/api/punching/designs/${d}/components/kali`, { rows: [{ size: "18", stitch: 1 }] }, "amit")).status, 404);
  assert.equal((await call("POST", "/api/punching/designs", { designNo: d, productName: "Lehenga Choli" }, "amit")).status, 201);

  // Kali, then "Add Another Component": Galish — both under the same design
  const kali = await call("PUT", `/api/punching/designs/${d}/components/kali`, {
    rows: [
      { size: "18", stitch: 1200, consumption: { "SEQ-3MM": 975, CORD: 30 } },
      { size: 20, stitch: 1300, laser: 4, consumption: { "SEQ-3MM": 1170 } },
    ],
  }, "amit");
  assert.equal(kali.status, 200);
  const galish = await call("PUT", `/api/punching/designs/${d}/components/Galish`, {
    rows: [{ size: "18", stitch: 500, consumption: { "BEAD-2.5MM": 170 } }],
  }, "amit");
  assert.deepEqual(galish.body.items.map((i: any) => `${i.component} ${i.size}`), ["GALISH 18", "KALI 18", "KALI 20"]);
  assert.equal(galish.body.productName, "Lehenga Choli");

  const list = await call("GET", "/api/punching/designs", undefined, "amit");
  assert.deepEqual(list.body.find((x: any) => x.designNo === D).components, [
    { component: "GALISH", sizes: ["18"] },
    { component: "KALI", sizes: ["18", "20"] },
  ]);

  // Validation inside the grid
  for (const [rows, message] of [
    [[{ size: "18", stitch: 1 }, { size: "18", stitch: 2 }], "Size 18 is entered twice."],
    [[{ size: "18", stitch: -1 }], "stitch cannot be negative."],
    [[{ size: "18", stitch: 1, consumption: { CORD: -1 } }], "CORD: quantity cannot be negative."],
    [[], "Add at least one size."],
  ] as const) {
    const r = await call("PUT", `/api/punching/designs/${d}/components/kali`, { rows }, "amit");
    assert.equal(r.status, 400, message);
    assert.equal(r.body.error, message);
  }

  // Editing the component: size 20 left out -> removed; size 18 updated
  const edited = await call("PUT", `/api/punching/designs/${d}/components/KALI`, {
    rows: [{ size: "18", stitch: 1250, consumption: { CORD: 31 } }],
  }, "amit");
  const k18 = edited.body.items.find((i: any) => i.component === "KALI");
  assert.deepEqual([edited.body.items.length, k18.stitch, k18.consumption], [2, 1250, { CORD: "31" }]);

  assert.equal((await call("PUT", `/api/punching/designs/${d}`, { productName: "Plazo" }, "amit")).body.productName, "Plazo");
  assert.equal((await call("DELETE", `/api/punching/designs/${d}/components/galish`, undefined, "amit")).body.items.length, 1);

  // Production can read it but not change it
  assert.equal((await call("PUT", `/api/punching/designs/${d}/components/kali`, { rows: [{ size: "18", stitch: 1 }] }, "rahul")).status, 403);

  // Rows used by an order cannot be removed
  const order = await call("POST", "/api/production/orders", { designNo: d, party: `TEST-${RUN}`, quantity: 10 }, "rahul");
  assert.equal(order.status, 201);
  assert.equal(order.body.item, "Plazo");
  assert.equal((await call("DELETE", `/api/punching/designs/${d}/components/kali`, undefined, "amit")).status, 409);
  const shrink = await call("PUT", `/api/punching/designs/${d}/components/kali`, { rows: [{ size: "20", stitch: 1 }] }, "amit");
  assert.equal(shrink.status, 409);
  assert.match(shrink.body.error, /KALI size 18 is used by 1 production order line/);
});

test("Production: search a design, see its history, create an order with Party + Quantity", async () => {
  const design = `TEST${RUN}`; // created by Punching in the previous test: FROCK 18, KALI 18
  const found = await call("GET", `/api/production/designs?q=${design.toLowerCase()}`, undefined, "rahul");
  assert.deepEqual(found.body.find((d: any) => d.designNo === design), { designNo: design, productName: "Lehenga Choli", entries: 2, orders: 0 });
  const dashless = await call("GET", "/api/production/designs?q=2649", undefined, "rahul");
  assert.ok(dashless.body.some((d: any) => d.designNo === "26-49"), "search ignores dashes");

  const detail = await call("GET", `/api/production/designs/${design.toLowerCase()}`, undefined, "rahul");
  assert.equal(detail.status, 200);
  assert.equal(detail.body.productName, "Lehenga Choli");
  assert.deepEqual(detail.body.items.map((i: any) => `${i.component} ${i.size}`), ["FROCK 18", "KALI 18"]);
  assert.ok(detail.body.items[0].consumption, "Punching's consumption details are shown");
  assert.ok(detail.body.materials.length > 0);
  assert.deepEqual(detail.body.orders, []);
  assert.equal((await call("GET", "/api/production/designs/NOPE-404", undefined, "rahul")).status, 404);

  // Only Party + Order Quantity: every Component + Size of the design at that quantity
  const created = await call("POST", "/api/production/orders", { designNo: design, party: `TEST-${RUN}`, quantity: 230 }, "rahul");
  assert.equal(created.status, 201);
  assert.equal(created.body.item, "Lehenga Choli", "item comes from the product name");
  assert.equal(created.body.orderDate.slice(0, 10), new Date().toISOString().slice(0, 10), "date defaults to today");
  assert.equal(created.body.quantity, 230);
  assert.equal(created.body.status, "PENDING");
  assert.deepEqual(created.body.lines, [
    { component: "FROCK", size: "18", quantity: 230 },
    { component: "KALI", size: "18", quantity: 230 },
  ]);

  // Optional per-row quantities
  const partial = await call("POST", "/api/production/orders",
    { designNo: design, party: `TEST-${RUN}`, quantity: 50, lines: [{ component: "FROCK", size: 18, quantity: 50 }] }, "rahul");
  assert.deepEqual(partial.body.lines, [{ component: "FROCK", size: "18", quantity: 50 }]);
  assert.equal(partial.body.quantity, null, "per-row orders have no common Order Quantity");

  // Different quantity per row, no top Order Quantity at all
  const perRow = await call("POST", "/api/production/orders", {
    designNo: design, party: `TEST-${RUN}`,
    lines: [{ component: "FROCK", size: 18, quantity: 32 }, { component: "KALI", size: 18, quantity: 1 }],
  }, "rahul");
  assert.equal(perRow.status, 201);
  assert.equal(perRow.body.quantity, null);
  assert.deepEqual(perRow.body.lines.map((l: any) => l.quantity), [32, 1]);
  await call("PATCH", `/api/production/orders/${perRow.body.id}/status`, { status: "CANCELLED" }, "rahul");

  // Status
  assert.equal((await call("PATCH", `/api/production/orders/${created.body.id}/status`, { status: "COMPLETED" }, "rahul")).body.status, "COMPLETED");
  assert.equal((await call("PATCH", `/api/production/orders/${created.body.id}/status`, { status: "DONE" }, "rahul")).status, 400);
  assert.equal((await call("PATCH", `/api/production/orders/${created.body.id}/status`, { status: "PENDING" }, "amit")).status, 403);

  const history = (await call("GET", `/api/production/designs/${design}`, undefined, "rahul")).body.orders;
  assert.equal(history.length, 3);
  const first = history.find((o: any) => o.id === created.body.id);
  assert.deepEqual([first.party, first.quantity, first.totalPieces, first.status], [`TEST-${RUN}`, 230, 460, "COMPLETED"]);

  // Cancelled orders drop out of the combined requirement, but stay viewable on their own
  await call("PATCH", `/api/production/orders/${partial.body.id}/status`, { status: "CANCELLED" }, "rahul");
  const all = await call("GET", "/api/material/requirements", undefined, "rahul");
  assert.ok(all.body.orderIds.includes(created.body.id) && !all.body.orderIds.includes(partial.body.id));
  assert.equal((await call("GET", `/api/material/requirements?orderId=${partial.body.id}`, undefined, "rahul")).status, 200);

  // Purchase requirement of one order, limited to chosen components
  // (FROCK 18 uses CORD 3 per piece, KALI 18 uses nothing; both ordered at 230)
  const cord = async (components: string) => {
    const r = await call("GET", `/api/purchase/requirements?orderId=${created.body.id}&components=${components}`, undefined, "rahul");
    return [r.body.components, r.body.totals.find((t: any) => t.code === "CORD").total];
  };
  assert.deepEqual(await cord("frock"), [["FROCK"], "690"]);
  assert.deepEqual(await cord("kali"), [["KALI"], "0"]);
  assert.deepEqual(await cord("frock,kali"), [["FROCK", "KALI"], "690"]);
  assert.deepEqual(await cord(""), [[], "690"]);

  const unknown = await call("POST", "/api/production/orders", { designNo: "NOPE-404", party: "FR", quantity: 5 }, "rahul");
  assert.equal(unknown.status, 400);
  assert.equal(unknown.body.error, "Design NOPE-404 is not in the Punching Master.");
});

test("Production cannot manage users, roles, permissions or departments", async () => {
  assert.equal((await call("GET", "/api/admin/users", undefined, "rahul")).status, 403);
  assert.equal((await call("PATCH", `/api/admin/users/${ids.rahul}`, { roleId: ids.adminRole }, "rahul")).status, 403);
  assert.equal((await call("PUT", `/api/admin/roles/${ids.prodRole}/permissions`, { permissions: ["USER_VIEW"] }, "rahul")).status, 403);
  assert.equal((await call("POST", "/api/admin/departments", { name: "X" }, "rahul")).status, 403);
});

test("a user with USER_UPDATE still cannot hand out Admin (no privilege escalation)", async () => {
  const role = await call("POST", "/api/admin/roles", { name: `User Manager ${RUN}`, permissions: ["USER_VIEW", "USER_UPDATE"] }, "admin");
  assert.equal(role.status, 201);
  const mgr = await call("POST", "/api/admin/users", { name: "Mgr", email: mail("mgr"), password: PASSWORD, roleId: role.body.id }, "admin");
  assert.equal(mgr.status, 201);
  await login("mgr", mail("mgr"));
  assert.equal((await call("PATCH", `/api/admin/users/${ids.rahul}`, { roleId: ids.adminRole }, "mgr")).status, 403);
  assert.equal((await call("PATCH", `/api/admin/users/${ids.rahul}`, { name: "Rahul K" }, "mgr")).status, 200);
});

test("Admin cannot lock themselves out", async () => {
  const me = (await call("GET", "/api/auth/me", undefined, "admin")).body;
  assert.equal((await call("PATCH", `/api/admin/users/${me.id}`, { isActive: false }, "admin")).status, 400);
  assert.equal((await call("DELETE", `/api/admin/users/${me.id}`, undefined, "admin")).status, 400);
  assert.equal((await call("PUT", `/api/admin/roles/${ids.adminRole}/permissions`, { permissions: ["USER_VIEW"] }, "admin")).status, 400);
});

test("Admin edits the material (consumption) columns; the Punching Master follows", async () => {
  const code = `TEST-${RUN}`;
  const bad = await call("POST", "/api/material/master", { code, name: "5-MM Sequence", category: "SEQUENCE", seqPerCd: 20000 }, "admin");
  assert.equal(bad.status, 400);
  assert.equal(bad.body.error, "cdPerRoll is required for SEQUENCE materials.");
  assert.equal((await call("POST", "/api/material/master", { code, name: "X", category: "BEAD", pcsPerKg: -5 }, "admin")).status, 400);

  const created = await call("POST", "/api/material/master", { code, name: "5-MM Sequence", category: "SEQUENCE", seqPerCd: 20000, cdPerRoll: 150 }, "admin");
  assert.equal(created.status, 201);
  let master = await call("GET", "/api/punching/master", undefined, "amit");
  assert.ok(master.body.materials.some((m: any) => m.code === code && m.name === "5-MM Sequence"), "new column visible to Punching");
  assert.equal(master.body.materials.at(-1).code, code, "new column goes last");

  const renamed = await call("PUT", `/api/material/master/${created.body.id}`, { name: "5-MM Seq (new)", category: "BEAD", pcsPerKg: 90000, seqPerCd: 20000 }, "admin");
  assert.equal(renamed.status, 200);
  assert.equal(renamed.body.seqPerCd, null, "rules from the old category are cleared");
  master = await call("GET", "/api/punching/master", undefined, "amit");
  assert.ok(master.body.materials.some((m: any) => m.code === code && m.name === "5-MM Seq (new)" && m.category === "BEAD"));

  // only Admin (MATERIAL_MASTER_MANAGE) may change materials
  for (const who of ["amit", "rahul"]) {
    assert.equal((await call("PUT", `/api/material/master/${created.body.id}`, { name: "X", category: "BEAD", pcsPerKg: 1 }, who)).status, 403, who);
  }

  // in use -> cannot be removed; unused -> removed
  const row = await call("POST", "/api/punching/master",
    { designNo: `test${RUN}`, productName: "P", component: "BELT", size: "ALL", stitch: 1, consumption: { [code]: 4 } }, "amit");
  assert.equal(row.status, 201);
  assert.equal((await call("DELETE", `/api/material/master/${created.body.id}`, undefined, "admin")).status, 409);
  await call("PUT", `/api/punching/master/${row.body.id}`, { consumption: {} }, "amit");
  assert.equal((await call("DELETE", `/api/material/master/${created.body.id}`, undefined, "admin")).status, 204);
});

test("bad input returns 400 instead of crashing the server", async () => {
  const bad: [unknown, string][] = [
    [{}, "designNo is required."],
    [{ designNo: "26-49", quantity: 5 }, "party is required."],
    [{ designNo: "26-49", party: "P" }, "Please enter a valid Order Quantity."],
    [{ designNo: "26-49", party: "P", quantity: -230 }, "Please enter a valid Order Quantity."],
    [{ designNo: "26-49", party: "P", quantity: 2.5 }, "Please enter a valid Order Quantity."],
    [{ designNo: "26-49", party: "P", quantity: 5, lines: [{ component: "KALI", size: 18, quantity: 0 }] }, "KALI 18: Please enter a valid Order Quantity."],
    [{ designNo: "26-49", party: "P", quantity: 5, lines: [{ component: "KALI", size: 99, quantity: 1 }] }, "Consumption master not available for this Design + Component + Size."],
    [{ designNo: "26-49", party: "P", quantity: 5, orderDate: "27/09/2026" }, "orderDate must be a valid date (YYYY-MM-DD)."],
  ];
  for (const [body, message] of bad) {
    const r = await call("POST", "/api/production/orders", body, "rahul");
    assert.equal(r.status, 400, message);
    assert.equal(r.body.error, message);
  }
  assert.equal((await call("GET", "/api/production/orders/abc/summary", undefined, "rahul")).status, 400);
  assert.equal((await call("GET", "/api/production/orders/99999/summary", undefined, "rahul")).status, 404);
  assert.equal((await call("GET", "/api/production/orders", undefined, "rahul")).status, 200, "server still alive");
});

test("forgot + reset password; old password and old sessions stop working", async () => {
  const unknown = await call("POST", "/api/auth/forgot-password", { email: mail("nobody") });
  assert.equal(unknown.status, 200);
  assert.equal(unknown.body.devResetToken, undefined);

  const f = await call("POST", "/api/auth/forgot-password", { email: mail("rahul") });
  assert.ok(f.body.devResetToken);
  const oldToken = tokens.rahul;
  assert.equal((await call("POST", "/api/auth/reset-password", { token: f.body.devResetToken, password: "New-pass-99" })).status, 200);
  assert.equal((await call("POST", "/api/auth/reset-password", { token: f.body.devResetToken, password: "Again-pass-1" })).status, 400, "token single use");

  tokens.old = oldToken;
  assert.equal((await call("GET", "/api/auth/me", undefined, "old")).status, 401);
  assert.equal((await login("rahul", mail("rahul"))).status, 401);
  assert.equal((await login("rahul", mail("rahul"), "New-pass-99")).status, 200);
});

test("logout ends the session; deactivation blocks immediately", async () => {
  assert.equal((await call("POST", "/api/auth/logout", undefined, "amit")).status, 200);
  assert.equal((await call("GET", "/api/punching/master", undefined, "amit")).status, 401);

  assert.equal((await call("GET", "/api/production/orders", undefined, "rahul")).status, 200);
  await call("PATCH", `/api/admin/users/${ids.rahul}`, { isActive: false }, "admin");
  assert.equal((await call("GET", "/api/production/orders", undefined, "rahul")).status, 401);
  assert.equal((await login("rahul", mail("rahul"), "New-pass-99")).status, 403);
});
