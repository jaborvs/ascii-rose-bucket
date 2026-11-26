export function ramp(t, a, b) {
  return Math.min(1, Math.max(0, (t - a) / (b - a)));
}

export function phaseAt(t, cues) {
  if (t < cues.morphStart) return 'bouquet';
  if (t < cues.morphEnd) return 'morph';
  if (t < cues.end) return 'logo';
  return 'end';
}

const FADE_IN = 0.25;
const FADE_OUT = 0.4;

// Subtítulo activo en t, escrito letra a letra y con fundido al final.
export function captionAt(t, captions) {
  const c = captions.find(c => t >= c.from && t <= c.to);
  if (!c) return null;
  const chars = [...c.text];
  const typeDur = Math.min(1.8, 0.45 * (c.to - c.from));
  const shown = Math.ceil(chars.length * ramp(t, c.from, c.from + typeDur));
  const opacity = Math.min(ramp(t, c.from, c.from + FADE_IN), 1 - ramp(t, c.to - FADE_OUT, c.to));
  return { ...c, text: chars.slice(0, shown).join(''), opacity };
}
