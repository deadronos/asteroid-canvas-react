# Asteroid Canvas React

Vite + React + TypeScript scaffold for a third-person ship prototype built around data-driven ship definitions, Miniplex entity queries, Rapier physics, and Zustand-powered HUD state.

## Run

```bash
npm install
npm run dev
```

## Current slice

- One configurable starter ship: `cruiser`
- Configurable ship systems: hull, armor, shield, turrets, engines, thrusters
- Third-person chase camera with direct player control
- Random asteroid spawning around the player
- Manual forward cannon fire plus toggleable turret auto-target/auto-fire
- Miniplex for the gameplay world, Rapier for body simulation, Zustand for HUD/UI state

## Controls

- `W` / `S` or `ArrowUp` / `ArrowDown`: accelerate and brake
- `A` / `D`: strafe left and right
- `Q` / `E` or `ArrowLeft` / `ArrowRight`: yaw the ship
- `Space`: fire the forward cannon
- `T`: toggle turret auto-target and auto-fire

## Project shape

```txt
src/
  App.tsx
  game/
    Game.tsx                  React Three Fiber scene and HUD
    config/
      ships.ts                Data-driven ship blueprints
    core/
      createGameSession.ts    Miniplex world + Rapier systems
      types.ts                Shared gameplay types
    ui/
      useHudStore.ts          Zustand HUD state
```

## Next scaffold steps

- Split systems from `createGameSession.ts` into ship, asteroid, projectile, and combat modules
- Add more ship blueprints and a ship selection flow
- Move rendering from primitive meshes to reusable ship/component prefabs
- Add score, waves, pickups, and damage feedback
- Add integration tests around spawning, collision, and turret targeting
