// Todo lo personalizable está aquí. Los tiempos son segundos del vídeo oficial de YouTube.
// Referencias medidas en el vídeo: "There's only me and you" ≈ 147.9 s, empieza el instrumental ≈ 152.5 s,
// "It's only me and you" ≈ 204.5 s, caída ≈ 210 s, "la-la-la" 212–238 s.

export const SONG = {
  videoId: 'M4qX5wzx-wY', // Harry Styles - Coming Up Roses (Official Video)
};

export const CUES = {
  start: 152.5,
  giftOpenStart: 152.6, // la tapa sale volando
  giftOpenEnd: 154.0,
  riseStart: 153.2, // el ramo sale de la caja
  riseEnd: 161,
  giftFadeStart: 157.5, // la caja se deshace
  giftFadeEnd: 160.5,
  bloomStart: 156,
  bloomEnd: 168,
  morphStart: 209.8,
  morphEnd: 221,
  end: 239,
};

// pos: 'top' (sobre el ramo) | 'bottom' (bajo el logo). size: 'md' | 'lg'.
// Se dibujan en ASCII con la misma fuente que el ramo: sin emojis (`<3` y `:)` sí).
export const CAPTIONS = [
  { from: 154.6, to: 159.0, text: 'Sé que estos últimos días han sido muy duros.', pos: 'top', size: 'md' },
  { from: 159.4, to: 164.2, text: 'Mucho trabajo, mucha presión, críticas y muy poco descanso.', pos: 'top', size: 'md' },
  { from: 164.6, to: 168.8, text: 'Y aun así no has dejado de dar lo mejor de ti.', pos: 'top', size: 'md' },
  { from: 169.2, to: 173.2, text: 'Como llevas haciendo estos dos años y medio.', pos: 'top', size: 'md' },
  { from: 173.6, to: 178.0, text: 'Hoy, en tu último día con el Gobierno que te nombró,', pos: 'top', size: 'md' },
  { from: 178.4, to: 183.6, text: 'quería poner en valor todo lo que has hecho con tu esfuerzo y tu sacrificio.', pos: 'top', size: 'md' },
  { from: 184.0, to: 187.6, text: 'Este pequeño reconocimiento es para ti,', pos: 'top', size: 'md' },
  { from: 188.0, to: 191.6, text: 'mi queridísima María Economista', pos: 'top', size: 'lg' },
  { from: 192.0, to: 196.0, text: '(empezó como una broma, pero fíjate qué lejos ha llegado)', pos: 'top', size: 'md' },
  { from: 196.4, to: 200.8, text: 'Estoy muy orgulloso de la mujer en la que te has convertido.', pos: 'top', size: 'md' },
  { from: 201.2, to: 204.3, text: 'Esto puede que sea un final…', pos: 'top', size: 'lg' },
  { from: 204.5, to: 209.6, text: '…pero también es el principio de todo lo que está por llegar.', pos: 'top', size: 'lg' },
  { from: 210.2, to: 214.8, text: 'Solo te esperan cosas grandes.', pos: 'top', size: 'lg' },
  { from: 215.2, to: 220.6, text: 'Porque estás destinada a triunfar.', pos: 'top', size: 'lg' },
  { from: 221.0, to: 229.6, text: '¡Muchas gracias por tu contribución!', pos: 'bottom', size: 'lg' },
  { from: 230.0, to: 238.6, text: 'Te quiero.\nBorja <3', pos: 'bottom', size: 'md' },
];
