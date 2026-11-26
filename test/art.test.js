import test from 'node:test';
import assert from 'node:assert/strict';
import { MONCLOA, artCells } from '../src/art.js';
import { MAT } from '../src/materials.js';

test('every visible art glyph has a colour in the mask', () => {
  assert.equal(MONCLOA.lines.length, MONCLOA.mask.length);
  MONCLOA.lines.forEach((line, y) => {
    [...line].forEach((ch, x) => {
      if (ch !== ' ') assert.ok(MONCLOA.mask[y][x] && MONCLOA.mask[y][x] !== ' ', `row ${y} col ${x} '${ch}' has no colour`);
    });
  });
});

test('the art fits the 64-column grid', () => {
  for (const line of MONCLOA.lines) assert.ok([...line].length <= 64, `too wide: "${line}"`);
});

test('artCells centres the art horizontally and maps colours to materials', () => {
  const cells = artCells(MONCLOA, { cols: 64, top: 5 });
  const xs = cells.map(c => c.x);
  const left = Math.min(...xs), right = 63 - Math.max(...xs);
  assert.ok(Math.abs(left - right) <= 1, `left margin ${left}, right margin ${right}`);
  assert.equal(Math.min(...cells.map(c => c.y)), 5);
  const valid = new Set(Object.values(MAT));
  assert.ok(cells.every(c => valid.has(c.mat)));
});
