// Maqueta un subtítulo como texto ASCII dentro de un marco +--+ / | |.
// Devuelve celdas {x, y, ch, k}: k es el índice del carácter en el texto original
// (para escribirlo letra a letra) o -1 en el marco.
export function layoutCaption(text, maxInner) {
  const lines = wrap([...text], maxInner);
  const inner = Math.max(1, ...lines.map(l => l.length));
  const width = inner + 4;
  const height = lines.length + 2;
  const cells = [];

  for (let x = 0; x < width; x++) {
    const ch = x === 0 || x === width - 1 ? '+' : '-';
    cells.push({ x, y: 0, ch, k: -1 }, { x, y: height - 1, ch, k: -1 });
  }
  for (let y = 1; y < height - 1; y++) {
    cells.push({ x: 0, y, ch: '|', k: -1 }, { x: width - 1, y, ch: '|', k: -1 });
  }
  lines.forEach((line, i) => {
    const left = 2 + Math.floor((inner - line.length) / 2);
    line.forEach((c, j) => {
      if (c.k >= 0) cells.push({ x: left + j, y: i + 1, ch: c.ch, k: c.k });
    });
  });
  return { width, height, cells };
}

const SPACE = { ch: ' ', k: -1 };

function wrap(chars, max) {
  const lines = [];
  let line = [];
  const flush = () => {
    if (line.length) lines.push(line);
    line = [];
  };

  for (const token of tokenize(chars)) {
    if (token === '\n') {
      flush();
      continue;
    }
    if (token.length > max) {
      flush();
      for (let i = 0; i < token.length; i += max) lines.push(token.slice(i, i + max));
      continue;
    }
    if (line.length && line.length + 1 + token.length > max) flush();
    line = line.length ? [...line, SPACE, ...token] : [...token];
  }
  flush();
  return lines.length ? lines : [[]];
}

// Palabras como listas de {ch, k}; '\n' como separador duro.
function tokenize(chars) {
  const tokens = [];
  let word = [];
  chars.forEach((ch, k) => {
    if (/\s/.test(ch)) {
      if (word.length) tokens.push(word);
      word = [];
      if (ch === '\n') tokens.push('\n');
    } else {
      word.push({ ch, k });
    }
  });
  if (word.length) tokens.push(word);
  return tokens;
}
