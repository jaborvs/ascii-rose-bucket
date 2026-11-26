import { SONG, CUES, CAPTIONS, TIKTOK } from './config.js';
import { createSongClock } from './clock.js';
import { phaseAt, captionAt, ramp } from './timeline.js';
import { buildBouquetModel } from './rose.js';
import { createGrid, clearGrid, renderModel, gridCells } from './raster.js';
import { planMorph, particleAt } from './morph.js';
import { MONCLOA, artCells } from './art.js';
import { PALETTE, LEVELS } from './materials.js';
import { createYouTubePlayer } from './player.js';

const COLS = 64;
const ROWS = 68;
const FONT = '"DejaVu Sans Mono", Menlo, Consolas, "Courier New", monospace';
const BLOOM_STEPS = 16;
const ART_TOP = 15;
const VIEW = { scale: 18, cx: 30, cy: 43 };
const CLIMAX = 204.5; // "It's only me and you"
const SHOW_PLAYER_AFTER_MS = 3000;
const FRAME_MS = 1000 / 30;

const $ = id => document.getElementById(id);
const canvas = $('screen');
const ctx = canvas.getContext('2d');
const grid = createGrid(COLS, ROWS);
const clock = createSongClock({ start: CUES.start });
const art = artCells(MONCLOA, { cols: COLS, top: ART_TOP });

let player = null;
let silent = false;
let state = 'idle'; // idle | running | ended
let stalledSince = null;
let morphPlan = null;
let lastTick = performance.now();
let lastRender = 0;
let cell = { w: 0, h: 0 };
let captionKey = '';

const easeOutCubic = t => 1 - (1 - t) ** 3;
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

$('handle').textContent = TIKTOK.handle;
$('desc').textContent = TIKTOK.description;
$('song').textContent = `${SONG.title}   ·   ${SONG.title}`;

