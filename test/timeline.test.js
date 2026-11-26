import test from 'node:test';
import assert from 'node:assert/strict';
import { phaseAt, captionAt, ramp } from '../src/timeline.js';
import { CUES, CAPTIONS } from '../src/config.js';

const cues = { start: 100, morphStart: 150, morphEnd: 160, end: 180 };

test('phaseAt walks through bouquet, morph, logo and end', () => {
  assert.equal(phaseAt(120, cues), 'bouquet');
  assert.equal(phaseAt(155, cues), 'morph');
  assert.equal(phaseAt(170, cues), 'logo');
  assert.equal(phaseAt(181, cues), 'end');
});

test('ramp clamps to [0, 1]', () => {
  assert.equal(ramp(0, 10, 20), 0);
  assert.equal(ramp(15, 10, 20), 0.5);
  assert.equal(ramp(30, 10, 20), 1);
});

const caps = [{ from: 10, to: 20, text: 'Hola María' }];

test('captionAt is null outside the caption window', () => {
  assert.equal(captionAt(9.9, caps), null);
  assert.equal(captionAt(20.1, caps), null);
});

test('captionAt types the text progressively', () => {
  const early = captionAt(10.4, caps);
  assert.ok(early.text.length > 0 && early.text.length < 'Hola María'.length);
  assert.ok('Hola María'.startsWith(early.text));
  assert.equal(captionAt(15, caps).text, 'Hola María');
});

test('captionAt fades out at the end of its window', () => {
  assert.equal(captionAt(15, caps).opacity, 1);
  assert.ok(captionAt(19.9, caps).opacity < 0.5);
});

test('configured captions are ordered, non-overlapping and inside the show', () => {
  let prevEnd = -Infinity;
  for (const c of CAPTIONS) {
    assert.ok(c.from >= prevEnd, `caption "${c.text}" overlaps the previous one`);
    assert.ok(c.from < c.to);
    assert.ok(c.from >= CUES.start && c.to <= CUES.end);
    prevEnd = c.to;
  }
});
