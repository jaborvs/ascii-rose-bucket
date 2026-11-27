# Para María

Animación en ASCII minimalista a pantalla completa. Al tocar la portada se abre una caja de regalo y de ella sale
un ramo de rosas en 3D que se abre y gira mientras suena "Coming Up Roses" de Harry Styles, desde el instrumental
anterior a "It's only me and you". Los mensajes también salen en ASCII, el ramo se deshace en caracteres que forman
la Moncloa y al final aparece "¡Muchas gracias por tu contribución!".
Dura unos 87 segundos.

## Cómo verlo

La música viene del vídeo oficial de YouTube. **YouTube bloquea la reproducción en `localhost`** (error 150), así que
para verlo con música hay que publicarlo en un dominio real. Lo más sencillo es GitHub Pages, que es gratis.

### Publicar en GitHub Pages (una vez)

1. En github.com: **New repository**, con un nombre discreto (por ejemplo `para-maria`).
   Tiene que ser **Public**, porque Pages es gratis solo para repos públicos. No añadas README.
2. En esta carpeta:
   ```bash
   git remote add origin https://github.com/<tu-usuario>/para-maria.git
   git push -u origin main
   ```
3. En el repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `(root)` → Save**.
4. Al minuto estará en `https://<tu-usuario>.github.io/para-maria/`. Pásale ese enlace por WhatsApp.
   Se abre en el móvil y también en el ordenador.

La página lleva `noindex` para que no aparezca en buscadores. Aun así, la URL es pública.

### Al abrirlo

- Primero sale la caja de regalo cerrada: "para María". Al tocar empieza todo (los móviles exigen un toque para reproducir sonido).
- Si el móvil no deja arrancar la música desde ese toque (pasa en algunos iPhone), aparece el reproductor de YouTube
  para pulsar ▶. Después desaparece y la animación sigue sincronizada.
- Al terminar aparece "↻ Ver otra vez".

### Probar en local, sin música

```bash
npm run serve        # http://localhost:8080
```

`?t=<segundo>` empieza en otro punto de la canción, por ejemplo `?t=200` para ver el final.

## Personalizar

Todo está en `src/config.js`: textos, tiempos de cada frase y vídeo de YouTube.
Los textos se dibujan con la misma fuente monoespaciada que el ramo, así que mejor sin emojis (`<3` y `@}->--` sí).
Los tiempos son segundos del vídeo oficial.

## Desarrollo

```bash
npm test
```

No hace falta compilar ni instalar dependencias: son ES modules servidos tal cual.
El diseño está en `docs/plans/2026-11-26-ascii-rose-bouquet-design.md`.
