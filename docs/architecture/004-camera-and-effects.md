# Architectural Decision Record (ADR): Camera Tracking & Cinematic Controls

## Status
Accepted

## Context
In a 3D space flight simulator, camera movement is critical to the game's sense of speed, weight, and steering feedback. Binding the camera rigidly behind the ship feels robotic and static. 

Additionally, during non-playing states (Start Menu and Game Over screens), we want to present a premium visual experience that connects the player to the game world. Simply showing a static view or freezing the camera is standard and less engaging.

## Decision
We implemented a dynamic, state-aware **Chase Camera** component [ChaseCamera.tsx](file:///Users/openclaw/Github/asteroid-canvas-react/src/game/render/ChaseCamera.tsx). It uses a dual-mode behavior depending on the Zustand `gameState`:

```
                  ┌──────────────────────┐
                  │ Check HUD gameState  │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼ (playing)                       ▼ (menu / gameover)
   [ Active Chase Mode ]             [ Orbital Cinematic Mode ]
   - Positions behind ship           - Disables controls
   - Applies lerp/damping            - Increments camera angle (yaw)
   - Follows direction vector        - Sweeps 365 degrees
```

### Camera Modes
1. **Chase Mode (`gameState: 'playing'`)**:
   - The camera computes target vectors positioned slightly behind and above the player's ship.
   - Positional updates use linear interpolation (`THREE.MathUtils.lerp`) to simulate physical lag, giving the ship a heavier, drifting feel.
   - Rotational tracking uses spherical linear interpolation (`slerp`) on the ship's quaternions to smoothly track banking and steering maneuvers.
2. **Orbital Cinematic Mode (`gameState: 'menu' | 'gameover'`)**:
   - Ignores player look inputs.
   - Slowly increments an angle counter on each tick.
   - Positions itself at a fixed distance, revolving around the ship's position to show off details of the hull, weapons, and auto-turrets shooting at nearby asteroids.

## Consequences
- **Enhanced Aesthetics**: The rotating camera turns the start and gameover menus into a live, premium 3D background.
- **Improved Game Feel**: Damping on the chase camera highlights physical thrust and inertia, making flight feel less rigid.
- **Robust Integration**: The camera checks the global state reactively, instantly transitioning between modes without needing manual event wiring.
