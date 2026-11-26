# Ramo de rosas ASCII para María — diseño

## Objetivo
Página web vertical (9:16, estética TikTok) que se abre desde un enlace en el móvil o en el ordenador:
ramo de rosas ASCII en 3D que sube desde abajo, florece y gira, sincronizado con
"Coming Up Roses" (Harry Styles) desde la sección instrumental previa a "It's only me and you";
mensajes de orgullo; el ramo se deshace en caracteres que forman el Palacio de la Moncloa + "LA MONCLOA";
cierre con "Muchas gracias por tu contribución".

## Decisiones
- **Sin build ni dependencias**: HTML + ES modules. Se publica tal cual en GitHub Pages.
- **Música**: vídeo oficial embebido con la IFrame API de YouTube (`M4qX5wzx-wY`, embebible).
  No se incluye el MP3 (copyright). Los móviles exigen un toque antes de reproducir audio:
  pantalla "toca para abrir". Si el navegador bloquea `playVideo()` desde nuestro botón (iOS),
  se muestra el reproductor para que ella pulse ▶ directamente.
- **Sincronía**: la animación se gobierna por el tiempo de la canción (`getCurrentTime()`), no por
  el reloj de pared; si el vídeo se para (buffering/anuncio) la animación espera.
  Sin YouTube (offline/bloqueado) la animación corre en silencio con aviso.
- **Tiempos** (segundos del vídeo oficial, medidos con transcripción por palabras):
  "There's only me and you" ≈ 147.9 s → instrumental 152.5–204.5 s → "It's only me and you" ≈ 204.5 s
  → caída 210–211 s → "la-la-la" 212–238 s → fin ≈ 239 s.
- **Render**: rejilla fija 64×68 celdas sobre `<canvas>`; rosas como superficie paramétrica
  (rosa "MATLAB"), z-buffer y sombreado por luminancia con rampa de caracteres; tallos con `| / \`.
- **Texto**: subtítulos HTML grandes estilo TikTok (legibles en móvil); el logo final va en la rejilla.
- **Privacidad**: solo nombre de pila y apodo; `noindex`.

## Módulos
| Módulo | Responsabilidad | Test |
|---|---|---|
| `src/clock.js` | Reloj de canción: sigue al reproductor, corrige deriva, espera en pausa, modo silencioso | sí |
| `src/timeline.js` | Fase y subtítulo (efecto máquina de escribir) para un tiempo dado | sí |
| `src/rose.js` | Geometría de rosa (apertura variable) y del ramo | sí |
| `src/raster.js` | Rejilla con z-buffer, rampa de luminancia | sí |
| `src/morph.js` | Plan de partículas ramo → logo | sí |
| `src/art.js` | Arte ASCII de la Moncloa con colores | sí |
| `src/player.js`, `src/main.js` | YouTube, bucle de render, UI TikTok | navegador |
