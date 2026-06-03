import { beforeEach, describe, expect, it } from 'vitest';

import { createGameSession } from './createGameSession';
import { EMPTY_INPUT } from './types';
import { ensureRapierReady } from './rapier';
import { DESPAWN_DISTANCE } from './sessionConstants';

describe('createProjectileSystems', () => {
  beforeEach(async () => {
    await ensureRapierReady();
  });

  it('despawns projectiles that exceed DESPAWN_DISTANCE from the ship', () => {
    const session = createGameSession();
    session.setConfig({ gameState: 'playing', autoTurretsEnabled: false });
    const ship = session.getPlayerShip()!;

    // Fire a single projectile from origin
    session.step(1 / 60, { ...EMPTY_INPUT, fire: true });

    expect(Array.from(session.queries.projectiles)).toHaveLength(1);

    // Move the ship far away from where the projectile was spawned.
    // The projectile flies forward (negative Z). Move the ship to positive Z,
    // so distance between ship and projectile grows each frame.
    ship.body.setTranslation({ x: 0, y: 0, z: DESPAWN_DISTANCE + 50 }, true);

    // Step once to trigger the despawn check
    session.step(1 / 60);

    // Projectile should be despawned — it's > DESPAWN_DISTANCE from the ship
    expect(Array.from(session.queries.projectiles)).toHaveLength(0);
  });

  it('does NOT despawn projectiles based on distance from world origin', () => {
    const session = createGameSession();
    session.setConfig({ gameState: 'playing', autoTurretsEnabled: false });
    const ship = session.getPlayerShip()!;

    // Move ship far from origin
    ship.body.setTranslation({ x: 200, y: 0, z: 200 }, true);

    // Fire — projectiles spawn near the ship at (200, 0, 200)
    session.step(1 / 60, { ...EMPTY_INPUT, fire: true });

    // Projectiles should still exist even though they're far from world origin
    const projectiles = Array.from(session.queries.projectiles);
    expect(projectiles.length).toBeGreaterThan(0);
  });

  it('cleans up expired projectiles regardless of distance', () => {
    const session = createGameSession();
    session.setConfig({ gameState: 'playing', autoTurretsEnabled: false });

    // Fire from origin
    session.step(1 / 60, { ...EMPTY_INPUT, fire: true });

    expect(Array.from(session.queries.projectiles)).toHaveLength(1);

    // Keep the ship at origin so projectile stays close (won't despawn by distance).
    // Step past the TTL (2.6 seconds) to force expiration.
    const stepsNeeded = Math.ceil(3.0 / (1 / 60));
    for (let i = 0; i < stepsNeeded; i++) {
      session.step(1 / 60);
    }

    expect(Array.from(session.queries.projectiles)).toHaveLength(0);
  });
});
