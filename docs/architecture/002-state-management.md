# Architectural Decision Record (ADR): State Management & UI Separation

## Status

Accepted

## Context

The game simulation runs at 60Hz, updating coordinates, velocities, timers, cooldowns, and collision states. Traditional React state management (`useState`, `useContext`) is not designed for high-frequency updates; triggering re-renders at 60fps for layout or telemetry indicators causes substantial rendering overhead, leading to stuttering and frame drops.

At the same time, we need a clean way to handle:

- App-level game flow transitions (`'menu'`, `'playing'`, `'gameover'`).
- Score and persistent high-score tracking.
- Interactive HUD elements (hull, armor, shield meters).
- Toggle options (auto-turrets).

## Decision

We separated the game state into two distinct boundaries:

1. **High-Frequency Simulation State (ECS/Physics)**: Handled imperatively within Miniplex and Rapier. Mesh rendering reads directly from these entities inside R3F frame tick callbacks.
2. **Low-Frequency UI and Control State (Zustand)**: Managed by a centralized Zustand store (`useHudStore.ts`).

```
[ Input Hook / Physics / Combat Systems ]
                   │
                   ▼ (Every frame tick)
        [ Telemetry Snapshot ]
                   │
                   ▼ (Direct state push)
          [ Zustand Store ]
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
    [ HUD Panel ]      [ Menu Overlays ]
```

### Telemetry Pipeline

Instead of binding React elements directly to active entity properties, the combat and ship systems calculate a lightweight `TelemetrySnapshot` structure at the end of the physics loop and push it to Zustand via:

```typescript
useHudStore.getState().updateTelemetry({ ... });
```

React HUD components then selectively select properties (e.g., `telemetry.hull`) using Zustand selectors. This ensures components only re-render when their specific subscribed value changes.

## Consequences

- **Performance**: High-frequency physics updates bypass the React reconciler, keeping CPU usage low and frame rates smooth.
- **Selective Re-rendering**: The HUD panel only updates elements when telemetry metrics (like health, speed, or asteroid counts) shift, rather than re-rendering the whole UI on every step.
- **SSR Safety**: The Zustand store implements safe checks (`typeof window !== 'undefined'`) when retrieving and writing high scores to `localStorage`.
- **Decoupled Architecture**: Logic systems are free to read Zustand values (e.g., bypassing damage if `gameState !== 'playing'`) directly without React-context coupling.
