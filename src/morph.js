import { rng } from './rng.js';

const MAX_DELAY = 0.25;
const DURATION = 1 - MAX_DELAY;

const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Plan de partículas que convierte las celdas del ramo (from) en las del logo (to).
// Cada partícula estalla hacia fuera y luego vuela a su destino (curva de Bézier cuadrática).
// Celdas sobrantes del ramo caen por abajo; las que faltan llegan desde abajo.
export function planMorph(from, to, { cols, rows, seed }) {
  const rand = rng(seed);
  const sources = [...from];
  for (let i = sources.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [sources[i], sources[j]] = [sources[j], sources[i]];
  }

  const n = Math.max(sources.length, to.length);
  const particles = [];
  for (let i = 0; i < n; i++) {
    const source = sources[i] ?? null;
    const target = to[i] ?? null;
    const x0 = source ? source.x : rand() * cols;
    const y0 = source ? source.y : rows + 2 + rand() * 8;
    const x1 = target ? target.x : x0 + (rand() - 0.5) * 12;
    const y1 = target ? target.y : rows + 2 + rand() * 6;
    const push = 0.25 + 0.5 * rand();
    particles.push({
      source,
      target,
      x0, y0, x1, y1,
      bx: x0 + (x0 - cols / 2) * push + (rand() - 0.5) * 8,
      by: y0 + (y0 - rows * 0.55) * push * 0.6 - rand() * 6,
      ch0: source ? source.ch : target.ch,
      ch1: target ? target.ch : source.ch,
      mat0: source ? source.mat : target.mat,
      mat1: target ? target.mat : source.mat,
      lum0: source ? source.lum ?? 9 : 9,
      lum1: target ? target.lum ?? 9 : source.lum ?? 9,
      delay: rand() * MAX_DELAY,
    });
  }
  return particles;
}

export function particleAt(p, t) {
  const local = Math.min(1, Math.max(0, (t - p.delay) / DURATION));
  const e = easeInOut(local);
  const a = (1 - e) * (1 - e), b = 2 * (1 - e) * e, c = e * e;
  const late = e >= 0.5;
  let alpha = 1;
  if (!p.target) alpha = 1 - local;
  else if (!p.source) alpha = local;
  return {
    x: a * p.x0 + b * p.bx + c * p.x1,
    y: a * p.y0 + b * p.by + c * p.y1,
    ch: late ? p.ch1 : p.ch0,
    mat: late ? p.mat1 : p.mat0,
    lum: late ? p.lum1 : p.lum0,
    alpha,
  };
}
