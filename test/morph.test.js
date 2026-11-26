import test from 'node:test';
import assert from 'node:assert/strict';
import { planMorph, particleAt } from '../src/morph.js';

const grid = { cols: 20, rows: 20 };
const from = [
  { x: 1, y: 1, ch: '@', mat: 1 },
  { x: 2, y: 1, ch: '#', mat: 1 },
  { x: 3, y: 1, ch: '*', mat: 2 },
];
const to = [
  { x: 10, y: 10, ch: 'L', mat: 7 },
  { x: 11, y: 10, ch: 'A', mat: 7 },
];
const key = p => `${Math.round(p.x)},${Math.round(p.y)},${p.ch}`;

test('every target cell is reached exactly once at the end', () => {
  const ps = planMorph(from, to, { ...grid, seed: 1 });
  const ends = ps.map(p => particleAt(p, 1)).filter(s => s.alpha > 0).map(key).sort();
  assert.deepEqual(ends, to.map(key).sort());
});

test('particles start on their source cells', () => {
  const ps = planMorph(from, to, { ...grid, seed: 1 });
  const starts = ps.map(p => particleAt(p, 0)).filter(s => s.alpha > 0).map(key).sort();
  assert.deepEqual(starts, from.map(key).sort());
});

test('leftover source cells fall off the bottom of the screen', () => {
  const ps = planMorph(from, to, { ...grid, seed: 1 });
  const leftovers = ps.filter(p => p.target === null);
  assert.equal(leftovers.length, 1);
  assert.ok(particleAt(leftovers[0], 1).y >= grid.rows);
});

test('targets without a source fly in from below the screen', () => {
  const ps = planMorph(from.slice(0, 1), to, { ...grid, seed: 1 });
  const newcomers = ps.filter(p => p.source === null);
  assert.equal(newcomers.length, 1);
  assert.ok(particleAt(newcomers[0], 0).y >= grid.rows);
});

test('the plan is deterministic for a given seed', () => {
  const a = planMorph(from, to, { ...grid, seed: 42 }).map(p => particleAt(p, 0.5));
  const b = planMorph(from, to, { ...grid, seed: 42 }).map(p => particleAt(p, 0.5));
  assert.deepEqual(a, b);
});
