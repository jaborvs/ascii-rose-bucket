import test from 'node:test';
import assert from 'node:assert/strict';
import { roseGeometry, buildBouquetModel } from '../src/rose.js';
import { MAT } from '../src/materials.js';

function maxRadius(g) {
  let m = 0;
  for (let i = 0; i < g.count; i++) {
    const x = g.pos[i * 3], z = g.pos[i * 3 + 2];
    m = Math.max(m, Math.hypot(x, z));
  }
  return m;
}

test('a bud (open=0) is narrower than a bloomed rose (open=1)', () => {
  assert.ok(maxRadius(roseGeometry(0)) < 0.6 * maxRadius(roseGeometry(1)));
});

test('rose normals are unit length', () => {
  const g = roseGeometry(1);
  for (let i = 0; i < g.count; i += 97) {
    const n = Math.hypot(g.nrm[i * 3], g.nrm[i * 3 + 1], g.nrm[i * 3 + 2]);
    assert.ok(Math.abs(n - 1) < 1e-3, `normal ${i} has length ${n}`);
  }
});

test('bouquet model contains every bouquet material', () => {
  const m = buildBouquetModel(1);
  const mats = new Set(m.mat);
  for (const k of ['PETAL', 'STEM', 'LEAF', 'WRAP', 'RIBBON', 'FILLER']) {
    assert.ok(mats.has(MAT[k]), `missing ${k}`);
  }
});

test('every bouquet point has a finite position and normal', () => {
  const m = buildBouquetModel(1);
  for (let i = 0; i < m.count * 3; i++) {
    assert.ok(Number.isFinite(m.pos[i]) && Number.isFinite(m.nrm[i]), `point ${Math.floor(i / 3)} (material ${m.mat[Math.floor(i / 3)]}) is not finite`);
  }
});

test('roses stick out above the wrapping paper', () => {
  const m = buildBouquetModel(1);
  let petalTop = -Infinity, wrapTop = -Infinity;
  for (let i = 0; i < m.count; i++) {
    const y = m.pos[i * 3 + 1];
    if (m.mat[i] === MAT.PETAL) petalTop = Math.max(petalTop, y);
    if (m.mat[i] === MAT.WRAP) wrapTop = Math.max(wrapTop, y);
  }
  assert.ok(petalTop > wrapTop + 0.5);
});
