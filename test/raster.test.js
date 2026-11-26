import test from 'node:test';
import assert from 'node:assert/strict';
import { createGrid, plot, charForLum, renderModel, gridCells } from '../src/raster.js';
import { buildBouquetModel } from '../src/rose.js';
import { MAT } from '../src/materials.js';

test('plot keeps the nearest sample per cell', () => {
  const g = createGrid(4, 4);
  plot(g, 1, 1, 0.2, 'a', MAT.PETAL, 3);
  plot(g, 1, 1, 0.9, 'b', MAT.LEAF, 3);
  plot(g, 1, 1, 0.5, 'c', MAT.STEM, 3);
  const cell = gridCells(g).find(c => c.x === 1 && c.y === 1);
  assert.equal(cell.ch, 'b');
  assert.equal(cell.mat, MAT.LEAF);
});

test('plot ignores samples outside the grid', () => {
  const g = createGrid(4, 4);
  plot(g, -1, 0, 1, 'a', MAT.PETAL, 0);
  plot(g, 4, 0, 1, 'a', MAT.PETAL, 0);
  plot(g, 0, 4, 1, 'a', MAT.PETAL, 0);
  assert.equal(gridCells(g).length, 0);
});

test('charForLum maps dark to sparse and bright to dense glyphs', () => {
  assert.equal(charForLum(0), '.');
  assert.equal(charForLum(1), '@');
  assert.equal(charForLum(2), '@');
});

const view = { rotY: 0, tiltX: 0.25, offsetY: 0, scale: 17, cx: 32, cy: 40 };

test('rendering the bouquet fills cells inside the grid', () => {
  const g = createGrid(64, 68);
  renderModel(g, buildBouquetModel(1), view);
  const cells = gridCells(g);
  assert.ok(cells.length > 400, `only ${cells.length} cells drawn`);
  assert.ok(cells.every(c => c.x >= 0 && c.x < 64 && c.y >= 0 && c.y < 68));
});

test('a full turn renders the same frame as no turn', () => {
  const model = buildBouquetModel(1);
  const a = createGrid(64, 68), b = createGrid(64, 68);
  renderModel(a, model, view);
  renderModel(b, model, { ...view, rotY: 2 * Math.PI });
  assert.deepEqual(gridCells(a), gridCells(b));
});

test('a bouquet pushed below the screen draws nothing', () => {
  const g = createGrid(64, 68);
  renderModel(g, buildBouquetModel(1), { ...view, offsetY: -20 });
  assert.equal(gridCells(g).length, 0);
});
