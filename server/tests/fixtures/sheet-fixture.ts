// Data copied from MATRIAL.xlsx (design 26-49, party FR, CHOLI, 15/09/26).
// Used by the engine test (to prove we match Excel) and by the DB seed.

import type { MaterialRule, LineInput } from "../../src/calculation/engine.js";

export const MATERIALS: MaterialRule[] = [
  { code: "SEQ-3MM", name: "3-MM Sequence", category: "SEQUENCE", seqPerCd: 31600, cdPerRoll: 210 },
  { code: "SEQ-4MM", name: "4-MM Sequence", category: "SEQUENCE", seqPerCd: 23725, cdPerRoll: 165 },
  { code: "SEQ-7MM", name: "7-MM Sequence", category: "SEQUENCE", seqPerCd: 13550, cdPerRoll: 100 },
  { code: "SEQ-9MM", name: "9-MM Sequence", category: "SEQUENCE", seqPerCd: 10500, cdPerRoll: 70 },
  { code: "BEAD-2MM-A", name: "2-MM Bead A", category: "BEAD", pcsPerKg: 80000 },
  { code: "BEAD-2MM-B", name: "2-MM Bead B", category: "BEAD", pcsPerKg: 80000 },
  { code: "BEAD-2.5MM", name: "2.5-MM Bead", category: "BEAD", pcsPerKg: 70000 },
  { code: "MOTI-3MM", name: "3-MM Moti", category: "BEAD", pcsPerKg: 45000 },
  { code: "PIPE-4MM", name: "4-MM Pipe", category: "BEAD", pcsPerKg: 35000 },
  { code: "ZARDOSHI-7MM", name: "7-MM Zardoshi", category: "BEAD", pcsPerKg: 45000 },
  { code: "CORD", name: "Cord", category: "CORD", denier: 1200 },
];

// Column order used in the compact rows below
const COLS = MATERIALS.map((m) => m.code);

type Row = [component: string, size: string, qty: number, values: number[]];

// values = [3MM, 4MM, 7MM, 9MM, 2MM-A, 2MM-B, 2.5MM, 3MM-moti, 4MM-pipe, 7MM-zard, CORD MTR]
const ROWS: Row[] = [
  ["KALI", "18", 230, [975, 975, 0, 0, 0, 0, 0, 0, 0, 0, 30]],
  ["KALI", "20", 230, [1170, 1170, 0, 0, 0, 0, 0, 0, 0, 0, 33]],
  ["KALI", "22", 230, [1420, 1420, 0, 0, 0, 0, 0, 0, 0, 0, 36.2]],
  ["KALI", "24", 230, [1510, 1510, 0, 0, 0, 0, 0, 0, 0, 0, 43]],
  ["KALI", "26", 460, [1620, 1620, 0, 0, 0, 0, 0, 0, 0, 0, 56]],
  ["KALI", "28", 460, [1750, 1750, 100, 100, 100, 100, 0, 100, 0, 100, 57]],
  ["KALI", "30", 460, [2060, 2060, 0, 0, 0, 0, 0, 0, 0, 0, 65]],
  ["KALI", "32", 460, [1970, 1970, 0, 0, 0, 0, 0, 0, 0, 0, 73]],
  ["KALI", "34", 460, [2275, 2275, 0, 0, 0, 0, 0, 0, 0, 0, 77]],
  ["KALI", "36", 460, [2765, 2765, 0, 0, 0, 0, 0, 0, 0, 0, 78]],
  ["KALI", "38", 230, [2510, 2510, 0, 0, 0, 0, 0, 0, 0, 0, 80]],
  ["KALI", "40", 230, [2900, 2900, 0, 0, 0, 0, 0, 0, 0, 0, 81]],
  ["BLOUSE", "18", 23, [810, 390, 0, 0, 0, 0, 1820, 0, 125, 0, 36]],
  ["BLOUSE", "20", 23, [875, 420, 0, 0, 0, 0, 2050, 0, 135, 0, 39]],
  ["BLOUSE", "22", 23, [1030, 480, 0, 0, 0, 0, 2375, 0, 160, 0, 45]],
  ["BLOUSE", "24", 23, [1075, 500, 0, 0, 0, 0, 2620, 0, 170, 0, 51]],
  ["BLOUSE", "26", 46, [1200, 550, 0, 0, 0, 0, 2960, 0, 190, 0, 56]],
  ["BLOUSE", "28", 46, [1325, 600, 0, 0, 0, 0, 3300, 0, 210, 0, 60]],
  ["BLOUSE", "30", 46, [1490, 665, 0, 0, 0, 0, 3540, 0, 235, 0, 67]],
  ["BLOUSE", "32", 46, [1580, 695, 0, 0, 0, 0, 3820, 0, 250, 0, 71]],
  ["BLOUSE", "34", 46, [1780, 775, 0, 0, 0, 0, 4000, 0, 280, 0, 73]],
  ["BLOUSE", "36", 46, [1810, 785, 0, 0, 0, 0, 4420, 0, 290, 0, 80]],
  ["BLOUSE", "38", 23, [2110, 910, 0, 0, 0, 0, 4750, 0, 345, 0, 85]],
  ["BLOUSE", "40", 23, [2255, 975, 0, 0, 0, 0, 5185, 0, 370, 0, 93]],
  ["GALISH", "18", 23, [0, 0, 0, 0, 0, 0, 170, 0, 0, 0, 2.75]],
  ["GALISH", "20", 23, [0, 0, 0, 0, 0, 0, 170, 0, 0, 0, 2.75]],
  ["GALISH", "22", 23, [0, 0, 0, 0, 0, 0, 195, 0, 0, 0, 3]],
  ["GALISH", "24", 23, [0, 0, 0, 0, 0, 0, 195, 0, 0, 0, 3]],
  ["GALISH", "26", 46, [0, 0, 0, 0, 0, 0, 215, 0, 0, 0, 3.5]],
  ["GALISH", "28", 46, [0, 0, 0, 0, 0, 0, 215, 0, 0, 0, 3.5]],
  ["GALISH", "30", 46, [0, 0, 0, 0, 0, 0, 220, 0, 0, 0, 3.75]],
  ["GALISH", "32", 46, [0, 0, 0, 0, 0, 0, 220, 0, 0, 0, 3.75]],
  ["GALISH", "34", 46, [0, 0, 0, 0, 0, 0, 230, 0, 0, 0, 4]],
  ["GALISH", "36", 46, [0, 0, 0, 0, 0, 0, 230, 0, 0, 0, 4]],
  ["GALISH", "38", 23, [0, 0, 0, 0, 0, 0, 250, 0, 0, 0, 4.5]],
  ["GALISH", "40", 23, [0, 0, 0, 0, 0, 0, 250, 0, 0, 0, 4.5]],
  ["BELT", "ALL", 405, [290, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11]],
];

export const ORDER = { party: "FR", designNo: "26-49", item: "CHOLI", orderDate: "2026-09-15" };

// Punching master for design 26-49: per-piece consumption (non-zero only)
export const PUNCHING = ROWS.map(([component, size, , values]) => ({
  designNo: ORDER.designNo,
  productName: ORDER.item,
  component,
  size,
  consumption: Object.fromEntries(
    values.map((v, i) => [COLS[i], v] as const).filter(([, v]) => v !== 0),
  ) as Record<string, number>,
}));

// Production lines: punching consumption + order qty
export const LINES: LineInput[] = ROWS.map(([component, size, quantity], i) => ({
  component,
  size,
  quantity,
  consumption: PUNCHING[i].consumption,
}));
