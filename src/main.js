import { SONG, CUES, CAPTIONS } from './config.js';
import { createSongClock } from './clock.js';
import { phaseAt, captionAt, ramp } from './timeline.js';
import { buildBouquetModel } from './rose.js';
import { createGrid, clearGrid, renderModel, gridCells, CELL_ASPECT } from './raster.js';
import { planMorph, particleAt } from './morph.js';
import { MONCLOA, artCells } from './art.js';
import { PALETTE, LEVELS, MAT } from './materials.js';
import { layoutCaption } from './caption.js';
import { createYouTubePlayer } from './player.js';

// Caja de diseño: el ramo y el logo se dibujan para caber en DESIGN_COLS × DESIGN_ROWS celdas.
// La rejilla real llena toda la pantalla; lo que sobra queda como margen alrededor.
const DESIGN_COLS = 62;
const DESIGN_ROWS = 64;
const FONT = '"DejaVu Sans Mono", Menlo, Consolas, "Courier New", monospace';
const BLOOM_STEPS = 16;
const BOUQUET_SCALE = 20.5;
const CLIMAX = 204.5; // "It's only me and you"
const SHOW_PLAYER_AFTER_MS = 3000;
const FRAME_MS = 1000 / 30;
const CAPTION_SCALE = { md: 1.8, lg: 2.3 }; // tamaño de letra del subtítulo, en celdas de la rejilla
const SCRAMBLE = '.:-=+*#%@';
const SCRAMBLE_TAIL = 3;

const $ = id => document.getElementById(id);
const canvas = $('screen');
const ctx = canvas.getContext('2d');
const clock = createSongClock({ start: CUES.start });
let grid = createGrid(1, 1);
let art = [];
let view = { scale: BOUQUET_SCALE, cx: 0, cy: 0 };

let player = null;
let silent = false;
let state = 'idle'; // idle | running | ended
let stalledSince = null;
let morphPlan = null;
let lastTick = performance.now();
let lastRender = 0;
let cell = { w: 0, h: 0 };
let fontPx = 10;
const captionLayouts = new Map();

const easeOutCubic = t => 1 - (1 - t) ** 3;
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// ---------- Canvas ----------

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = Math.min(width / DESIGN_COLS, (height / DESIGN_ROWS) * CELL_ASPECT);
  cell = { w, h: w / CELL_ASPECT };
  const cols = Math.ceil(width / cell.w);
  const rows = Math.ceil(height / cell.h);
  grid = createGrid(cols, rows);
  view = { scale: BOUQUET_SCALE, cx: cols / 2, cy: Math.round(rows * 0.62) };
  art = artCells(MONCLOA, { cols, top: Math.round(rows * 0.52) - MONCLOA.height });
  morphPlan = null;

  ctx.font = `bold 100px ${FONT}`;
  const ratio = ctx.measureText('M').width / 100;
  fontPx = Math.min(cell.w / ratio, cell.h * 1.1);
  ctx.font = `bold ${fontPx}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lastRender = 0;
}

function drawChar(ch, x, y, mat, lum) {
  ctx.fillStyle = PALETTE[mat][lum];
  ctx.fillText(ch, (x + 0.5) * cell.w, (y + 0.5) * cell.h);
}

function drawGrid() {
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const i = r * grid.cols + c;
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
    ...view,
    rotY: 0.55 * (t - CUES.start),
    tiltX: 0.6 + 0.05 * Math.sin(t * 0.7),
    offsetY: -5 * (1 - rise),
    scale: view.scale * (1 + 0.07 * pulse),
  });
}

function drawMorph(t) {
  if (!morphPlan) {
    renderBouquet(CUES.morphStart);
    morphPlan = planMorph(gridCells(grid), art, { cols: grid.cols, rows: grid.rows, seed: 2026 });
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

// Subtítulo en ASCII: misma fuente que el ramo, más grande, dentro de un marco +--+.
// Las últimas letras escritas aún se están "descifrando" y pasan por la rampa de caracteres.
function drawCaption(t) {
  const c = captionAt(t, CAPTIONS);
  if (!c || c.opacity <= 0) return;
  const full = CAPTIONS.find(x => x.from === c.from).text;
  const k = CAPTION_SCALE[c.size];
  const maxInner = Math.floor(Math.min(grid.cols, DESIGN_COLS) / k) - 4;
  const key = `${c.from}|${maxInner}`;
  if (!captionLayouts.has(key)) captionLayouts.set(key, layoutCaption(full, maxInner));
  const layout = captionLayouts.get(key);

  const { width, height } = canvas.getBoundingClientRect();
  const cw = cell.w * k;
  const chh = cell.h * k;
  const x0 = (width - layout.width * cw) / 2;
  const y0 = height * (c.pos === 'top' ? 0.06 : 0.58);
  const shown = [...c.text].length;
  const typing = shown < [...full].length;

  ctx.globalAlpha = c.opacity;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(x0, y0, layout.width * cw, layout.height * chh);
  ctx.font = `bold ${fontPx * k}px ${FONT}`;
  ctx.shadowColor = 'rgba(255, 40, 80, 0.8)';
  ctx.shadowBlur = cell.w * 1.5;
  for (const cl of layout.cells) {
    if (cl.k >= shown) continue;
    let ch = cl.ch;
    let color = PALETTE[MAT.WHITE][LEVELS - 1];
    if (cl.k < 0) {
      color = PALETTE[MAT.PETAL][5];
    } else if (typing && cl.k >= shown - SCRAMBLE_TAIL) {
      ch = SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
      color = PALETTE[MAT.PETAL][LEVELS - 1];
    }
    ctx.fillStyle = color;
    ctx.fillText(ch, x0 + (cl.x + 0.5) * cw, y0 + (cl.y + 0.5) * chh);
  }
  ctx.shadowBlur = 0;
  ctx.font = `bold ${fontPx}px ${FONT}`;
  ctx.globalAlpha = 1;
}

function render(t) {
  const { width, height } = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, width, height);
  const phase = phaseAt(t, CUES);
  if (phase === 'bouquet') {
    renderBouquet(t);
    drawGrid();
  } else if (phase === 'morph') {
    drawMorph(t);
  } else {
    drawLogo(t, phase === 'logo' ? 1 : 0.55);
  }
  drawCaption(t);
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

$('start').addEventListener('click', start);
$('replay').addEventListener('click', start);
window.addEventListener('resize', resize);
resize();
warmUp();
requestAnimationFrame(tick);
