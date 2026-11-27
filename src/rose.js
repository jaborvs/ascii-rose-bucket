import { MAT } from './materials.js';
import { rng } from './rng.js';

const TAU = Math.PI * 2;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function normalize(v, fallback = [0, 1, 0]) {
  const l = Math.hypot(v[0], v[1], v[2]);
  return l < 1e-12 ? fallback : [v[0] / l, v[1] / l, v[2] / l];
}

function rotY([x, y, z], a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c];
}

// Rotación de Rodrigues alrededor del eje unitario k.
function rotAxis(v, k, a) {
  const c = Math.cos(a), s = Math.sin(a);
  const kxv = cross(k, v);
  const kdv = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
  return [0, 1, 2].map(i => v[i] * c + kxv[i] * s + k[i] * kdv * (1 - c));
}

function createBuffer() {
  return { pos: [], nrm: [], mat: [], shade: [] };
}

function push(buf, p, n, mat, shade = 1) {
  buf.pos.push(p[0], p[1], p[2]);
  buf.nrm.push(n[0], n[1], n[2]);
  buf.mat.push(mat);
  buf.shade.push(shade);
}

function finish(buf) {
  return {
    pos: Float32Array.from(buf.pos),
    nrm: Float32Array.from(buf.nrm),
    mat: Uint8Array.from(buf.mat),
    shade: Float32Array.from(buf.shade),
    count: buf.mat.length,
  };
}

// Muestrea una superficie paramétrica fn(u, v), u, v ∈ [0, 1], con normales por diferencias finitas.
// shadeFn(u, v) ∈ [0, 1] es el tono propio del punto (p. ej. bordes de pétalo más oscuros).
function surface(buf, fn, nu, nv, mat, shadeFn = () => 1) {
  const e = 1e-3;
  for (let i = 0; i <= nu; i++) {
    for (let j = 0; j <= nv; j++) {
      const u = i / nu, v = j / nv;
      const du = sub(fn(u + e, v), fn(u - e, v));
      const dv = sub(fn(u, v + e), fn(u, v - e));
      push(buf, fn(u, v), normalize(cross(du, dv)), mat, shadeFn(u, v));
    }
  }
}

// Forma de pétalo: 0.5 en el borde entre pétalos, 1 en el centro del pétalo.
function petalProfile(t) {
  const m = ((3.6 * t) % TAU + TAU) % TAU;
  return 1 - (1 - m / Math.PI) ** 4 / 2 + Math.sin(15 * t) / 150;
}

// Rosa paramétrica clásica ("rosa de MATLAB"), con el eje vertical en y.
// open ∈ [0, 1]: 0 = capullo cerrado, 1 = rosa abierta. La base está en el origen.
function rosePoint(x, v, open) {
  const t = 4 * Math.PI + 20 * Math.PI * v;
  const p = (Math.PI / 2) * Math.exp(-t / (8 * Math.PI)) * (0.25 + 0.75 * open);
  const u = petalProfile(t);
  const y = 2 * (x * x - x) ** 2 * Math.sin(p);
  const r = u * (x * Math.sin(p) + y * Math.cos(p));
  const h = u * (x * Math.cos(p) - y * Math.sin(p));
  const s = 0.6 + 0.4 * open;
  return [s * r * Math.cos(t), s * h, s * r * Math.sin(t)];
}

// Bordes entre pétalos y base oscuros; centro y punta de cada pétalo claros.
function petalShade(x, v) {
  const u = petalProfile(4 * Math.PI + 20 * Math.PI * v);
  return Math.min(1, Math.max(0, (u - 0.5) * 2)) * (0.4 + 0.6 * x);
}

// Muestreo justo para no dejar huecos a ~25 celdas de ancho: más puntos solo cuestan tiempo por fotograma.
export function roseGeometry(open, { nx = 10, nt = 300 } = {}) {
  const buf = createBuffer();
  surface(buf, (x, v) => rosePoint(x, v, open), nx, nt, MAT.PETAL, petalShade);
  return finish(buf);
}

function addRose(buf, geo, { at, phi, tilt, spin, scale, mat }) {
  const axis = normalize([Math.sin(phi), 0, -Math.cos(phi)]);
  const orient = v => rotAxis(rotY(v, spin), axis, tilt);
  for (let i = 0; i < geo.count; i++) {
    const p = orient([geo.pos[i * 3] * scale, geo.pos[i * 3 + 1] * scale, geo.pos[i * 3 + 2] * scale]);
    const n = orient([geo.nrm[i * 3], geo.nrm[i * 3 + 1], geo.nrm[i * 3 + 2]]);
    push(buf, [p[0] + at[0], p[1] + at[1], p[2] + at[2]], n, mat, geo.shade[i]);
  }
}

