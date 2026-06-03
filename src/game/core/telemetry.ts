import type { GameEventBus } from './events';
import { copyBodyLinvel } from './spatial';
import type { GameEntity } from './types';

export function syncTelemetry(
  shipEntity: GameEntity,
  asteroidCount: number,
  eventBus: GameEventBus,
) {
  if (!shipEntity.ship) {
    return;
  }

  const blueprint = shipEntity.ship.blueprint;
  const speed = copyBodyLinvel(shipEntity.body);

  eventBus.emit('telemetryUpdate', {
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
