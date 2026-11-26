import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutCaption } from '../src/caption.js';

const textOf = layout =>
  layout.cells.filter(c => c.k >= 0).sort((a, b) => a.k - b.k).map(c => c.ch).join('');

const rowsOf = (layout, word) => {
  const cells = layout.cells.filter(c => c.k >= 0).sort((a, b) => a.k - b.k);
  const s = cells.map(c => c.ch).join('');
  const i = s.indexOf(word);
  return new Set(cells.slice(i, i + word.length).map(c => c.y));
};

test('ajusta la frase al ancho máximo sin salirse del marco', () => {
  const text = 'De tu cabeza, de tu esfuerzo y de todo lo que le das a este país.';
  const l = layoutCaption(text, 20);
  assert.ok(l.width <= 24);
  for (const c of l.cells) {
    assert.ok(c.x >= 0 && c.x < l.width && c.y >= 0 && c.y < l.height);
  }
  assert.ok(l.height > 3, 'debe ocupar varias líneas');
});

test('conserva todas las letras en orden y no corta palabras que caben', () => {
  const text = 'Estoy muy, muy orgulloso de ti.';
  const l = layoutCaption(text, 16);
  assert.equal(textOf(l), text.replace(/\s/g, ''));
  assert.equal(rowsOf(l, 'orgulloso').size, 1);
});

test('el índice k de cada letra coincide con su posición en el texto original', () => {
  const text = 'Hola María';
  const l = layoutCaption(text, 40);
  for (const c of l.cells.filter(c => c.k >= 0)) assert.equal([...text][c.k], c.ch);
});

test('un salto de línea explícito empieza línea nueva', () => {
  const l = layoutCaption('Con todo mi amor,\nBorja', 40);
  const [a] = rowsOf(l, 'Con');
  const [b] = rowsOf(l, 'Borja');
  assert.notEqual(a, b);
});

test('una palabra más larga que el ancho se parte', () => {
  const l = layoutCaption('supercalifragilístico', 8);
  assert.ok(l.width <= 12);
  assert.equal(textOf(l), 'supercalifragilístico');
});

test('dibuja un marco ASCII con esquinas +', () => {
  const l = layoutCaption('Hola', 40);
  const at = (x, y) => l.cells.find(c => c.x === x && c.y === y)?.ch;
  assert.equal(l.width, 4 + 4);
  assert.equal(l.height, 3);
  assert.equal(at(0, 0), '+');
  assert.equal(at(l.width - 1, 0), '+');
  assert.equal(at(0, l.height - 1), '+');
  assert.equal(at(l.width - 1, l.height - 1), '+');
  assert.equal(at(0, 1), '|');
  assert.equal(at(1, 0), '-');
});