function addSegment(buf, a, b, mat, step = 0.02) {
  const d = sub(b, a);
  const len = Math.hypot(d[0], d[1], d[2]);
  const tan = normalize(d);
  const n = Math.max(1, Math.ceil(len / step));
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    push(buf, [a[0] + d[0] * k, a[1] + d[1] * k, a[2] + d[2] * k], tan, mat);
  }
}

const CONE = { bottom: -1.0, top: 0.25, r0: 0.07, r1: 0.8 };
const coneRadius = y => CONE.r0 + (CONE.r1 - CONE.r0) * ((y - CONE.bottom) / (CONE.top - CONE.bottom));

function roseLayout() {
  const roses = [{ at: [0, 1.15, 0], phi: 0, tilt: 0, spin: 0, scale: 0.85, mat: MAT.PETAL }];
  for (let k = 0; k < 6; k++) {
    const phi = (k * Math.PI) / 3 + Math.PI / 6;
    roses.push({
      at: [0.82 * Math.cos(phi), 0.85, 0.82 * Math.sin(phi)],
      phi,
      tilt: 0.6,
      spin: k * 1.3,
      scale: 0.78,
      mat: k % 2 ? MAT.PETAL_ALT : MAT.PETAL,
    });
  }
  return roses;
}

const cache = new Map();

// Ramo completo en coordenadas de mundo (sin rotación de cámara). Se cachea por nivel de apertura.
export function buildBouquetModel(open) {
  if (cache.has(open)) return cache.get(open);
  const buf = createBuffer();
  const rand = rng(7);
  const geo = roseGeometry(open);

  for (const r of roseLayout()) {
    addRose(buf, geo, r);
    const knot = [0, 0.05, 0];
    const foot = [0.1 * Math.cos(r.phi), -1.5, 0.1 * Math.sin(r.phi)];
    addSegment(buf, r.at, knot, MAT.STEM);
    addSegment(buf, knot, foot, MAT.STEM);
  }

  // Hojas entre las rosas, apuntando hacia fuera y algo caídas.
  for (let k = 0; k < 6; k++) {
    const phi = (k * Math.PI) / 3;
    const pitch = 0.45;
    const d = [Math.cos(phi) * Math.cos(pitch), Math.sin(pitch), Math.sin(phi) * Math.cos(pitch)];
    const side = [-Math.sin(phi), 0, Math.cos(phi)];
    const base = [0.45 * Math.cos(phi), 0.45, 0.45 * Math.sin(phi)];
    const L = 0.75;
    surface(buf, (u, v) => {
      const w = 0.2 * Math.max(0, Math.sin(Math.PI * u)) ** 0.8 * (2 * v - 1);
      const fold = 0.05 * (2 * v - 1) ** 2;
      return [
        base[0] + d[0] * L * u + side[0] * w,
        base[1] + d[1] * L * u - 0.28 * u * u + fold,
        base[2] + d[2] * L * u + side[2] * w,
      ];
    }, 18, 6, MAT.LEAF);
  }

  // Papel del ramo: cono con pliegues y borde ondulado.
  surface(buf, (u, v) => {
    const th = TAU * u;
    const y = CONE.bottom + (CONE.top - CONE.bottom) * v + 0.12 * Math.abs(Math.sin(3 * th)) * v ** 4;
    const r = coneRadius(y) * (1 + 0.05 * Math.sin(10 * th));
    return [r * Math.cos(th), y, r * Math.sin(th)];
  }, 100, 26, MAT.WRAP);

  // Lazo: cinta alrededor del cono y dos lazadas delante (z negativa mira a la cámara).
  const bandY = -0.55;
  surface(buf, (u, v) => {
    const th = TAU * u;
    const y = bandY + 0.13 * v;
    const r = coneRadius(y) + 0.03;
    return [r * Math.cos(th), y, r * Math.sin(th)];
  }, 90, 4, MAT.RIBBON);
  const front = -(coneRadius(bandY) + 0.06);
  for (const s of [-1, 1]) {
    surface(buf, (u, v) => {
      const a = TAU * u;
      return [s * (0.16 + 0.14 * Math.cos(a)), bandY + 0.06 + 0.1 * Math.sin(a), front - 0.06 * v];
    }, 40, 2, MAT.RIBBON);
    surface(buf, (u, v) => [s * (0.03 + 0.12 * u), bandY - 0.38 * u, front - 0.05 * v], 16, 2, MAT.RIBBON);
  }

  // Paniculata: puntitos blancos entre las rosas.
  for (let i = 0; i < 110; i++) {
    const th = TAU * rand();
    const el = 0.15 + 1.2 * rand();
    const rad = 0.95 + 0.25 * rand();
    const n = [Math.cos(th) * Math.cos(el), Math.sin(el), Math.sin(th) * Math.cos(el)];
    push(buf, [n[0] * rad, 0.7 + n[1] * rad, n[2] * rad], n, MAT.FILLER);
  }

  const model = finish(buf);
  cache.set(open, model);
  return model;
}
