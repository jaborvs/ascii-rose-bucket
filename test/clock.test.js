import test from 'node:test';
import assert from 'node:assert/strict';
import { createSongClock } from '../src/clock.js';

test('advances by wall time while playing without a player reading (silent mode)', () => {
  const clock = createSongClock({ start: 150 });
  clock.update({ dt: 0.5, playing: true, playerTime: null });
  assert.equal(clock.time, 150.5);
});

test('holds while the song is not playing (buffering, ad, pause)', () => {
  const clock = createSongClock({ start: 150 });
  clock.update({ dt: 2, playing: false, playerTime: 150 });
  assert.equal(clock.time, 150);
});

test('snaps to the player when drift exceeds the threshold', () => {
  const clock = createSongClock({ start: 150, maxDrift: 0.25 });
  clock.update({ dt: 0.1, playing: true, playerTime: 153 });
  assert.equal(clock.time, 153);
});

test('keeps smooth local time when the player reading is close', () => {
  const clock = createSongClock({ start: 150, maxDrift: 0.25 });
  clock.update({ dt: 0.1, playing: true, playerTime: 150.0 });
  assert.ok(Math.abs(clock.time - 150.1) < 1e-9);
});

test('reset moves the clock back to the given time', () => {
  const clock = createSongClock({ start: 150 });
  clock.update({ dt: 30, playing: true, playerTime: null });
  clock.reset(150);
  assert.equal(clock.time, 150);
});
