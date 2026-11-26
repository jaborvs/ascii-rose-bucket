// Reloj de la canción. Avanza con el tiempo de pared para que la animación sea fluida,
// pero se corrige al tiempo real del reproductor cuando se desvía (buffering, saltos).
export function createSongClock({ start, maxDrift = 0.25 }) {
  const clock = {
    time: start,
    update({ dt, playing, playerTime }) {
      if (!playing) return clock.time;
      clock.time += dt;
      if (playerTime != null && Math.abs(clock.time - playerTime) > maxDrift) clock.time = playerTime;
      return clock.time;
    },
    reset(t) {
      clock.time = t;
    },
  };
  return clock;
}
