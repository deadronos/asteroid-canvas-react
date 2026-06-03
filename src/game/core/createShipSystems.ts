import type { GameEventBus } from './events';
import { applyShipDamage } from './shipState';
import { updateShipMovement } from './ship/shipMovementSystem';
import { updateCooldowns, updateShipShields } from './ship/shipStatusSystem';
import { updateShipWeapons } from './ship/shipWeaponSystem';
import type { EntityStore, SessionConfig, SpawnApi } from './sessionTypes';
import type { GameEntity, InputSnapshot } from './types';

export function createShipSystems(
  store: EntityStore,
  spawnApi: SpawnApi,
  config: SessionConfig,
  eventBus: GameEventBus,
) {
  const wrappedApplyShipDamage = (shipEntity: GameEntity, damage: number) => {
    applyShipDamage(shipEntity, damage, config, eventBus);
  };

  const updateShip = (shipEntity: GameEntity, dt: number, input: InputSnapshot) => {
    if (!shipEntity.ship) {
      return;
    }

    const isPlaying = config.gameState === 'playing';

    // 1. Update movement and controls
    updateShipMovement(shipEntity, dt, input, isPlaying);

    // 2. Decrement cooldowns and update status (shield delay, autoTurrets state)
    updateCooldowns(shipEntity, dt, config.autoTurretsEnabled);

    // 3. Recharge shields if applicable
    updateShipShields(shipEntity, dt);

    // 4. Update weapons (manual firing & auto-turrets targeting/firing)
    updateShipWeapons(shipEntity, dt, input, store, spawnApi, isPlaying);
  };

  return {
    applyShipDamage: wrappedApplyShipDamage,
    updateShip,
  };
}
