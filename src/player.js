// Envoltorio mínimo de la IFrame API de YouTube.
const API_URL = 'https://www.youtube.com/iframe_api';
const API_TIMEOUT_MS = 10000;

function loadApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('YouTube no responde')), API_TIMEOUT_MS);
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timer);
      resolve(window.YT);
    };
    const s = document.createElement('script');
    s.src = API_URL;
    s.onerror = () => {
      clearTimeout(timer);
      reject(new Error('No se pudo cargar YouTube'));
    };
    document.head.append(s);
  });
}

// Resuelve cuando el reproductor está listo; rechaza si la API no carga o el vídeo no se puede embeber.
export async function createYouTubePlayer({ elementId, videoId, start, onError }) {
  const YT = await loadApi();
  return new Promise((resolve, reject) => {
    let ready = false;
    const player = new YT.Player(elementId, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: { start: Math.floor(start), playsinline: 1, controls: 1, rel: 0, fs: 0, disablekb: 1, iv_load_policy: 3 },
      events: {
        onReady: () => {
          ready = true;
          resolve({
            play: () => player.playVideo(),
            pause: () => player.pauseVideo(),
            seek: t => player.seekTo(t, true),
            time: () => player.getCurrentTime(),
            playing: () => player.getPlayerState() === YT.PlayerState.PLAYING,
          });
        },
        onError: e => {
          const err = new Error(`YouTube error ${e.data}`);
          if (ready) onError?.(err);
          else reject(err);
        },
      },
    });
  });
}
