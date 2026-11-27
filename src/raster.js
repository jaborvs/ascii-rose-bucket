import { MAT, LEVELS } from './materials.js';

// Ancho/alto de una celda de texto monoespaciado.
export const CELL_ASPECT = 0.6;
const RAMP = '.,-~:;=!*#$@';
const PAPER_RAMP = '.,:;!|';
const CAMERA = 6;
const LIGHT = (() => {
  const v = [-0.5, 0.7, -0.6];
  const l = Math.hypot(...v);
  return v.map(x => x / l);
})();

export function createGrid(cols, rows) {
  const n = cols * rows;
  return {
    cols,
    rows,
    z: new Float32Array(n),
    ch: new Array(n).fill(' '),
    mat: new Uint8Array(n),
    lum: new Uint8Array(n),
  };
}

export function clearGrid(g) {
  g.z.fill(0);
  g.mat.fill(0);
}

// depth = 1/z: mayor = más cerca. Se queda la muestra más cercana de cada celda.
export function plot(g, c, r, depth, ch, mat, lum) {
  if (c < 0 || r < 0 || c >= g.cols || r >= g.rows) return;
  const i = r * g.cols + c;
  if (depth <= g.z[i]) return;
  g.z[i] = depth;
  g.ch[i] = ch;
  g.mat[i] = mat;
  g.lum[i] = lum;
}

export function charForLum(l) {
  const k = Math.min(1, Math.max(0, l));
  return RAMP[Math.round(k * (RAMP.length - 1))];
}

function stemChar(sx, sy) {
  const ax = Math.abs(sx), ay = Math.abs(sy);
  if (ax < 0.4 * ay) return '|';
  if (ay < 0.4 * ax) return '-';
  return sx * sy > 0 ? '/' : '\\';
}

// Proyecta el modelo en la rejilla. view: rotY (giro del ramo), tiltX (cámara algo elevada),
// offsetY (desplazamiento vertical en unidades de mundo), scale (celdas por unidad), cx/cy (centro).
export function renderModel(g, model, { rotY, tiltX, offsetY, scale, cx, cy }) {
  const ca = Math.cos(rotY), sa = Math.sin(rotY);
  const cb = Math.cos(tiltX), sb = Math.sin(tiltX);
  const { pos, nrm, mat, shade, count } = model;
  for (let i = 0; i < count; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const x1 = x * ca + z * sa;
    const z1 = -x * sa + z * ca;
    const y2 = y * cb - z1 * sb;
    const z2 = y * sb + z1 * cb;
    const ooz = 1 / (z2 + CAMERA);
    const persp = CAMERA * ooz;
    const c = Math.round(cx + scale * x1 * persp);
    const r = Math.round(cy - scale * CELL_ASPECT * (y2 + offsetY) * persp);
    if (c < 0 || r < 0 || c >= g.cols || r >= g.rows) continue;
    // Prueba de profundidad antes de iluminar: la mayoría de puntos quedan tapados.
    if (ooz <= g.z[r * g.cols + c]) continue;

    const nx = nrm[i * 3], ny = nrm[i * 3 + 1], nz = nrm[i * 3 + 2];
    const nx1 = nx * ca + nz * sa;
    const nz1 = -nx * sa + nz * ca;
    const ny2 = ny * cb - nz1 * sb;
    const nz2 = ny * sb + nz1 * cb;
    const m = mat[i];

    let ch, lum;
    if (m === MAT.STEM) {
      ch = stemChar(nx1, ny2 * CELL_ASPECT);
      lum = 0.75;
    } else {
      const diffuse = Math.abs(nx1 * LIGHT[0] + ny2 * LIGHT[1] + nz2 * LIGHT[2]);
      lum = m === MAT.PETAL || m === MAT.PETAL_ALT
        ? 0.3 + 0.7 * (0.55 * shade[i] + 0.45 * diffuse)
        : 0.15 + 0.85 * (0.65 * diffuse + 0.35 * Math.abs(nz2));
      if (m === MAT.FILLER) ch = lum > 0.55 ? '*' : '+';
      else if (m === MAT.WRAP) ch = PAPER_RAMP[Math.min(PAPER_RAMP.length - 1, Math.floor(lum * PAPER_RAMP.length))];
      else ch = charForLum(lum);
    }
    plot(g, c, r, ooz, ch, m, Math.min(LEVELS - 1, Math.floor(lum * LEVELS)));
  }
}

export function gridCells(g) {
  const cells = [];
  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      const i = r * g.cols + c;
      if (g.z[i] > 0) cells.push({ x: c, y: r, ch: g.ch[i], mat: g.mat[i], lum: g.lum[i] });
    }
  }
  return cells;
}