// ---------- Canvas ----------

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cell = { w: width / COLS, h: height / ROWS };
  ctx.font = `bold 100px ${FONT}`;
  const ratio = ctx.measureText('M').width / 100;
  ctx.font = `bold ${Math.min(cell.w / ratio, cell.h * 1.1)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lastRender = 0;
}

function drawChar(ch, x, y, mat, lum) {
  ctx.fillStyle = PALETTE[mat][lum];
  ctx.fillText(ch, (x + 0.5) * cell.w, (y + 0.5) * cell.h);
}

function drawGrid() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      if (grid.z[i] > 0) drawChar(grid.ch[i], c, r, grid.mat[i], grid.lum[i]);
    }
  }
}

// ---------- Escenas ----------

function bloomAt(t) {
  const open = easeInOut(ramp(t, CUES.bloomStart, CUES.bloomEnd));
  return Math.round(open * (BLOOM_STEPS - 1)) / (BLOOM_STEPS - 1);
}

function renderBouquet(t) {
  const rise = easeOutCubic(ramp(t, CUES.riseStart, CUES.riseEnd));
  const pulse = t > CLIMAX ? Math.exp(-(t - CLIMAX) * 2.5) : 0;
  clearGrid(grid);
  renderModel(grid, buildBouquetModel(bloomAt(t)), {
    ...VIEW,
    rotY: 0.55 * (t - CUES.start),
    tiltX: 0.6 + 0.05 * Math.sin(t * 0.7),
    offsetY: -5 * (1 - rise),
    scale: VIEW.scale * (1 + 0.07 * pulse),
  });
}

function drawMorph(t) {
  if (!morphPlan) {
    renderBouquet(CUES.morphStart);
    morphPlan = planMorph(gridCells(grid), art, { cols: COLS, rows: ROWS, seed: 2026 });
  }
  const p = ramp(t, CUES.morphStart, CUES.morphEnd);
  for (const particle of morphPlan) {
    const s = particleAt(particle, p);
    if (s.alpha <= 0) continue;
    ctx.globalAlpha = s.alpha;
    drawChar(s.ch, s.x, s.y, s.mat, s.lum);
  }
  ctx.globalAlpha = 1;
}

function drawLogo(t, alpha) {
  ctx.globalAlpha = alpha;
  for (const c of art) {
    const wave = 0.5 + 0.5 * Math.sin(c.x * 0.35 + c.y * 0.2 - t * 3);
    drawChar(c.ch, c.x, c.y, c.mat, Math.min(LEVELS - 1, 6 + Math.round(3 * wave)));
  }
  ctx.globalAlpha = 1;
}

function updateCaption(t) {
  const el = $('caption');
  const c = captionAt(t, CAPTIONS);
  if (!c) {
    el.style.opacity = 0;
    return;
  }
  const typing = c.text.length < CAPTIONS.find(x => x.from === c.from).text.length;
  const key = `${c.from}|${c.text}|${typing}`;
  if (key !== captionKey) {
    captionKey = key;
    el.textContent = c.text;
    el.className = `caption ${c.pos} ${c.size}${typing ? ' typing' : ''}`;
  }
  el.style.opacity = c.opacity;
}

function render(t) {
  const { width, height } = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, width, height);
  const phase = phaseAt(t, CUES);
  $('frame').classList.toggle('finale', phase !== 'bouquet');
  if (phase === 'bouquet') {
    renderBouquet(t);
    drawGrid();
  } else if (phase === 'morph') {
    drawMorph(t);
  } else {
    drawLogo(t, phase === 'logo' ? 1 : 0.55);
  }
  updateCaption(t);
  $('progress').style.width = `${ramp(t, CUES.start, CUES.end) * 100}%`;
}

// ---------- Música ----------

function showNotice(text) {
  const el = $('notice');
  el.textContent = text;
  el.hidden = false;
  setTimeout(() => (el.hidden = true), 8000);
}

function goSilent(err) {
  console.warn('Sin música:', err);
  player = null;
  silent = true;
  $('yt-wrap').classList.remove('show');
  showNotice(`🔇 No se ha podido cargar la música (${err.message}). Pon «Coming Up Roses» de Harry Styles de fondo 🌹`);
}

createYouTubePlayer({ elementId: 'yt', videoId: SONG.videoId, start: CUES.start, onError: goSilent })
  .then(p => {
    player = p;
    if (state === 'running') {
      player.seek(clock.time);
      player.play();
    }
  })
  .catch(goSilent);

// ---------- Flujo ----------

// ?t=200 permite empezar en otro segundo de la canción (útil para revisar una escena).
const FROM = Number(new URLSearchParams(location.search).get('t')) || CUES.start;

function start() {
  $('start').hidden = true;
  $('replay').hidden = true;
  clock.reset(FROM);
  morphPlan = null;
  state = 'running';
  stalledSince = performance.now();
  // play() dentro del gesto del usuario: requisito de los navegadores móviles para sonar.
  if (player) {
    player.seek(FROM);
    player.play();
  }
}

function finish() {
  state = 'ended';
  player?.pause();
  $('yt-wrap').classList.remove('show');
  $('replay').hidden = false;
}

function tick(now) {
  const dt = Math.min(0.1, (now - lastTick) / 1000);
  lastTick = now;

  if (state === 'running') {
    let playing = true;
    let playerTime = null;
    if (player && !silent) {
      playing = player.playing();
      playerTime = player.time();
      // Si ella pulsó ▶ en el vídeo y arrancó desde el principio, saltamos al instrumental.
      if (playing && playerTime < CUES.start - 1) {
        player.seek(CUES.start);
        playing = false;
      }
    }
    clock.update({ dt, playing, playerTime: playing ? playerTime : null });

    if (playing) {
      stalledSince = null;
      $('yt-wrap').classList.remove('show');
    } else {
      stalledSince ??= now;
      if (player && now - stalledSince > SHOW_PLAYER_AFTER_MS) $('yt-wrap').classList.add('show');
    }
    if (clock.time >= CUES.end) finish();
  }

  if (state !== 'idle' && now - lastRender >= FRAME_MS) {
    lastRender = now;
    render(clock.time);
  }
  requestAnimationFrame(tick);
}

// Precalcula las fases de apertura de las rosas mientras ella lee la portada.
function warmUp(step = 0) {
  if (step >= BLOOM_STEPS) return;
  buildBouquetModel(step / (BLOOM_STEPS - 1));
  setTimeout(() => warmUp(step + 1), 0);
}

// ---------- TikTok: me gusta y doble toque ----------

let likes = 8341;
let liked = false;
function like(force) {
  if (liked && force) return;
  liked = force || !liked;
  likes += liked ? 1 : -1;
  $('like').classList.toggle('liked', liked);
  $('likes').textContent = likes.toLocaleString('es-ES');
}

let lastTap = { t: 0, x: 0, y: 0 };
$('frame').addEventListener('pointerup', e => {
  if (state === 'idle' || e.target.closest('button, .yt')) return;
  const now = performance.now();
  const near = Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 40;
  if (now - lastTap.t < 320 && near) {
    const box = $('frame').getBoundingClientRect();
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.textContent = '❤';
    heart.style.left = `${e.clientX - box.left}px`;
    heart.style.top = `${e.clientY - box.top}px`;
    $('frame').append(heart);
    heart.addEventListener('animationend', () => heart.remove());
    like(true);
    lastTap.t = 0;
  } else {
    lastTap = { t: now, x: e.clientX, y: e.clientY };
  }
});

$('like').addEventListener('click', () => like(false));
$('start').addEventListener('click', start);
$('replay').addEventListener('click', start);
window.addEventListener('resize', resize);
resize();
warmUp();
requestAnimationFrame(tick);
