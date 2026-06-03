import { useHudStore } from '../../ui/useHudStore';
import type { GameEntity } from '../types';

export function updateCooldowns(shipEntity: GameEntity, dt: number) {
  if (!shipEntity.ship) {
    return;
  }

  shipEntity.ship.manualCooldown = Math.max(0, shipEntity.ship.manualCooldown - dt);
  shipEntity.ship.turretCooldowns = shipEntity.ship.turretCooldowns.map((cooldown) =>
    Math.max(0, cooldown - dt),
  );
  shipEntity.ship.shieldDelay = Math.max(0, shipEntity.ship.shieldDelay - dt);
  shipEntity.ship.autoTurrets = useHudStore.getState().autoTurretsEnabled;
}

export function updateShipShields(shipEntity: GameEntity, dt: number) {
  if (!shipEntity.ship) {
    return;
  }

  const blueprint = shipEntity.ship.blueprint;

  if (shipEntity.ship.shieldDelay === 0 && shipEntity.ship.shield < blueprint.shield.maxShield) {
    shipEntity.ship.shield = Math.min(
      blueprint.shield.maxShield,
      shipEntity.ship.shield + blueprint.shield.rechargePerSecond * dt,
    );
  }
}
