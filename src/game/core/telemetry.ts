import { useHudStore } from '../ui/useHudStore';

import type { GameEntity } from './types';

export function syncTelemetry(shipEntity: GameEntity, asteroidCount: number) {
  if (!shipEntity.ship) {
    return;
  }

  const blueprint = shipEntity.ship.blueprint;
  const speed = shipEntity.body.linvel();

  useHudStore.getState().updateTelemetry({
    shipName: blueprint.label,
    hull: shipEntity.ship.hull,
    maxHull: blueprint.hull.maxHull,
    armor: shipEntity.ship.armor,
    maxArmor: blueprint.armor.maxArmor,
    shield: shipEntity.ship.shield,
    maxShield: blueprint.shield.maxShield,
    speed: Math.sqrt(speed.x ** 2 + speed.z ** 2),
    asteroidCount,
    turretCount: blueprint.turrets.length,
  });
}
