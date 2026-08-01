# Color Field — EXP.02

Nullpunkt Lab experiment inspired by [vos9x.com](https://www.vos9x.com/) (Burocratik):
one fullscreen triangle, one fragment shader, scroll piped into uniforms.

## Stack

- **OGL** — minimal WebGL (no scene graph, no camera)
- **GSAP** — intro choreography
- **Lenis** — smooth scroll, velocity feeds `uVelocity`
- Vite + TypeScript

## Run

```
npm install
npm run dev   # http://localhost:5614
```

## How it works

1. `src/gl/shaders.ts` — value noise → 5-octave fbm → two-stage **domain
   warping** `fbm(p + fbm(p + fbm(p)))` → cosine palette.
2. `src/main.ts` — one rAF loop drives Lenis, telemetry and the renderer.
   Scroll progress travels through the noise field and shifts the palette
   phase; smoothed scroll velocity raises the warp amplitude.
3. `src/gl/ColorField.ts` — renderer wrapper: uniforms, DPR cap 2,
   delta-time mouse lerp.

## Make it yours

The whole mood lives in `palette()` in `src/gl/shaders.ts` — four `vec3`
values (IQ cosine palette). Edit them, save, watch HMR repaint the field.
