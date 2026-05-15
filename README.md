# Asteroid Canvas React

Minimal Vite + React + TypeScript scaffold for a raw HTML canvas spaceship game.

## Run

```bash
npm install
npm run dev
```

## Controls

- `W` / `ArrowUp`: thrust
- `A` / `ArrowLeft`: turn left
- `D` / `ArrowRight`: turn right
- `Space`: shoot

## Shape of the project

```txt
src/
  App.tsx                  React shell / normal UI
  game/
    SpaceCanvas.tsx        React wrapper around the canvas
    sim.ts                 Game state updates
    render.ts              Canvas drawing
    types.ts               Shared types
```

The important pattern is that fast-changing game state lives in refs/plain objects, not React state. React state is only used for slow HUD updates.
