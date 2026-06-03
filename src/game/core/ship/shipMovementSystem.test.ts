import { beforeEach, describe, expect, it } from 'vitest';
import { ensureRapierReady } from '../rapier';
import { createGameSession } from '../createGameSession';
import { updateShipMovement } from './shipMovementSystem';
import { EMPTY_INPUT } from '../types';

describe('shipMovementSystem', () => {
  beforeEach(async () => {
    await ensureRapierReady();
  });

  it('does nothing if ship component is missing', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;

    // Temporarily delete the ship component
    const originalShip = ship.ship;
    delete ship.ship;

    expect(() => {
      updateShipMovement(ship, 1 / 60, EMPTY_INPUT, true);
    }).not.toThrow();

    // Restore
    ship.ship = originalShip;
  });

  it('applies forward thrust correctly', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;

    // Reset velocities
    ship.body.setLinvel({ x: 0, y: 0, z: 0 }, true);

    const input = {
      ...EMPTY_INPUT,
      forward: true,
    };

    updateShipMovement(ship, 1 / 60, input, true);

    const velocity = ship.body.linvel();
    expect(velocity.z).toBeLessThan(0);
  });

  it('applies backward (reverse) thrust correctly', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;

    ship.body.setLinvel({ x: 0, y: 0, z: 0 }, true);

    const input = {
      ...EMPTY_INPUT,
      backward: true,
    };

    updateShipMovement(ship, 1 / 60, input, true);

    const velocity = ship.body.linvel();
    expect(velocity.z).toBeGreaterThan(0);
  });

  it('applies lateral strafe thrust correctly', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;

    ship.body.setLinvel({ x: 0, y: 0, z: 0 }, true);

    const input = {
      ...EMPTY_INPUT,
      strafeRight: true,
    };

    updateShipMovement(ship, 1 / 60, input, true);

    const velocity = ship.body.linvel();
    expect(velocity.x).toBeGreaterThan(0);

    // Strafe left
    ship.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    const inputLeft = {
      ...EMPTY_INPUT,
      strafeLeft: true,
    };
    updateShipMovement(ship, 1 / 60, inputLeft, true);
    expect(ship.body.linvel().x).toBeLessThan(0);
  });

  it('applies yaw inputs correctly', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;

    ship.body.setAngvel({ x: 0, y: 0, z: 0 }, true);

    const input = {
      ...EMPTY_INPUT,
      yawLeft: true,
    };

    updateShipMovement(ship, 1 / 60, input, true);

    const angvel = ship.body.angvel();
    expect(angvel.y).toBeGreaterThan(0);

    // Yaw right
    ship.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    const inputRight = {
      ...EMPTY_INPUT,
      yawRight: true,
    };
    updateShipMovement(ship, 1 / 60, inputRight, true);
    expect(ship.body.angvel().y).toBeLessThan(0);
  });

  it('caps the speed at engines.maxSpeed', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;
    const maxSpeed = ship.ship!.blueprint.engines.maxSpeed;

    // Set excessively high velocity
    ship.body.setLinvel({ x: maxSpeed * 2, y: 0, z: maxSpeed * 2 }, true);

    updateShipMovement(ship, 1 / 60, EMPTY_INPUT, true);

    const velocity = ship.body.linvel();
    const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
    expect(speed).toBeCloseTo(maxSpeed, 1);
  });
});
