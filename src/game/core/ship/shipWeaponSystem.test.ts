import { beforeEach, describe, expect, it } from 'vitest';
import { ensureRapierReady } from '../rapier';
import { createGameSession } from '../createGameSession';
import { fireManualWeapons, fireAutoTurrets, updateShipWeapons } from './shipWeaponSystem';
import { EMPTY_INPUT } from '../types';
import * as THREE from 'three';

describe('shipWeaponSystem', () => {
  beforeEach(async () => {
    await ensureRapierReady();
  });

  it('does nothing on fireManualWeapons / fireAutoTurrets / updateShipWeapons if ship component is missing', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;
    const originalShip = ship.ship;
    delete ship.ship;

    const mockSpawnApi = {
      spawnShip: () => ship,
      spawnAsteroid: () => ship,
      spawnProjectile: () => ship,
    };

    expect(() => {
      fireManualWeapons(ship, mockSpawnApi);
      fireAutoTurrets(ship, session, mockSpawnApi);
      updateShipWeapons(ship, 1 / 60, EMPTY_INPUT, session, mockSpawnApi, true);
    }).not.toThrow();

    ship.ship = originalShip;
  });

  it('skips fireManualWeapons if ship has no turrets in blueprint', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;
    const originalTurrets = ship.ship!.blueprint.turrets;
    ship.ship!.blueprint.turrets = [];

    let spawned = false;
    const mockSpawnApi = {
      spawnShip: () => ship,
      spawnAsteroid: () => ship,
      spawnProjectile: () => {
        spawned = true;
        return ship;
      },
    };

    fireManualWeapons(ship, mockSpawnApi);
    expect(spawned).toBe(false);

    ship.ship!.blueprint.turrets = originalTurrets;
  });

  it('fires manual weapons, spawns projectile, and sets manualCooldown', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;
    ship.ship!.manualCooldown = 0;

    let spawned = false;
    const mockSpawnApi = {
      spawnShip: () => ship,
      spawnAsteroid: () => ship,
      spawnProjectile: (
        origin: THREE.Vector3,
        direction: THREE.Vector3,
        speed: number,
        damage: number,
        owner: 'player' | 'turret',
        color: string,
      ) => {
        spawned = true;
        expect(owner).toBe('player');
        expect(color).toBe('#fff0b8');
        return ship;
      },
    };

    fireManualWeapons(ship, mockSpawnApi);
    expect(spawned).toBe(true);
    expect(ship.ship!.manualCooldown).toBe(0.18);
  });

  it('skips fireAutoTurrets when autoTurrets is disabled', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;
    ship.ship!.autoTurrets = false;

    let spawned = false;
    const mockSpawnApi = {
      spawnShip: () => ship,
      spawnAsteroid: () => ship,
      spawnProjectile: () => {
        spawned = true;
        return ship;
      },
    };

    fireAutoTurrets(ship, session, mockSpawnApi);
    expect(spawned).toBe(false);
  });

  it('skips fireAutoTurrets when there are no asteroids', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;
    ship.ship!.autoTurrets = true;

    // Clear asteroids
    for (const asteroid of Array.from(session.queries.asteroids)) {
      session.ecs.remove(asteroid);
    }

    let spawned = false;
    const mockSpawnApi = {
      spawnShip: () => ship,
      spawnAsteroid: () => ship,
      spawnProjectile: () => {
        spawned = true;
        return ship;
      },
    };

    fireAutoTurrets(ship, session, mockSpawnApi);
    expect(spawned).toBe(false);
  });

  it('auto-turrets targets nearest asteroid and spawns projectile', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;
    ship.ship!.autoTurrets = true;
    ship.ship!.turretCooldowns = [0, 0];

    // Put one asteroid close to ship and one far
    const asteroids = Array.from(session.queries.asteroids);
    const closeAsteroid = asteroids[0];
    closeAsteroid.body.setTranslation({ x: 0, y: 0, z: 2 }, true);

    for (let i = 1; i < asteroids.length; i++) {
      asteroids[i].body.setTranslation({ x: 1000, y: 1000, z: 1000 }, true);
    }

    let spawnCount = 0;
    const mockSpawnApi = {
      spawnShip: () => ship,
      spawnAsteroid: () => ship,
      spawnProjectile: (
        _origin: THREE.Vector3,
        _direction: THREE.Vector3,
        _speed: number,
        _damage: number,
        owner: 'player' | 'turret',
        _color: string,
      ) => {
        spawnCount++;
        expect(owner).toBe('turret');
        return ship;
      },
    };

    fireAutoTurrets(ship, session, mockSpawnApi);
    expect(spawnCount).toBe(2);
    expect(ship.ship!.turretCooldowns[0]).toBeGreaterThan(0);
    expect(ship.ship!.turretCooldowns[1]).toBeGreaterThan(0);
  });

  it('skips turret firing if cooldown is active', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;
    ship.ship!.autoTurrets = true;
    ship.ship!.turretCooldowns = [1.0, 1.0];

    let spawned = false;
    const mockSpawnApi = {
      spawnShip: () => ship,
      spawnAsteroid: () => ship,
      spawnProjectile: () => {
        spawned = true;
        return ship;
      },
    };

    fireAutoTurrets(ship, session, mockSpawnApi);
    expect(spawned).toBe(false);
  });

  it('does not target asteroid if it is out of range', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;
    ship.ship!.autoTurrets = true;
    ship.ship!.turretCooldowns = [0, 0];

    // Move all asteroids very far away
    for (const asteroid of Array.from(session.queries.asteroids)) {
      asteroid.body.setTranslation({ x: 5000, y: 5000, z: 5000 }, true);
    }

    let spawned = false;
    const mockSpawnApi = {
      spawnShip: () => ship,
      spawnAsteroid: () => ship,
      spawnProjectile: () => {
        spawned = true;
        return ship;
      },
    };

    fireAutoTurrets(ship, session, mockSpawnApi);
    expect(spawned).toBe(false);
  });

  it('triggers manual weapons through updateShipWeapons', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;
    ship.ship!.manualCooldown = 0;
    ship.ship!.autoTurrets = false;

    let spawned = false;
    const mockSpawnApi = {
      spawnShip: () => ship,
      spawnAsteroid: () => ship,
      spawnProjectile: (
        _origin: THREE.Vector3,
        _direction: THREE.Vector3,
        _speed: number,
        _damage: number,
        owner: 'player' | 'turret',
        _color: string,
      ) => {
        if (owner === 'player') {
          spawned = true;
        }
        return ship;
      },
    };

    updateShipWeapons(
      ship,
      1 / 60,
      {
        ...EMPTY_INPUT,
        fire: true,
      },
      session,
      mockSpawnApi,
      true,
    );

    expect(spawned).toBe(true);
  });

  it('does not fire auto-turrets when isPlaying is false (Bug #4)', () => {
    const session = createGameSession();
    session.setConfig({ gameState: 'menu', autoTurretsEnabled: true });

    const ship = session.getPlayerShip()!;
    ship.ship!.autoTurrets = true;
    ship.ship!.turretCooldowns = [0, 0];

    // Place an asteroid in range.
    const asteroids = Array.from(session.queries.asteroids);
    asteroids[0].body.setTranslation({ x: 0, y: 0, z: 2 }, true);

    let spawnCount = 0;
    const mockSpawnApi = {
      spawnShip: () => ship,
      spawnAsteroid: () => ship,
      spawnProjectile: () => {
        spawnCount += 1;
        return ship;
      },
    };

    // isPlaying = false (menu state) should suppress auto-turret firing
    // even though autoTurrets is true and there is a valid target.
    updateShipWeapons(ship, 1 / 60, EMPTY_INPUT, session, mockSpawnApi, false);

    expect(spawnCount).toBe(0);
  });

  it('does not fire auto-turrets when gameState is "gameover" (Bug #4)', () => {
    const session = createGameSession();
    session.setConfig({ gameState: 'gameover', autoTurretsEnabled: true });

    const ship = session.getPlayerShip()!;
    ship.ship!.autoTurrets = true;
    ship.ship!.turretCooldowns = [0, 0];

    const asteroids = Array.from(session.queries.asteroids);
    asteroids[0].body.setTranslation({ x: 0, y: 0, z: 2 }, true);

    let spawnCount = 0;
    const mockSpawnApi = {
      spawnShip: () => ship,
      spawnAsteroid: () => ship,
      spawnProjectile: () => {
        spawnCount += 1;
        return ship;
      },
    };

    updateShipWeapons(ship, 1 / 60, EMPTY_INPUT, session, mockSpawnApi, false);

    expect(spawnCount).toBe(0);
  });
});
