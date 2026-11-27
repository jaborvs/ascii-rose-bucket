import { test } from 'node:test';
import assert from 'node:assert/strict';
import { giftCells, GIFT_HEIGHT } from '../src/gift.js';
import { MAT } from '../src/materials.js';

const COLS = 60;
const BOTTOM = 50;
const ink = cells => cells.filter(c => c.ch !== ' ');

test('la caja cerrada apoya en la fila bottom y está centrada en la rejilla', () => {
  const cells = giftCells({ cols: COLS, bottom: BOTTOM });
  const ys = ink(cells).map(c => c.y);
  const xs = ink(cells).map(c => c.x);
  assert.equal(Math.max(...ys), BOTTOM);
  assert.equal(Math.max(...ys) - Math.min(...ys) + 1, GIFT_HEIGHT);
  assert.equal(Math.min(...xs) + Math.max(...xs), COLS - 1, 'simétrica respecto al centro');
});

test('la cinta cruza la caja por el centro', () => {
  const ribbon = ink(giftCells({ cols: COLS, bottom: BOTTOM })).filter(c => c.mat === MAT.PETAL && c.y === BOTTOM - 3);
  assert.deepEqual(ribbon.map(c => c.x).sort((a, b) => a - b), [COLS / 2 - 1, COLS / 2]);
});

test('el interior de la caja tapa lo que hay detrás (celdas en blanco)', () => {
  const cells = giftCells({ cols: COLS, bottom: BOTTOM });
  const inside = cells.find(c => c.x === COLS / 2 - 6 && c.y === BOTTOM - 3);
  assert.ok(inside, 'debe existir una celda en el interior');
  assert.equal(inside.ch, ' ');
});

test('al abrirse, la tapa sale volando hacia arriba y desaparece', () => {
  const closed = giftCells({ cols: COLS, bottom: BOTTOM });
  const half = giftCells({ cols: COLS, bottom: BOTTOM, lid: 0.5 });
  const open = giftCells({ cols: COLS, bottom: BOTTOM, lid: 1 });
  const top = cells => Math.min(...ink(cells).map(c => c.y));
  assert.ok(top(half) < top(closed) - 4);
  assert.ok(ink(open).every(c => c.y > top(closed) + 5), 'sin tapa solo queda el cuerpo');
});

test('el cuerpo se deshace al desvanecerse', () => {
  const body = ink(giftCells({ cols: COLS, bottom: BOTTOM, lid: 1 })).length;
  const half = ink(giftCells({ cols: COLS, bottom: BOTTOM, lid: 1, fade: 0.5 })).length;
  assert.ok(half > body * 0.25 && half < body * 0.75);
  assert.equal(giftCells({ cols: COLS, bottom: BOTTOM, lid: 1, fade: 1 }).length, 0);
});
