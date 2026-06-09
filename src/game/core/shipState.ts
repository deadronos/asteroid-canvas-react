import type { GameEventBus } from './events';
import { toRapierVector } from './vectorMath';
import type { SessionConfig } from './sessionTypes';
import type { GameEntity, ShipRuntimeState } from './types';

export function resetShipState(ship: ShipRuntimeState) {
  ship.hull = ship.blueprint.hull.maxHull;
  ship.armor = ship.blueprint.armor.maxArmor;
  ship.shield = ship.blueprint.shield.maxShield;
  ship.shieldDelay = 0;
  ship.manualCooldown = 0;
  ship.turretCooldowns = ship.blueprint.turrets.map(() => 0);
}

export function applyShipDamage(
  shipEntity: GameEntity,
  damage: number,
  config: SessionConfig,
  eventBus: GameEventBus,
) {
  if (!shipEntity.ship) {
    return;
  }

  if (config.gameState !== 'playing') {
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

  eventBus.emit('shipDamaged', { hull: shipEntity.ship.hull });

  if (shipEntity.ship.hull <= 0) {
    // Sync the core config so the rest of the simulation (damage gates,
    // weapon guards, etc.) sees the game-over state. The event below
    // reaches the UI layer, but `config` is the source of truth for the
    // core and must be updated here to avoid an infinite
    // gameover -> reset -> gameover loop.
    if (config.gameState === 'playing') {
      config.gameState = 'gameover';
      eventBus.emit('gameStateChange', { state: 'gameover' });
    }
    resetShipState(shipEntity.ship);
    shipEntity.body.setTranslation(toRapierVector(0, 0, 0), true);
    shipEntity.body.setLinvel(toRapierVector(0, 0, 0), true);
    shipEntity.body.setAngvel(toRapierVector(0, 0, 0), true);
  }
}
