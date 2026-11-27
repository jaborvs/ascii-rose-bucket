import { MAT, LEVELS } from './materials.js';

// Caja de regalo en ASCII: lazo + tapa (se van volando) y cuerpo (se deshace).
const W = 34;
const HALF = W / 2;
const RIBBON = [HALF - 1, HALF];
const BOW = [
  " .-''-.    .-''-. ",
  "(     `.  .'     )",
  " '-.___.\\/.___.-' ",
].map(l => ' '.repeat(HALF - 9) + l + ' '.repeat(HALF - 9));
const LID = [
  `.${'-'.repeat(HALF - 2)}||${'-'.repeat(HALF - 2)}.`,
  `|${' '.repeat(HALF - 2)}||${' '.repeat(HALF - 2)}|`,
  `'${'-'.repeat(HALF - 2)}||${'-'.repeat(HALF - 2)}'`,
];
const BODY = [
  ...Array(8).fill(` |${' '.repeat(HALF - 3)}||${' '.repeat(HALF - 3)}| `),
  ` '${'-'.repeat(HALF - 3)}''${'-'.repeat(HALF - 3)}' `,
];
const LINES = [...BOW, ...LID, ...BODY];
const LID_ROWS = BOW.length + LID.length;

export const GIFT_HEIGHT = LINES.length;

const hash01 = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000 / 1000;

// lid ∈ [0, 1]: la tapa sube y se aleja apagándose. fade ∈ [0, 1]: el cuerpo se deshace.
// bob: filas que salta la tapa mientras espera a que la abran.
// Devuelve celdas {x, y, ch, mat, lum}; los espacios interiores tapan lo que hay detrás.
export function giftCells({ cols, bottom, lid = 0, fade = 0, bob = 0 }) {
  const left = Math.floor((cols - W) / 2);
  const top = bottom - LINES.length + 1;
  const cells = [];

  LINES.forEach((line, row) => {
    const isLid = row < LID_ROWS;
    if (isLid && lid >= 1) return;
    const dy = isLid ? -Math.round(lid * 18) - bob : 0;
    const dx = isLid ? Math.round(lid * 8) : 0;
    const dim = isLid ? 1 - lid : 1;
    const chars = [...line];
    const first = chars.findIndex(ch => ch !== ' ');
    const last = chars.length - 1 - [...chars].reverse().findIndex(ch => ch !== ' ');
    const solid = row >= BOW.length; // tapa y cuerpo tapan su interior; el lazo no

    chars.forEach((ch, col) => {
      if (ch === ' ' && !(solid && col > first && col < last)) return;
      const x = left + col + dx;
      const y = top + row + dy;
      if (!isLid && hash01(x, y) < fade) return;
      const ribbon = row < BOW.length || RIBBON.includes(col);
      const lum = Math.round((ribbon ? LEVELS - 1 : LEVELS - 3) * dim);
      cells.push({ x, y, ch, mat: ribbon ? MAT.PETAL : MAT.WHITE, lum });
    });
  });
  return cells;
}
