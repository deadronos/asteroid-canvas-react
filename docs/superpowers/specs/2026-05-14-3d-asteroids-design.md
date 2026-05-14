# 3D Asteroids — Design Spec

**Date:** 2026-05-14
**Type:** Game

---

## Visual Identity

**Aesthetic:** Retro wireframe arcade — glowing neon edges on pure black, no solid fills.

**Color language:**
- Ship & bullets: cyan `#00ffff`
- Asteroids: magenta `#ff00ff`
- Thrust particles: yellow-white `#ffffaa`, fading
- Background: pure black `#000000`
- HUD text: cyan, monospace

**Rendering:** All meshes use `THREE.WireframeGeometry` with `THREE.AdditiveBlending`. Where shapes overlap, brightness stacks — creates natural bloom without post-processing.

---

## World & Camera

**Play volume:** Bounded 3D box ~40×40×20 units. Ship and asteroids wrap across all 6 faces (exit right, enter left; exit top, enter bottom; exit front, enter back).

**Camera:** Tethered orbit. Offset ~12 units behind, ~4 units above ship. Position lerps toward target at 0.08/frame. When thrusting, camera pull-back scales with speed (subtle, ~0.5× additional offset at full thrust).

---

## Ship

**Mesh:** Elongated octahedron (two pyramids base-to-base, stretched on Y). Cyan wireframe.

**Controls:**
- W / ArrowUp: thrust in facing direction
- A / ArrowLeft: yaw left
- D / ArrowRight: yaw right
- Space: fire bullet

**Physics:** Momentum-based. Velocity persists, drag coefficient ~0.98/frame. Thrust adds acceleration in facing direction.

**Collision:** Sphere radius 1.0.

**Thrust visual:** Hybrid particle system (see Particle System section).

---

## Asteroids

**Mesh:** Irregular convex polyhedra, 8–12 vertices, procedurally generated per asteroid. Magenta wireframe.

**Sizes:**

| Tier | Radius | Splits into | Points | Speed |
|------|--------|-------------|--------|-------|
| Large | 2.5 | 2 medium | 20 | slow |
| Medium | 1.5 | 2 small | 50 | medium |
| Small | 0.7 | destroyed | 100 | fast |

**Splitting:** Linear. Children inherit parent velocity + outward burst. Angular velocity random per child.

**Spawn:** 4 large asteroids at game start. Each cleared level spawns 4 + level large asteroids after 3s delay at screen edges.

**Collision:** Sphere matching tier radius.

---

## Bullets

**Mesh:** Small elongated octahedron, cyan.

**Behavior:** Fire from ship nose in facing direction at 30 units/s. Despawn after 1.5s. Max 5 on screen (oldest despawns if at cap).

**Collision:** Sphere-sphere intersection with asteroids. Bullet despawns on hit.

---

## Particle System

Pool of 200 line-segment particles.

**Thrust start burst:** 15–20 particles emitted at engine position, randomized backward velocity, fade over 0.3s.

**Continuous thrust:** 3–5 particles/frame at engine position.

**Each particle:** position, velocity, lifetime, opacity (fades to 0). No collision. Purely visual.

---

## HUD

HTML overlay positioned over canvas.

**Top-left panel** (semi-transparent black bg):
- `SCORE: 00000`
- `LEVEL: 1`

**Top-right panel:**
- Lives as `×3` text or ship icons

**Center messages:**
- `ASTEROIDS — PRESS ENTER TO START` (START state)
- `GAME OVER — PRESS ENTER TO RESTART` (GAME_OVER state, shows final score)

**Style:** Monospace font, cyan color, subtle glow via text-shadow.

---

## Game States

```
START → PLAYING (Enter)
PLAYING → SHIP_DESTROYED (collision)
PLAYING → LEVEL_CLEAR (all asteroids gone)
SHIP_DESTROYED → PLAYING (respawn, 2s invuln)
SHIP_DESTROYED → GAME_OVER (no lives left)
LEVEL_CLEAR → PLAYING (respawn asteroids)
GAME_OVER → START (Enter)
```

**Lives:** 3. No extra lives.

**Invulnerability:** 2s after respawn, ship blinks (alternates visible/invisible at 10Hz).

**Score:** Accumulates. Resets on page refresh (no persistence).

**Difficulty:** Fixed — same asteroid count and speed per level. Level progression is purely for scoring/counters.

---

## Build

Single sprint. One implementation pass. All features above in one deliverable.