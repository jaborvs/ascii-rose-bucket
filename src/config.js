// Todo lo personalizable está aquí. Los tiempos son segundos del vídeo oficial de YouTube.
// Referencias medidas en el vídeo: "There's only me and you" ≈ 147.9 s, empieza el instrumental ≈ 152.5 s,
// "It's only me and you" ≈ 204.5 s, caída ≈ 210 s, "la-la-la" 212–238 s.

export const SONG = {
  videoId: 'M4qX5wzx-wY', // Harry Styles - Coming Up Roses (Official Video)
};

export const CUES = {
  start: 152.5,
  riseStart: 152.8,
  riseEnd: 161,
  bloomStart: 156,
  bloomEnd: 168,
  morphStart: 209.8,
  morphEnd: 221,
  end: 239,
};

// pos: 'top' (sobre el ramo) | 'bottom' (bajo el logo). size: 'md' | 'lg'.
// Se dibujan en ASCII con la misma fuente que el ramo: mejor sin emojis.
export const CAPTIONS = [
  { from: 153.2, to: 159.2, text: 'Para María @}->--', pos: 'top', size: 'lg' },
  { from: 160.0, to: 166.4, text: 'Te quería decir una cosa.', pos: 'top', size: 'md' },
  { from: 166.8, to: 173.2, text: 'Estoy muy orgulloso de ti.', pos: 'top', size: 'lg' },
  { from: 173.6, to: 180.0, text: 'Pero mucho, eh. Muchísimo.', pos: 'top', size: 'md' },
  { from: 180.4, to: 187.6, text: 'De lo que curras y de todo lo que le das a este país.', pos: 'top', size: 'md' },
  { from: 188.0, to: 195.6, text: 'Lo de María Economista empezó de broma y mira tú ;)', pos: 'top', size: 'md' },
  { from: 196.0, to: 204.3, text: 'Esto no es un final…', pos: 'top', size: 'lg' },
  { from: 204.5, to: 209.8, text: '…sino un principio para ti.', pos: 'top', size: 'lg' },
  { from: 221.0, to: 229.6, text: '¡Muchas gracias por tu contribución!', pos: 'bottom', size: 'lg' },
  { from: 230.0, to: 238.6, text: 'Te quiero.\nBorja <3', pos: 'bottom', size: 'md' },
];
