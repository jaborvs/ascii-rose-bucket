import { MAT, LEVELS } from './materials.js';

// Cada bloque: líneas + función glifo -> código de color. El bloque se centra entero
// (no línea a línea) para que la fachada no se desalinee.
const COLOR_CODE = {
  r: MAT.RED, y: MAT.YELLOW, s: MAT.STONE, o: MAT.ROOF, w: MAT.WINDOW, g: MAT.LEAF, f: MAT.WHITE, d: MAT.GOLD,
};

function palace() {
  const wingWinTop = '  _    _    _  ';
  const wingWin = ' |#|  |#|  |#| ';
  const centerWinTop = '   _   _   _   _   ';
  const centerWin = '  |#| |#| |#| |#|  ';
  const cols = ' ||   ||   ||   || ';
  const row = (wing, center) => `|${wing}|${center}|${wing}|`;
  const pole = ' '.repeat(26);
  return [
    `${pole}|=========`,
    `${pole}|$$$$$$$$$`,
    `${pole}|=========`,
    `${pole}|`,
    `${' '.repeat(17)}${'_'.repeat(19)}${' '.repeat(17)}`,
    `${' '.repeat(16)}/${'^'.repeat(19)}\\${' '.repeat(16)}`,
    ` ${'_'.repeat(15)}|${centerWinTop}|${'_'.repeat(15)} `,
    `/${'^'.repeat(15)}|${centerWin}|${'^'.repeat(15)}\\`,
    row(wingWinTop, '_'.repeat(19)),
    row(wingWin, cols),
    row(' '.repeat(15), cols),
    row(wingWinTop, cols),
    row(wingWin, cols),
    row('_'.repeat(15), '_||___||___||___||_'),
    `~${'~'.repeat(51)}~`,
  ];
}

const FONT = {
  L: ['#    ', '#    ', '#    ', '#    ', '#####'],
  A: [' ### ', '#   #', '#####', '#   #', '#   #'],
  M: ['#   #', '## ##', '# # #', '#   #', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', ' ### '],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #'],
  C: [' ####', '#    ', '#    ', '#    ', ' ####'],
  ' ': ['  ', '  ', '  ', '  ', '  '],
};

// Letras de bloque macizas: con '#' sueltos las letras no se leen a tamaño de móvil.
function banner(text) {
  return FONT.L.map((_, row) => [...text].map(ch => FONT[ch][row].replaceAll('#', '█')).join(' '));
}

const BLOCKS = [
  {
    lines: palace(),
    color: ch => ({ '=': 'r', $: 'y', '#': 'w', '^': 'o', '~': 'g' })[ch] ?? 's',
  },
  { lines: [''], color: () => 's' },
  { lines: banner('LA MONCLOA'), color: () => 'f' },
  { lines: [''], color: () => 's' },
  { lines: ['G O B I E R N O   D E   E S P A Ñ A'], color: () => 'd' },
];

function compose(blocks) {
  const width = Math.max(...blocks.flatMap(b => b.lines.map(l => [...l].length)));
  const lines = [], mask = [];
  for (const b of blocks) {
    const bw = Math.max(...b.lines.map(l => [...l].length));
    const pad = ' '.repeat(Math.floor((width - bw) / 2));
    for (const l of b.lines) {
      const line = (pad + l).padEnd(width);
      lines.push(line);
      mask.push([...line].map(ch => (ch === ' ' ? ' ' : b.color(ch))).join(''));
    }
  }
  return { lines, mask, width, height: lines.length };
}

export const MONCLOA = compose(BLOCKS);

// Celdas del arte centradas en una rejilla de `cols` columnas, empezando en la fila `top`.
export function artCells(art, { cols, top }) {
  const xs = art.lines.flatMap(l => [...l].map((ch, x) => (ch === ' ' ? null : x)).filter(x => x !== null));
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const left = Math.floor((cols - (maxX - minX + 1)) / 2) - minX;
  const rowsWithInk = art.lines.map((l, y) => (l.trim() ? y : null)).filter(y => y !== null);
  const minY = Math.min(...rowsWithInk);
  const cells = [];
  art.lines.forEach((line, y) => {
    [...line].forEach((ch, x) => {
      if (ch === ' ') return;
      cells.push({ x: x + left, y: y - minY + top, ch, mat: COLOR_CODE[art.mask[y][x]], lum: LEVELS - 1 });
    });
  });
  return cells;
}
