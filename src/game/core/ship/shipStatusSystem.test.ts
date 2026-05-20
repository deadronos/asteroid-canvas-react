import { beforeEach, describe, expect, it } from 'vitest';
import { ensureRapierReady } from '../rapier';
import { createGameSession } from '../createGameSession';
import { updateCooldowns, updateShipShields } from './shipStatusSystem';
import { useHudStore } from '../../ui/useHudStore';

describe('shipStatusSystem', () => {
  beforeEach(async () => {
    await ensureRapierReady();
  });

  it('does nothing on updateCooldowns if ship component is missing', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;
    const originalShip = ship.ship;
    delete ship.ship;

    expect(() => {
      updateCooldowns(ship, 1 / 60);
    }).not.toThrow();

    ship.ship = originalShip;
  });

  it('does nothing on updateShipShields if ship component is missing', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;
    const originalShip = ship.ship;
    delete ship.ship;

    expect(() => {
      updateShipShields(ship, 1 / 60);
    }).not.toThrow();

    ship.ship = originalShip;
  });

  it('decrements manual and turret cooldowns correctly', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;
    ship.ship!.manualCooldown = 0.5;
    ship.ship!.turretCooldowns = [0.2, 0.4];
    ship.ship!.shieldDelay = 1.0;

    updateCooldowns(ship, 0.1);

    expect(ship.ship!.manualCooldown).toBeCloseTo(0.4);
    expect(ship.ship!.turretCooldowns[0]).toBeCloseTo(0.1);
    expect(ship.ship!.turretCooldowns[1]).toBeCloseTo(0.3);
    expect(ship.ship!.shieldDelay).toBeCloseTo(0.9);
  });

  it('syncs autoTurrets property with useHudStore', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;

    useHudStore.setState({ autoTurretsEnabled: false });
    updateCooldowns(ship, 0.1);
    expect(ship.ship!.autoTurrets).toBe(false);

    useHudStore.setState({ autoTurretsEnabled: true });
    updateCooldowns(ship, 0.1);
    expect(ship.ship!.autoTurrets).toBe(true);
  });

  it('recharges shield when shieldDelay is zero and shield is less than max', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;
    const maxShield = ship.ship!.blueprint.shield.maxShield;

    ship.ship!.shield = maxShield - 20;
    ship.ship!.shieldDelay = 0;

    updateShipShields(ship, 1.0); // 1 second recharge

    const expectedShield = maxShield - 20 + ship.ship!.blueprint.shield.rechargePerSecond;
    expect(ship.ship!.shield).toBeCloseTo(expectedShield);
  });

  it('caps the shield recharge at maxShield', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;
    const maxShield = ship.ship!.blueprint.shield.maxShield;

    ship.ship!.shield = maxShield - 0.1;
    ship.ship!.shieldDelay = 0;

    updateShipShields(ship, 1.0);

    expect(ship.ship!.shield).toBe(maxShield);
  });

  it('does not recharge shield when shieldDelay is greater than zero', () => {
    const session = createGameSession();
    const ship = session.getPlayerShip()!;
    const maxShield = ship.ship!.blueprint.shield.maxShield;

    ship.ship!.shield = maxShield - 20;
    ship.ship!.shieldDelay = 0.5;

    updateShipShields(ship, 0.1);

    expect(ship.ship!.shield).toBe(maxShield - 20);
  });
});
