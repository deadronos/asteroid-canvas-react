import { toRapierVector } from './spatial';
import type { GameEntity, ShipRuntimeState } from './types';

export function resetShipState(ship: ShipRuntimeState) {
  ship.hull = ship.blueprint.hull.maxHull;
  ship.armor = ship.blueprint.armor.maxArmor;
  ship.shield = ship.blueprint.shield.maxShield;
  ship.shieldDelay = 0;
  ship.manualCooldown = 0;
  ship.turretCooldowns = ship.blueprint.turrets.map(() => 0);
}

export function applyShipDamage(shipEntity: GameEntity, damage: number) {
  if (!shipEntity.ship) {
    return;
  }

  let remaining = damage;

  if (shipEntity.ship.shield > 0) {
    const absorbed = Math.min(shipEntity.ship.shield, remaining);
    shipEntity.ship.shield -= absorbed;
    remaining -= absorbed;
  }

  if (remaining > 0 && shipEntity.ship.armor > 0) {
    const mitigated = remaining * (1 - shipEntity.ship.blueprint.armor.mitigation);
    const absorbed = Math.min(shipEntity.ship.armor, mitigated);
    shipEntity.ship.armor -= absorbed;
    remaining = Math.max(0, mitigated - absorbed);
  }

  if (remaining > 0) {
    shipEntity.ship.hull = Math.max(0, shipEntity.ship.hull - remaining);
  }

  shipEntity.ship.shieldDelay = shipEntity.ship.blueprint.shield.rechargeDelay;

  if (shipEntity.ship.hull <= 0) {
    resetShipState(shipEntity.ship);
    shipEntity.body.setTranslation(toRapierVector(0, 0, 0), true);
    shipEntity.body.setLinvel(toRapierVector(0, 0, 0), true);
    shipEntity.body.setAngvel(toRapierVector(0, 0, 0), true);
  }
}