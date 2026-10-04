// Proves the engine reproduces MATRIAL.xlsx. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate } from "./engine.js";
import { MATERIALS, LINES } from "../../tests/fixtures/sheet-fixture.js";

const result = calculate(LINES, MATERIALS);
const byCode = Object.fromEntries(result.totals.map((t) => [t.code, t]));

test("row calculation: KALI 18 × 230", () => {
  const kali18 = result.lines[0];
  assert.equal(kali18.requirement["SEQ-3MM"].toNumber(), 224250);
  assert.equal(kali18.requirement["CORD"].toNumber(), 6900);
});

test("Level 1 totals match Excel TOTAL REQ MATRIAL row", () => {
  const expected: Record<string, number> = {
    "SEQ-3MM": 8861475,
    "SEQ-4MM": 8405695,
    "SEQ-7MM": 46000,
    "SEQ-9MM": 46000,
    "BEAD-2MM-A": 46000,
    "BEAD-2MM-B": 46000,
    "BEAD-2.5MM": 1535710,
    "MOTI-3MM": 46000,
    "PIPE-4MM": 96945,
    "ZARDOSHI-7MM": 46000,
    CORD: 289206.5, // Excel displays 289207
  };
  for (const [code, value] of Object.entries(expected)) {
    assert.equal(byCode[code].total.toNumber(), value, code);
  }
});

test("Level 2 purchase conversion matches Excel", () => {
  const cd = (code: string) => {
    const p = byCode[code].purchase!;
    assert.equal(p.kind, "SEQUENCE");
    return p.kind === "SEQUENCE" ? p.cds.toDecimalPlaces(0).toNumber() : NaN;
  };
  assert.equal(cd("SEQ-3MM"), 280);
  assert.equal(cd("SEQ-4MM"), 354);
  assert.equal(cd("SEQ-7MM"), 3);
  assert.equal(cd("SEQ-9MM"), 4);

  const kg = (code: string) => {
    const p = byCode[code].purchase!;
    return p.kind === "BEAD" || p.kind === "CORD" ? p.kg.toDecimalPlaces(2).toNumber() : NaN;
  };
  assert.equal(kg("BEAD-2MM-A"), 0.58);
  assert.equal(kg("BEAD-2.5MM"), 21.94);
  assert.equal(kg("MOTI-3MM"), 1.02);
  assert.equal(kg("PIPE-4MM"), 2.77);
  assert.equal(kg("CORD"), 38.56); // Excel: 38,561 g -> 39 KG displayed
});

test("missing conversion rule is reported, not crashed", () => {
  const broken = MATERIALS.map((m) => (m.code === "CORD" ? { ...m, denier: null } : m));
  const r = calculate(LINES, broken);
  assert.ok(r.errors.some((e) => e.includes("Cord Denier")));
});
