export const MAT = {
  PETAL: 1,
  PETAL_ALT: 2,
  STEM: 3,
  LEAF: 4,
  WRAP: 5,
  RIBBON: 6,
  FILLER: 7,
  RED: 8,
  YELLOW: 9,
  STONE: 10,
  ROOF: 11,
  WINDOW: 12,
  WHITE: 13,
  GOLD: 14,
};

export const LEVELS = 10;

const BASE = {
  [MAT.PETAL]: [255, 28, 68],
  [MAT.PETAL_ALT]: [255, 92, 132],
  [MAT.STEM]: [70, 170, 80],
  [MAT.LEAF]: [40, 200, 100],
  [MAT.WRAP]: [175, 128, 145],
  [MAT.RIBBON]: [255, 196, 60],
  [MAT.FILLER]: [255, 255, 255],
  [MAT.RED]: [225, 30, 45],
  [MAT.YELLOW]: [255, 200, 0],
  [MAT.STONE]: [236, 230, 220],
  [MAT.ROOF]: [150, 165, 185],
  [MAT.WINDOW]: [255, 214, 130],
  [MAT.WHITE]: [255, 255, 255],
  [MAT.GOLD]: [232, 192, 96],
};

// PALETTE[mat][level] -> color CSS; niveles bajos más oscuros.
export const PALETTE = Object.fromEntries(
  Object.entries(BASE).map(([mat, [r, g, b]]) => [
    mat,
    Array.from({ length: LEVELS }, (_, l) => {
      const k = 0.35 + 0.65 * (l / (LEVELS - 1));
      return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
    }),
  ]),
);
