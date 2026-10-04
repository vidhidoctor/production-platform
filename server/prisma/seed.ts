// Loads the MATRIAL.xlsx data into the database. Run: npm run db:seed
import { prisma } from "../src/database/prisma.js";
import { MATERIALS, PUNCHING, LINES, ORDER } from "../tests/fixtures/sheet-fixture.js";
import { PERMISSIONS, ROLES, DEPARTMENTS } from "@pp/shared";
import { hashPassword } from "../src/modules/auth/auth.crypto.js";

async function main() {
  const matId: Record<string, number> = {};
  for (const [i, m] of MATERIALS.entries()) {
    const { code, ...rest } = m;
    const row = await prisma.material.upsert({
      where: { code },
      update: { ...rest, sortOrder: i },
      create: { code, ...rest, sortOrder: i },
    });
    matId[code] = row.id;
  }

  // The design (parent record), then its components.
  await prisma.design.upsert({
    where: { designNo: ORDER.designNo },
    update: {},
    create: { designNo: ORDER.designNo, productName: ORDER.item },
  });

  const itemId: Record<string, number> = {};
  for (const p of PUNCHING) {
    const { designNo, component, size } = p;
    const item = await prisma.punchingItem.upsert({
      where: { designNo_component_size: { designNo, component, size } },
      update: {},
      create: { designNo, component, size },
    });
    itemId[`${component}|${size}`] = item.id;
    for (const [code, qty] of Object.entries(p.consumption)) {
      await prisma.consumption.upsert({
        where: { punchingItemId_materialId: { punchingItemId: item.id, materialId: matId[code] } },
        update: { qtyPerPiece: qty },
        create: { punchingItemId: item.id, materialId: matId[code], qtyPerPiece: qty },
      });
    }
  }

  // Seed is re-runnable: the sample order is only created once.
  const existing = await prisma.productionOrder.findFirst({ where: { designNo: ORDER.designNo, party: ORDER.party } });
  if (!existing) await prisma.productionOrder.create({
    data: {
      ...ORDER,
      orderDate: new Date(ORDER.orderDate),
      lines: {
        create: LINES.map((l) => ({ punchingItemId: itemId[`${l.component}|${l.size}`], quantity: l.quantity })),
      },
    },
  });
  console.log("Seeded materials, punching master and order 26-49.");
  await seedAuth();
}

// Permissions, roles, departments and the first Admin (from ADMIN_EMAIL / ADMIN_PASSWORD).
async function seedAuth() {
  for (const [code, description] of Object.entries(PERMISSIONS)) {
    await prisma.permission.upsert({ where: { code }, update: { description }, create: { code, description } });
  }
  // Other roles are only created if missing, so Admin changes made later are kept.
  // Admin always receives every permission, including ones added in later versions.
  for (const [name, codes] of Object.entries(ROLES)) {
    const perms = { connect: codes.map((code) => ({ code })) };
    await prisma.role.upsert({ where: { name }, update: name === "Admin" ? { permissions: perms } : {}, create: { name, permissions: perms } });
  }
  for (const name of DEPARTMENTS) {
    await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
  }

  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 8) {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD (8+ chars) not set in .env - no Admin user created.");
    return;
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    console.log(`Admin ${email} already exists (password unchanged).`);
    return;
  }
  await prisma.user.create({
    data: {
      name: "Admin",
      email,
      passwordHash: await hashPassword(password),
      isActive: true,
      role: { connect: { name: "Admin" } },
      department: { connect: { name: "Administration" } },
    },
  });
  console.log(`Seeded roles, permissions, departments and Admin ${email}.`);
}

main().finally(() => prisma.$disconnect());
